import express from 'express';
import Audit from '../models/Audit.js';
import Observation from '../models/Observation.js';
import Company from '../models/Company.js';
import mongoose from 'mongoose';
import ChecklistTemplate from '../models/ChecklistTemplate.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';
import { generateAuditReport } from '../utils/reportGenerator.js';

const router = express.Router();

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
      .populate('templateId', 'name standard')
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
      auditNumber: await NumberGenerator.generateNumber(companyId, 'audit')
    };
    
    const audit = new Audit(auditData);
    
    await audit.save();
    

    await audit.populate('auditor', 'name email');
    await audit.populate('plantId', 'name code');
    await audit.populate('templateId', 'name standard');
    
    res.status(201).json({
      message: 'Audit created successfully',
      audit
    });
  } catch (error) {
    console.log(error);
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
      .populate('templateId', 'name standard description')
      .populate('auditTeam.member', 'name role email')
      .populate('auditee', 'name role')
      .populate('observations');

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
     .populate('plantId', 'name code')
     .populate('templateId', 'name standard');

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

// Start audit
router.post('/:companyId/:id/start', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const audit = await Audit.findOneAndUpdate(
      { _id: id, companyId },
      { 
        status: 'in_progress',
        actualDate: new Date()
      },
      { new: true }
    );

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({
      message: 'Audit started successfully',
      audit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Close audit
router.post('/:companyId/:id/close', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { closureComments } = req.body;

    // Check if all observations are approved
    const observations = await Observation.find({ auditId: id });
    const pendingObservations = observations.filter(obs => obs.status !== 'approved');
    
    if (pendingObservations.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot close audit. There are pending observations that need to be approved.' 
      });
    }

    const audit = await Audit.findOneAndUpdate(
      { _id: id, companyId },
      {
        status: 'closed',
        closedBy: req.user._id,
        closedAt: new Date(),
        closureComments
      },
      { new: true }
    );

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }

    res.json({
      message: 'Audit closed successfully',
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
      closed,
      avgCompliance,
      recentAudits,
      observationStats
    ] = await Promise.all([
      Audit.countDocuments({ companyId }),
      Audit.countDocuments({ companyId, status: 'planned' }),
      Audit.countDocuments({ companyId, status: { $in: ['in_progress', 'checklist_completed', 'observations_pending'] } }),
      Audit.countDocuments({ companyId, status: 'completed' }),
      Audit.countDocuments({ companyId, status: 'closed' }),
      Audit.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), 'summary.compliancePercentage': { $exists: true } } },
        { $group: { _id: null, avgCompliance: { $avg: '$summary.compliancePercentage' } } }
      ]),
      Audit.find({ companyId })
        .populate('auditor', 'name')
        .populate('plantId', 'name')
        .populate('templateId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Observation.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
          $group: {
            _id: { $toLower: '$status' }, // normalize statuses
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const observationCounts = observationStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      stats: {
        total,
        planned,
        inProgress,
        completed,
        closed,
        avgCompliance: avgCompliance[0]?.avgCompliance || 0,
        recentAudits,
        observations: {
          total: Object.values(observationCounts).reduce((a, b) => a + b, 0),
          open: observationCounts.open || 0,
          assigned: observationCounts.assigned || 0,
          in_progress: observationCounts.in_progress || 0,
          completed: observationCounts.completed || 0,
          approved: observationCounts.approved || 0,
          rejected: observationCounts.rejected || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Generate audit report
router.get('/:companyId/:id/report/:format', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id, format } = req.params;
    
    const audit = await Audit.findOne({ _id: id, companyId })
      .populate('auditor', 'name email')
      .populate('plantId', 'name code address')
      .populate('templateId', 'name standard')
      .populate('auditTeam.member', 'name role')
      .populate('observations')
      .populate({
        path: 'observations',
        populate: {
          path: 'responsiblePerson',
          select: 'name role'
        }
      });

    if (!audit) {
      return res.status(404).json({ message: 'Audit not found' });
    }
    const company = await Company.findById(companyId);

    const reportBuffer = await generateAuditReport(audit, format, company);
    
    const filename = `Audit_Report_${audit.auditNumber}.${format}`;
    
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(reportBuffer);
  } catch (error) {
    console.log("Error in report download: ",error)
    res.status(500).json({ message: error.message });
  }
});

function getContentType(format) {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'word':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

export default router;