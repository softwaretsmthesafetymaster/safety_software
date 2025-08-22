import express from 'express';
import Audit from '../models/Audit.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';

const router = express.Router();

// Generate audit number
const generateAuditNumber = (companyId) => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `AUD${year}${month}${random}`;
};

// Get all audits for a company
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status, type, plantId } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (plantId) filter.plantId = plantId;

    const audits = await Audit.find(filter)
      .populate('auditor', 'name email')
      .populate('plantId', 'name code')
      .populate('auditTeam.member', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Audit.countDocuments(filter);

    res.json({
      audits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new audit
router.post('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const auditData = {
      ...req.body,
      companyId,
      auditor: req.user._id,
      auditNumber: generateAuditNumber(companyId)
    };

    const audit = new Audit(auditData);
    await audit.save();

    await audit.populate('auditor', 'name email');
    await audit.populate('plantId', 'name code');

    res.status(201).json({
      message: 'Audit created successfully',
      audit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get audit by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const audit = await Audit.findOne({ _id: id, companyId })
      .populate('auditor', 'name email role')
      .populate('plantId', 'name code areas')
      .populate('auditTeam.member', 'name role email')
      .populate('auditee', 'name role')
      .populate('findings.correctiveAction.assignedTo', 'name role');

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({ audit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update audit
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const audit = await Audit.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    ).populate('auditor', 'name email')
     .populate('plantId', 'name code');

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({
      message: 'Audit updated successfully',
      audit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get audit statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      planned,
      inProgress,
      completed,
      avgCompliance,
      recentAudits
    ] = await Promise.all([
      Audit.countDocuments({ companyId }),
      Audit.countDocuments({ companyId, status: 'planned' }),
      Audit.countDocuments({ companyId, status: 'in_progress' }),
      Audit.countDocuments({ companyId, status: 'completed' }),
      Audit.aggregate([
        { $match: { companyId: companyId, 'summary.compliancePercentage': { $exists: true } } },
        { $group: { _id: null, avgCompliance: { $avg: '$summary.compliancePercentage' } } }
      ]),
      Audit.find({ companyId })
        .populate('auditor', 'name')
        .populate('plantId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      stats: {
        total,
        planned,
        inProgress,
        completed,
        avgCompliance: avgCompliance[0]?.avgCompliance || 0,
        recentAudits
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;