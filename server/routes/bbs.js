import express from 'express';
import BBSReport from '../models/BBSReport.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';

const router = express.Router();

// Generate BBS report number
const generateReportNumber = (companyId) => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `BBS${year}${month}${day}${random}`;
};

// Get all BBS reports for a company
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
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
router.post('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const reportData = {
      ...req.body,
      companyId,
      observer: req.user._id,
      reportNumber: generateReportNumber(companyId)
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