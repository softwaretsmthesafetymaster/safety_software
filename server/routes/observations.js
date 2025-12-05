import express from 'express';
import Observation from '../models/Observation.js';
import Audit from '../models/Audit.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import NumberGenerator from '../utils/numberGenerator.js';
import { generateObservationSuggestions } from '../services/auditai.js';

const router = express.Router();

// Get observations for an audit
router.get('/:companyId/audit/:auditId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, auditId } = req.params;
    
    const observations = await Observation.find({ companyId, auditId })
      .populate('responsiblePerson', 'name email role')
      .populate('assignedBy', 'name')
      .populate('completedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ observations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create observation
router.post('/:companyId/audit/:auditId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, auditId } = req.params;
    const observationData = {
      ...req.body,
      companyId,
      auditId,
      assignedBy: req.user._id,
      observationNumber: await NumberGenerator.generateNumber(companyId, 'observation')
    };
    
    const observation = new Observation(observationData);
    await observation.save();

    // await observation.populate('responsiblePerson', 'name email role');

    // Update audit observations array
    await Audit.findOneAndUpdate(
      { _id: auditId, companyId, },
      {$push:{observations:observation._id},$set:{status:'observations_pending'}},
      {new:true}
    );
    res.status(200).json({
      message: 'Observation created successfully',
      observation
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Update observation
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true }
    ).populate('responsiblePerson', 'name email role');

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

// Assign responsible person
router.patch('/:companyId/:id/assign', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { responsiblePerson, targetDate } = req.body;

    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId },
      { 
        responsiblePerson,
        targetDate,
        status: 'assigned',
        assignedBy: req.user._id
      },
      { new: true }
    ).populate('responsiblePerson', 'name email role');

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    res.json({
      message: 'Responsible person assigned successfully',
      observation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete observation action
router.patch('/:companyId/:id/complete', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { actionTaken, completionEvidence } = req.body;

    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId },
      {
        actionTaken,
        completionEvidence,
        completedBy: req.user._id,
        completedAt: new Date(),
        status: 'completed'
      },
      { new: true }
    ).populate('responsiblePerson', 'name email role');

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
router.patch('/:companyId/:id/review', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { status, rejectionReason } = req.body; // status: 'approved' or 'rejected'
    
    const updateData = {
      status,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
      updateData.status = 'assigned'; // Reassign for correction
    }

    const observation = await Observation.findOneAndUpdate(
      { _id: id, companyId },
      updateData,
      { new: true }
    ).populate('responsiblePerson', 'name email role');

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    // Check if all observations are approved to update audit status
    if (status === 'approved') {
      const audit = await Audit.findById(observation.auditId);
      const allObservations = await Observation.find({ auditId: observation.auditId });
      const approvedCount = allObservations.filter(obs => obs.status === 'approved').length;
      
      if (approvedCount === allObservations.length && allObservations.length > 0) {
        audit.status = 'completed';
        audit.observationsCompletedAt = new Date();
        await audit.save();
      }
    }

    res.json({
      message: `Observation ${status} successfully`,
      observation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AI suggestions for observation
router.post('/:companyId/ai-suggest', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { observation } = req.body;
    
    const aiSuggestions = await generateObservationSuggestions(observation);

    res.json({ suggestions: aiSuggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my assigned observations
router.get('/:companyId/my-actions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const observations = await Observation.find({ 
      companyId, 
      responsiblePerson: req.user._id,
    })
    .populate('auditId', 'title auditNumber')
    .populate('assignedBy', 'name')
    .sort({ targetDate: 1 });

    res.json({ observations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;