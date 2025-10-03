import express from 'express';
import Incident from '../models/Incident.js';
import Company from '../models/Company.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
import reminderService from '../services/reminderService.js';
import NumberGenerator from '../utils/numberGenerator.js';
import { 
  validateIncidentCreation, 
  validateInvestigationUpdate, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';

const router = express.Router();

// Utility: get IMS config for company
async function getIMSConfig(companyId) {
  const company = await Company.findById(companyId).lean();
  if (!company || !company.config?.ims) {
    throw new Error('IMS config not found for company');
  }
  return company.config.ims;
}
//Get incident by id
router.get('/:companyId/:id', 
  validateObjectId('id'), 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const filter = { _id: id, companyId };
      if (req.user.role !== 'platform_owner') {
        filter.plantId = req.user.plantId;
      }
      const incident = await Incident.findOne(filter)
        .populate('reportedBy', 'name email')
        .populate('plantId', 'name code')
        .populate('investigation.assignedTo', 'name role');
      
      if (!incident) return res.status(404).json({ message: 'Incident not found' });
      res.json({incident});
    } catch (error) {
      console.log("Error in fetching incident",error)
      res.status(500).json({ message: error.message });
    }
  }
);
// Get all incidents
router.get('/:companyId', 
  validateCompanyId, 
  validatePagination, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const filter = { companyId };
      if (req.user.role !== 'platform_owner') {
        filter.plantId = req.user.plantId;
      }
      const { page = 1, limit = 10, status, severity, type } = req.query;

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      if (req.user.role !== 'platform_owner') {
        filter.plantId = req.user.plantId;
      }
      if (status) filter.status = status;
      if (severity) filter.severity = severity;
      if (type) filter.type = type;

      const incidents = await Incident.find(filter)
        .populate('reportedBy', 'name email')
        .populate('plantId', 'name code')
        .populate('investigation.assignedTo', 'name role')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum);

      const total = await Incident.countDocuments(filter);

      res.json({
        incidents,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        total
      });
    } catch (error) {
      console.log("Error in fetching incidents",error)
      res.status(500).json({ message: error.message });
    }
});

// Create new incident
router.post('/:companyId', 
  validateCompanyId, 
  validateIncidentCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const filter = { companyId };
      if (req.user.role !== 'platform_owner') {
        filter.plantId = req.user.plantId;
      }
      const imsConfig = await getIMSConfig(companyId);

      const statusMap = imsConfig.statusMap || {};
      const reportingFlow = imsConfig.reportingFlow || [];

      const defaultStatus = reportingFlow.length > 0 
        ? statusMap.open || reportingFlow[0].role 
        : 'open';

      const incidentData = {
        ...req.body,
        companyId,
        reportedBy: req.user._id,
        incidentNumber: await NumberGenerator.generateNumber(companyId, 'ims'),
        status: defaultStatus
      };

      const incident = new Incident(incidentData);
      await incident.save();

      await incident.populate('reportedBy', 'name email');
      await incident.populate('plantId', 'name code');

      // Notifications & reminders
      // await notificationService.notifyIncidentReported(incident);
      await reminderService.scheduleIncidentInvestigationReminder(incident);

      res.status(201).json({
        message: 'Incident reported successfully',
        incident
      });
    } catch (error) {
      console.log("Error in creating incident",error)
      res.status(500).json({ message: error.message });
    }
});

// Assign investigation team
router.post('/:companyId/:id/assign', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const filter = { _id: id, companyId };
    if (req.user.role !== 'platform_owner') {
      filter.plantId = req.user.plantId;
    }
    const { assignedTo, team, timeLimit, priority, assignmentComments } = req.body;

    // Get IMS config and status map
    const imsConfig = await getIMSConfig(companyId);
    const statusMap = imsConfig.statusMap || {};

    // Find the incident
    const incident = await Incident.findOne({ _id: id, companyId });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    // Ensure investigation object exists
    if (!incident.investigation) {
      incident.investigation = {};
    }

    // Update investigation details safely
    incident.investigation.assignedTo = assignedTo || incident.investigation.assignedTo;
    incident.investigation.team = team || incident.investigation.team || [];
    incident.investigation.timeLimit = timeLimit || incident.investigation.timeLimit || 72;
    incident.investigation.priority = priority || incident.investigation.priority || 'medium';
    incident.investigation.assignmentComments = assignmentComments || incident.investigation.assignmentComments || '';
    incident.investigation.assignedAt = new Date();
    incident.investigation.findings = incident.investigation.findings || '';
    incident.investigation.rootCause = incident.investigation.rootCause || { immediate: '', underlying: '', rootCause: '' };
    incident.investigation.fiveWhys = incident.investigation.fiveWhys || [];
    incident.investigation.fishbone = incident.investigation.fishbone || {
      people: [],
      process: [],
      environment: [],
      equipment: [],
      materials: [],
      methods: []
    };

    // Update status
    incident.status = statusMap.investigating || 'investigating';

    // Save the incident
    await incident.save();

    // Populate basic fields for notifications
    await incident.populate('reportedBy', 'name email');
    await incident.populate('investigation.assignedTo', 'name role');

    // Send notifications and schedule reminders
    // await notificationService.notifyIncidentAssigned(incident, assignedTo);
    await reminderService.scheduleIncidentInvestigationReminder(incident, incident.investigation.timeLimit);

    res.json({ message: 'Investigation team assigned successfully', incident });
  } catch (error) {
    console.error('Assign Investigation Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Close incident
router.post('/:companyId/:id/close', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const filter = { _id: id, companyId };
    if (req.user.role !== 'platform_owner') {
      filter.plantId = req.user.plantId;
    }
    const { closureComments, approvalDecision } = req.body;

    const imsConfig = await getIMSConfig(companyId);
    const statusMap = imsConfig.statusMap || {};

    const incident = await Incident.findOne(filter);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    if (approvalDecision === 'approve') {
      incident.status = statusMap.closed || 'closed';
      incident.closedAt = new Date();
      incident.closedBy = req.user._id;
      incident.closureComments = closureComments;
    } else {
      incident.status = statusMap.reassigned || 'reassigned';
      incident.reassignReason = closureComments;
    }

    await incident.save();
    res.json({
      message: `Incident ${approvalDecision === 'approve' ? 'closed' : 'reassigned'} successfully`,
      incident
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Investigation findings
// Update incident (generic)
router.patch('/:companyId/:id', 
  validateCompanyId,
  validateObjectId('id'),
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const filter = { _id: id, companyId };
      if (req.user.role !== 'platform_owner') {
        filter.plantId = req.user.plantId;
      }
      const updateData = req.body;

      // Fetch the incident
      const incident = await Incident.findOne(filter);
      if (!incident) return res.status(404).json({ message: 'Incident not found' });

      // Merge existing investigation if present
      if (updateData.investigation) {
        incident.investigation = {
          ...incident.investigation,
          ...updateData.investigation
        };
      }

      // Merge other top-level fields
      for (const key of Object.keys(updateData)) {
        if (key !== 'investigation') {
          incident[key] = updateData[key];
        }
      }

      // Save updated incident
      await incident.save();

      // Populate for response if needed
      await incident.populate('reportedBy', 'name email');
      await incident.populate('investigation.assignedTo', 'name role');

      // Send response
      res.json({ message: 'Incident updated successfully', incident });
    } catch (error) {
      console.error('Update Incident Error:', error);
      res.status(500).json({ message: error.message });
    }
});

// Add corrective actions
router.post('/:companyId/:id/actions', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const filter = { _id: id, companyId };
    if (req.user.role !== 'platform_owner') {
      filter.plantId = req.user.plantId;
    }
    const { actions } = req.body;

    const imsConfig = await getIMSConfig(companyId);
    const statusMap = imsConfig.statusMap || {};

    const incident = await Incident.findOne(filter);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    incident.correctiveActions = actions || [];
    incident.status = statusMap.pending_closure || 'pending_closure';

    await incident.save();
    res.json({ message: 'Corrective actions added successfully', incident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard stats
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const filter = { companyId };
    if (req.user.role !== 'platform_owner') {
      filter.plantId = req.user.plantId;
    }
    const imsConfig = await getIMSConfig(companyId);
    const statusMap = imsConfig.statusMap || {};

    const [
      total,
      open,
      investigating,
      closed,
      byType,
      bySeverity
    ] = await Promise.all([
      Incident.countDocuments(filter),
      Incident.countDocuments({ ...filter, status: statusMap.open || 'open' }),
      Incident.countDocuments({ ...filter, status: statusMap.investigating || 'investigating' }),
      Incident.countDocuments({ ...filter, status: statusMap.closed || 'closed' }),
      Incident.aggregate([
        { $match: { ...filter } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $match: { ...filter } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ])
    ]);

    res.json({ stats: { total, open, investigating, closed, byType, bySeverity } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
