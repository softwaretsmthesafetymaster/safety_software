import express from 'express';
import BBSReport from '../models/BBSReport.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';

import { 
  validateBBSCreation, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';

import coachingRoutes from './coaching.js';
import gameRoutes from './games.js';
import UserProgress from '../models/UserProgress.js';
const router = express.Router();

router.use('', coachingRoutes);
router.use('', gameRoutes);


//Get User Achievements
router.get('/:companyId/achievements/:userId',
  validateCompanyId,
  validateObjectId('userId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, userId } = req.params;
      
      const achievements = await UserProgress.find({ companyId, userId, isActive: true })
        .populate('moduleId', 'title description difficulty duration topics')
        .sort({ createdAt: -1 });

      res.json({ achievements });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all BBS reports for a company
router.get('/:companyId', 
  validateCompanyId, 
  validatePagination, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status, type, plantId } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;
    if (type) filter.observationType = type;
    if (plantId) filter.plantId = plantId;

    const reports = await BBSReport.find(filter)
      .populate('observer', 'name email')
      .populate('plantId', 'name code')
      .populate('correctiveActions.assignedTo', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BBSReport.countDocuments(filter);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new BBS report
router.post('/:companyId', 
  validateCompanyId, 
  validateBBSCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const reportData = {
      ...req.body,
      companyId,
      observer: req.user._id,
      reportNumber: await NumberGenerator.generateNumber(companyId, 'bbs')
    };
    const report = new BBSReport(reportData);
    await report.save();

    await report.populate('observer', 'name email');
    await report.populate('plantId', 'name code');

    res.status(201).json({
      message: 'BBS report created successfully',
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get BBS report by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const report = await BBSReport.findOne({ _id: id, companyId })
      .populate('observer', 'name email role')
      .populate('plantId', 'name code areas')
      .populate('correctiveActions.assignedTo', 'name role email');

    if (!report) {
      return res.status(404).json({ message: 'BBS report not found' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update BBS report
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const report = await BBSReport.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    ).populate('observer', 'name email')
     .populate('plantId', 'name code');

    if (!report) {
      return res.status(404).json({ message: 'BBS report not found' });
    }

    res.json({
      message: 'BBS report updated successfully',
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Review BBS report
router.post('/:companyId/:id/review', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { reviewDecision, reviewComments, correctiveActions, reassignReason } = req.body;

    const report = await BBSReport.findOne({ _id: id, companyId });
    if (!report) {
      return res.status(404).json({ message: 'BBS report not found' });
    }

    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.reviewComments = reviewComments;
    report.reviewDecision = reviewDecision;

    if (reviewDecision === 'approve') {
      report.status = 'approved';
      if (correctiveActions && correctiveActions.length > 0) {
        report.correctiveActions = correctiveActions;
      }
      else{
        return res.status(400).json({ message: 'No corrective actions provided' });
      }
    } else {
      report.status = 'open';
      report.reassignReason = reassignReason;
    }

    await report.save();

    res.json({
      message: `BBS report ${reviewDecision}d successfully`,
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete BBS action
router.post('/:companyId/:id/complete', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { completionEvidence, effectivenessRating, lessonsLearned, completionComments, evidencePhotos } = req.body;

    const report = await BBSReport.findOne({ _id: id, companyId });
    if (!report) {
      return res.status(404).json({ message: 'BBS report not found' });
    }
    report.correctiveActions.forEach(action => {
     
      if (action.assignedTo._id.toString() === req.user._id.toString()) {
        action.status = 'pending_closure';
        action.completionEvidence = completionEvidence || '';
        action.effectivenessRating = effectivenessRating || 0;
        action.lessonsLearned = lessonsLearned || '';
        action.completionComments = completionComments || '';
        action.evidencePhotos = evidencePhotos || '';
      }
    });
    if (report.correctiveActions.every(action => action.status === 'pending_closure')) {
      report.status = 'pending_closure';
      report.completedBy = req.user._id;
      report.completedAt = new Date();
    }

    await report.save();

    res.json({
      message: 'BBS action completion submitted successfully',
      report
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Close BBS report
router.post('/:companyId/:id/close', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { approvalDecision, closureComments } = req.body;

    const report = await BBSReport.findOne({ _id: id, companyId });
    if (!report) {
      return res.status(404).json({ message: 'BBS report not found' });
    }

    if (approvalDecision === 'approve') {
      report.approvedBy = req.user._id;
      report.approvedAt = new Date();
      report.correctiveActions.forEach(action => {
        action.status='completed';
      });
      report.status = 'closed';
    } else {
      report.status = 'approved'; // Back to approved for reassignment
      report.correctiveActions.forEach(action => {
        action.status='pending';
      });
    }

    await report.save();

    res.json({
      message: `BBS report ${approvalDecision === 'approve' ? 'closed' : 'reassigned'} successfully`,
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get BBS statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      open,
      closed,
      unsafeActs,
      unsafeConditions,
      safeBehaviors,
      recentReports
    ] = await Promise.all([
      BBSReport.countDocuments({ companyId }),
      BBSReport.countDocuments({ companyId, status: 'open' }),
      BBSReport.countDocuments({ companyId, status: 'closed' }),
      BBSReport.countDocuments({ companyId, observationType: 'unsafe_act' }),
      BBSReport.countDocuments({ companyId, observationType: 'unsafe_condition' }),
      BBSReport.countDocuments({ companyId, observationType: 'safe_behavior' }),
      BBSReport.find({ companyId })
        .populate('observer', 'name')
        .populate('plantId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      stats: {
        total,
        open,
        closed,
        unsafeActs,
        unsafeConditions,
        safeBehaviors,
        recentReports
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


export default router;