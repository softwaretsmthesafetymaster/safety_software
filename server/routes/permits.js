import express from 'express';
import Permit from '../models/Permit.js';
import Company from '../models/Company.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
import reminderService from '../services/reminderService.js';

const router = express.Router();

// Generate permit number
const generatePermitNumber = (companyId) => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PTW${year}${month}${random}`;
};

/**
 * GET all permits for a company
 */
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status, plantId, type } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;
    if (plantId) filter.plantId = plantId;
    if (type) filter.types = { $in: [type] };

    const permits = await Permit.find(filter)
      .populate('requestedBy', 'name email')
      .populate('plantId', 'name code')
      .populate('approvals.approver', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Permit.countDocuments(filter);

    res.json({
      permits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * CREATE new permit
 */
router.post('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Extract approval config (company-specific)
    const approvalConfig = company.config?.modules?.ptw?.workflows?.approval || [];

    // Build permit data
    const permitData = {
      ...req.body,
      companyId,
      requestedBy: req.user._id, // always enforce
      permitNumber: await generatePermitNumber(company), // proper format
      approvals: approvalConfig.map((step, index) => ({
        step: index + 1,
        role: step.role,
        required: step.required ?? true,
        status: 'pending'
      }))
    };

    const permit = new Permit(permitData);
    await permit.save();

    // Populate relational fields
    await permit.populate([
      { path: 'requestedBy', select: 'name email' },
      { path: 'plantId', select: 'name code' }
    ]);

    // Schedule expiry reminder
    if (permit.schedule?.endDate) {
      await reminderService.schedulePermitExpiryReminder(permit);
    }

    res.status(201).json({
      message: 'Permit created successfully',
      permit
    });
  } catch (error) {
    console.error('Error creating permit:', error);
    res.status(500).json({ message: error.message });
  }
});


/**
 * GET permit by ID
 */
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const permit = await Permit.findOne({ _id: id, companyId })
      .populate('requestedBy', 'name email role')
      .populate('plantId', 'name code areas')
      .populate('approvals.approver', 'name role email')
      .populate('signatures.user', 'name role');

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    res.json({ permit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * UPDATE permit
 */
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const permit = await Permit.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('requestedBy', 'name email')
      .populate('plantId', 'name code');

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    res.json({
      message: 'Permit updated successfully',
      permit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * SUBMIT permit for approval
 */
router.post('/:companyId/:id/submit', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const permit = await Permit.findOne({ _id: id, companyId });

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }
    if (permit.status !== 'draft') {
      return res.status(400).json({ message: 'Permit already submitted' });
    }

    permit.status = 'submitted';

    // Activate first approval step
    if (permit.approvals?.length > 0) {
      permit.approvals[0].status = 'pending';
    }

    await permit.save();

    await notificationService.notifyPermitSubmitted(permit);

    res.json({
      message: 'Permit submitted for approval',
      permit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * APPROVE / REJECT permit
 */
router.post('/:companyId/:id/approve', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { decision, comments } = req.body;

    const permit = await Permit.findOne({ _id: id, companyId });
    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    const currentApproval = permit.approvals.find(app => app.status === 'pending');
    if (!currentApproval) {
      return res.status(400).json({ message: 'No pending approval found' });
    }

    currentApproval.approver = req.user._id;
    currentApproval.status = decision === 'approve' ? 'approved' : 'rejected';
    currentApproval.comments = comments;
    currentApproval.timestamp = new Date();

    if (decision === 'approve') {
      const nextStep = permit.approvals.find(a => a.step === currentApproval.step + 1);
      if (nextStep) {
        nextStep.status = 'pending';
      } else {
        permit.status = 'approved';
        await notificationService.notifyPermitApproved(permit);
      }
    } else {
      permit.status = 'rejected';
    }

    await permit.save();

    res.json({
      message: `Permit ${decision}d successfully`,
      permit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET dashboard statistics
 */
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [total, active, expired, pending, recentPermits] = await Promise.all([
      Permit.countDocuments({ companyId }),
      Permit.countDocuments({ companyId, status: 'active' }),
      Permit.countDocuments({ companyId, status: 'expired' }),
      Permit.countDocuments({ companyId, status: { $in: ['submitted', 'approved'] } }),
      Permit.find({ companyId })
        .populate('requestedBy', 'name')
        .populate('plantId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      stats: { total, active, expired, pending, recentPermits }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
