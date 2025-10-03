import express from 'express';
import Observation from '../models/Observation.js';
import Audit from '../models/Audit.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import NumberGenerator from '../utils/numberGenerator.js';

const router = express.Router();

// Get observations for an audit
router.get('/:companyId/audit/:auditId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    console.log(req.params);
    const { companyId, auditId } = req.params;
    const { status, riskLevel } = req.query;

    const filter = { companyId, auditId };
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;

    const observations = await Observation.find(filter)
      .populate('responsiblePerson', 'name role email')
      .populate('assignedBy', 'name role')
      .populate('completionDetails.completedBy', 'name')
      .populate('approvalDetails.approvedBy', 'name')
      .sort({ createdAt: -1 });
    console.log(observations);
    res.json({ observations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new observation with AI risk assessment
router.post('/:companyId/audit/:auditId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, auditId } = req.params;
    
    // Get AI risk assessment
    const aiAnalysis = await aiService.calculateRiskScore(req.body);
    
    const observationData = {
      ...req.body,
      companyId,
      auditId,
      assignedBy: req.user._id,
      observationNumber: await NumberGenerator.generateNumber(companyId, 'observation'),
      riskScore: aiAnalysis.riskScore,
      riskLevel: aiAnalysis.riskLevel,
      aiRiskAnalysis: {
        confidence: aiAnalysis.confidence,
        factors: aiAnalysis.factors,
        similarIncidents: aiAnalysis.similarIncidents,
        recommendations: aiAnalysis.recommendations
      }
    };

    const observation = new Observation(observationData);
    await observation.save();

    // Update audit observations array
    await Audit.findByIdAndUpdate(auditId, {
      $push: { observations: observation._id }
    });

    await observation.populate('responsiblePerson', 'name role email');
    await observation.populate('assignedBy', 'name role');

    res.status(201).json({
      message: 'Observation created successfully',
      observation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update observation
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    
    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId },
      req.body,
      { new: true, runValidators: true }
    ).populate('responsiblePerson', 'name role email')
     .populate('assignedBy', 'name role');

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    res.json({
      message: 'Observation updated successfully',
      observation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete observation
router.post('/:companyId/:id/complete', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { completionNotes, evidenceFiles, effectivenessRating } = req.body;
    
    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId },
      {
        status: 'completed',
        completionDetails: {
          completedDate: new Date(),
          completedBy: req.user._id,
          completionNotes,
          evidenceFiles: evidenceFiles || [],
          effectivenessRating
        }
      },
      { new: true }
    ).populate('responsiblePerson', 'name role email');

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    res.json({
      message: 'Observation completed successfully',
      observation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve/Reject observation
router.post('/:companyId/:id/approve', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { action, approvalNotes, rejectionReason } = req.body; // action: 'approve' or 'reject'
    
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approvalDetails: {
        approvedBy: req.user._id,
        approvedDate: new Date(),
        approvalNotes: action === 'approve' ? approvalNotes : undefined,
        rejectionReason: action === 'reject' ? rejectionReason : undefined
      }
    };

    // If rejected, reset to in_progress
    if (action === 'reject') {
      updateData.status = 'in_progress';
    }

    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId, status: 'completed' },
      updateData,
      { new: true }
    ).populate('responsiblePerson', 'name role email')
     .populate('approvalDetails.approvedBy', 'name');

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found or not ready for approval' });
    }

    res.json({
      message: `Observation ${action}d successfully`,
      observation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reassign observation
router.post('/:companyId/:id/reassign', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { responsiblePerson, dueDate, reassignmentReason } = req.body;
    
    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId },
      {
        responsiblePerson,
        dueDate,
        status: 'open',
        reassignmentHistory: {
          reassignedBy: req.user._id,
          reassignedDate: new Date(),
          previousResponsible: observation.responsiblePerson,
          reason: reassignmentReason
        }
      },
      { new: true }
    ).populate('responsiblePerson', 'name role email');

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    res.json({
      message: 'Observation reassigned successfully',
      observation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get observation statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      open,
      inProgress,
      completed,
      approved,
      highRisk,
      overdue
    ] = await Promise.all([
      Observation.countDocuments({ companyId }),
      Observation.countDocuments({ companyId, status: 'open' }),
      Observation.countDocuments({ companyId, status: 'in_progress' }),
      Observation.countDocuments({ companyId, status: 'completed' }),
      Observation.countDocuments({ companyId, status: 'approved' }),
      Observation.countDocuments({ companyId, riskLevel: { $in: ['high', 'very_high'] } }),
      Observation.countDocuments({ 
        companyId, 
        dueDate: { $lt: new Date() }, 
        status: { $nin: ['completed', 'approved'] }
      })
    ]);

    res.json({
      stats: {
        total,
        open,
        inProgress,
        completed,
        approved,
        highRisk,
        overdue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;