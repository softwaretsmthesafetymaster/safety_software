import express from 'express';
import Incident from '../models/Incident.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
import reminderService from '../services/reminderService.js';

const router = express.Router();

// Generate incident number
const generateIncidentNumber = (companyId) => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `INC${year}${month}${day}${random}`;
};

// Get all incidents for a company
router.get('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status, severity, type } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name email')
      .populate('plantId', 'name code')
      .populate('investigation.assignedTo', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments(filter);

    res.json({
      incidents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new incident
router.post('/:companyId', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const incidentData = {
      ...req.body,
      companyId,
      reportedBy: req.user._id,
      incidentNumber: generateIncidentNumber(companyId)
    };

    const incident = new Incident(incidentData);
    await incident.save();

    await incident.populate('reportedBy', 'name email');
    await incident.populate('plantId', 'name code');

    // Send notification to safety team
    await notificationService.notifyIncidentReported(incident);
    
    // Schedule investigation reminder
    await reminderService.scheduleIncidentInvestigationReminder(incident);
    res.status(201).json({
      message: 'Incident reported successfully',
      incident
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get incident by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const incident = await Incident.findOne({ _id: id, companyId })
      .populate('reportedBy', 'name email role')
      .populate('plantId', 'name code areas')
      .populate('investigation.assignedTo', 'name role email')
      .populate('investigation.team', 'name role')
      .populate('correctiveActions.assignedTo', 'name role');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ incident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update incident
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const incident = await Incident.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email')
     .populate('plantId', 'name code');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({
      message: 'Incident updated successfully',
      incident
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign investigation team
router.post('/:companyId/:id/assign', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { assignedTo, team } = req.body;

    const incident = await Incident.findOne({ _id: id, companyId });
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.investigation = {
      ...incident.investigation,
      assignedTo,
      team: team || []
    };
    incident.status = 'investigating';

    await incident.save();

    // Notify assigned investigator
    await notificationService.notifyIncidentAssigned(incident, assignedTo);
    res.json({
      message: 'Investigation team assigned successfully',
      incident
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit investigation findings
router.post('/:companyId/:id/investigation', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { findings, rootCause, fiveWhys, fishbone } = req.body;

    const incident = await Incident.findOne({ _id: id, companyId });
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.investigation = {
      ...incident.investigation,
      findings,
      rootCause,
      fiveWhys,
      fishbone
    };

    await incident.save();

    res.json({
      message: 'Investigation findings submitted successfully',
      incident
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add corrective actions
router.post('/:companyId/:id/actions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const { actions } = req.body;

    const incident = await Incident.findOne({ _id: id, companyId });
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.correctiveActions = actions;
    incident.status = 'pending_closure';

    await incident.save();

    res.json({
      message: 'Corrective actions added successfully',
      incident
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get incident statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      open,
      investigating,
      closed,
      byType,
      bySeverity
    ] = await Promise.all([
      Incident.countDocuments({ companyId }),
      Incident.countDocuments({ companyId, status: 'open' }),
      Incident.countDocuments({ companyId, status: 'investigating' }),
      Incident.countDocuments({ companyId, status: 'closed' }),
      Incident.aggregate([
        { $match: { companyId: companyId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $match: { companyId: companyId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      stats: {
        total,
        open,
        investigating,
        closed,
        byType,
        bySeverity
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;