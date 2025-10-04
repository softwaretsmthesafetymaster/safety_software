import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';
import HAZOP from '../models/HAZOP.js';
const router = express.Router();

// Send notifications to team members for HAZOP
router.post('/send-team-notification', async (req, res) => {
  try {
    const { companyId, studyId, type,  } = req.body
    
      const hazop = await HAZOP.findById(studyId)
      const recipients = [hazop.chairman, hazop.scribe, ...hazop.team.map(t => t.member)]
  
    if (!companyId || !studyId || !type || !recipients) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const NotificationServiceInstance = NotificationService

    // Prepare notifications
    const notifications = recipients.map(userId => ({
      title: 'HAZOP Study Assigned',
      message: `You have been assigned to a HAZOP study. Study ID: ${studyId}`,
      type: 'info',
      userId,
      companyId,
      metadata: {
        hazopId: studyId,
        type
      },
      sendEmail: true
    }))

    await NotificationServiceInstance.createBulkNotifications(notifications)

    res.status(200).json({ message: 'Notifications sent successfully' })
  } catch (error) {
    console.error('Error sending HAZOP notifications:', error)
    res.status(500).json({ message: 'Server error' })
  }
})


// Get all notifications for a company
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const filter = { 
      companyId,
      $or: [
        { userId: req.user._id },
        { userId: { $exists: false } }
      ]
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const unreadCount = await Notification.countDocuments({
      ...filter,
      read: false
    });

    res.json({
      notifications,
      unreadCount,
      total: await Notification.countDocuments(filter)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create notification
router.post('/', authenticate, async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      companyId: req.user.companyId
    };

    const notification = new Notification(notificationData);
    await notification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.patch('/:companyId/:id/read', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id, 
        companyId,
        $or: [
          { userId: req.user._id },
          { userId: { $exists: false } }
        ]
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notificationId: id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.patch('/:companyId/read-all', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    await Notification.updateMany(
      { 
        companyId,
        $or: [
          { userId: req.user._id },
          { userId: { $exists: false } }
        ],
        read: false
      },
      { read: true }
    );

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      companyId,
      $or: [
        { userId: req.user._id },
        { userId: { $exists: false } }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;