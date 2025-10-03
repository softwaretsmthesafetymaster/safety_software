import express from 'express';
import VideoLibrary from '../models/VideoLibrary.js';
import VideoAssignment from '../models/VideoAssignment.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import { validateObjectId, validateCompanyId, validate } from '../middleware/validation.js';

const router = express.Router();

// Get video library for a plant
router.get('/:companyId/videos',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { plantId, category, tags } = req.query;
      
      const filter = { companyId, isActive: true };
      
      // Plant head can see only their plant's videos, others see all
      if (req.user.role === 'plant_head' || plantId) {
        filter.plantId = plantId || req.user.plantId;
      }
      
      if (category) filter.category = category;
      if (tags) filter.tags = { $in: tags.split(',') };
      
      const videos = await VideoLibrary.find(filter)
        .populate('createdBy', 'name role')
        .populate('plantId', 'name')
        .sort({ createdAt: -1 });
      
      res.json({ videos });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    }
  }
);

// Create video
router.post('/:companyId/videos',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Extract YouTube video ID for thumbnail
      const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };

      const videoId = getYouTubeVideoId(req.body.youtubeUrl);
      const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
      
      const videoData = {
        ...req.body,
        companyId,
        plantId: req.user.plantId || req.body.plantId,
        createdBy: req.user._id,
        thumbnailUrl
      };

      const video = new VideoLibrary(videoData);
      await video.save();
      
      await video.populate('createdBy', 'name role');
      await video.populate('plantId', 'name');
      
      res.status(201).json({
        message: 'Video added to library successfully',
        video
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    }
  }
);

// Update video
router.patch('/:companyId/videos/:videoId',
  validateCompanyId,
  validateObjectId('videoId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, videoId } = req.params;
      
      const video = await VideoLibrary.findOneAndUpdate(
        { _id: videoId, companyId, createdBy: req.user._id },
        req.body,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name role')
       .populate('plantId', 'name');

      if (!video) {
        return res.status(404).json({ message: 'Video not found or unauthorized' });
      }

      res.json({
        message: 'Video updated successfully',
        video
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete video
router.delete('/:companyId/videos/:videoId',
  validateCompanyId,
  validateObjectId('videoId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, videoId } = req.params;
      
      const video = await VideoLibrary.findOneAndUpdate(
        { _id: videoId, companyId, createdBy: req.user._id },
        { isActive: false },
        { new: true }
      );

      if (!video) {
        return res.status(404).json({ message: 'Video not found or unauthorized' });
      }

      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Assign video to user
router.post('/:companyId/videos/:videoId/assign',
  validateCompanyId,
  validateObjectId('videoId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, videoId } = req.params;
      const { userId, dueDate } = req.body;

      // Check if video exists and belongs to same plant
      const video = await VideoLibrary.findOne({ 
        _id: videoId, 
        companyId,
        plantId: req.user.plantId 
      });
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      const assignmentData = {
        videoId,
        userId,
        companyId,
        plantId: req.user.plantId,
        assignedBy: req.user._id,
        dueDate: dueDate ? new Date(dueDate) : undefined
      };

      // Check if already assigned
      const existingAssignment = await VideoAssignment.findOne({
        videoId,
        userId,
        companyId
      });

      if (existingAssignment) {
        return res.status(400).json({ message: 'Video already assigned to this user' });
      }

      const assignment = new VideoAssignment(assignmentData);
      await assignment.save();

      await assignment.populate('videoId', 'title duration');
      await assignment.populate('userId', 'name email');

      res.json({
        message: 'Video assigned successfully',
        assignment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get assigned videos for user
router.get('/:companyId/videos/assigned/:userId',
  validateCompanyId,
  validateObjectId('userId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, userId } = req.params;
      
      const assignments = await VideoAssignment.find({ 
        userId, 
        companyId,
        plantId: req.user.plantId 
      })
        .populate('videoId', 'title description youtubeUrl duration category tags thumbnailUrl')
        .populate('assignedBy', 'name role')
        .sort({ createdAt: -1 });
      
      res.json({ assignments });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update video progress
router.patch('/:companyId/videos/:videoId/progress',
  validateCompanyId,
  validateObjectId('videoId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, videoId } = req.params;
      const { watchProgress, status, rating, feedback, notes } = req.body;

      const updateData = {
        watchProgress,
        status
      };

      if (status === 'watched' && !req.body.watchedAt) {
        updateData.watchedAt = new Date();
      }

      if (status === 'completed') {
        updateData.completedAt = new Date();
        updateData.watchProgress = 100;
      }

      if (rating) updateData.rating = rating;
      if (feedback) updateData.feedback = feedback;
      if (notes) updateData.notes = notes;

      const assignment = await VideoAssignment.findOneAndUpdate(
        { videoId, userId: req.user._id, companyId },
        updateData,
        { new: true }
      );

      // Update video view count and rating
      if (status === 'watched' || status === 'completed') {
        await VideoLibrary.findByIdAndUpdate(videoId, { 
          $inc: { viewCount: 1 }
        });

        if (rating) {
          // Calculate new average rating
          const assignments = await VideoAssignment.find({ 
            videoId, 
            rating: { $exists: true } 
          });
          
          const avgRating = assignments.reduce((sum, a) => sum + a.rating, 0) / assignments.length;
          
          await VideoLibrary.findByIdAndUpdate(videoId, { 
            averageRating: Math.round(avgRating * 10) / 10 
          });
        }
      }

      res.json({
        message: 'Video progress updated successfully',
        assignment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get my assigned videos (for current user)
router.get('/:companyId/videos/my-assignments',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId } = req.params;
      
      const assignments = await VideoAssignment.find({ 
        userId: req.user._id, 
        companyId 
      })
        .populate('videoId', 'title description youtubeUrl duration category tags thumbnailUrl')
        .populate('assignedBy', 'name role')
        .sort({ createdAt: -1 });

      res.json({ assignments });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;