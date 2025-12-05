import express from 'express';
import Incident from '../models/Incident.js';
import Company from '../models/Company.js';
import Plant from '../models/Plant.js';
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

// Build filter based on user role and query parameters
function buildIncidentFilter(user, companyId, query) {
  const filter = { companyId };
  
  // Role-based filtering
  if (user.role === 'company_owner') {
    // Company owners can see all plants or specific plants if selected
    if (query.plants && query.plants.trim()) {
      const plantIds = query.plants.split(',').filter(id => id.trim());
      if (plantIds.length > 0) {
        filter.plantId = { $in: plantIds };
      }
    }
  } else if (user.role === 'plant_head') {
    // Plant heads see only their plant
    filter.plantId = user.plantId;
  } else {
    // Other roles see only their plant and potentially filtered by department/area
    filter.plantId = user.plantId;
    if (user.department || user.areaId) {
      // Additional filtering can be added here based on user's department/area
    }
  }

  // Additional filters from query parameters
  if (query.severity) filter.severity = query.severity;
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.areaId) filter.areaId = query.areaId;
  if (query.assignedTo) filter['investigation.assignedTo'] = query.assignedTo;

  // Date range filtering
  if (query.dateRange) {
    const now = new Date();
    let startDate;
    
    switch (query.dateRange) {
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (query.customStartDate) startDate = new Date(query.customStartDate);
        if (query.customEndDate) {
          filter.dateTime = {
            ...(startDate && { $gte: startDate }),
            $lte: new Date(query.customEndDate)
          };
        }
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    if (startDate && query.dateRange !== 'custom') {
      filter.dateTime = { $gte: startDate };
    }
  }

  return filter;
}

// Get incident by id
router.get('/:companyId/:id', 
  validateObjectId('id'), 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const filter = buildIncidentFilter(req.user, companyId, {});
      filter._id = id;
      
      const incident = await Incident.findOne(filter)
        .populate('reportedBy', 'name email')
        .populate('plantId', 'name code location')
        .populate('investigation.assignedTo', 'name role email')
        .populate('investigation.team', 'name role email')
        .populate('correctiveActions.assignedTo', 'name role email');
      
      if (!incident) return res.status(404).json({ message: 'Incident not found' });
      res.json({ incident });
    } catch (error) {
      console.log("Error in fetching incident", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all incidents with advanced filtering
router.get('/:companyId', 
  validateCompanyId, 
  validatePagination, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      // Build comprehensive filter
      const filter = buildIncidentFilter(req.user, companyId, req.query);
      
      const incidents = await Incident.find(filter)
        .populate('reportedBy', 'name email')
        .populate('plantId', 'name code location')
        .populate('investigation.assignedTo', 'name role')
        .populate('areaId', 'name')
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
      console.log("Error in fetching incidents", error);
      res.status(500).json({ message: error.message });
    }
});

// Get dashboard statistics with comprehensive metrics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const filter = buildIncidentFilter(req.user, companyId, req.query);
    
    // Get current month date range
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const [
      total,
      open,
      investigating,
      closedThisMonth,
      critical,
      overdue,
      byType,
      bySeverity,
      byStatus,
      byPlant,
      monthlyTrends
    ] = await Promise.all([
      // Total incidents
      Incident.countDocuments(filter),
      
      // Open incidents
      Incident.countDocuments({ ...filter, status: 'open' }),
      
      // Under investigation
      Incident.countDocuments({ ...filter, status: 'investigating' }),
      
      // Closed this month
      Incident.countDocuments({ 
        ...filter, 
        status: 'closed',
        closedAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
      }),
      
      // Critical incidents
      Incident.countDocuments({ ...filter, severity: 'critical' }),
      
      // Overdue investigations
      Incident.countDocuments({
        ...filter,
        status: 'investigating',
        'investigation.assignedAt': {
          $lte: new Date(now.getTime() - 72 * 60 * 60 * 1000) // 72 hours ago
        }
      }),
      
      // By type
      Incident.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // By severity
      Incident.aggregate([
        { $match: filter },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // By status
      Incident.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // By plant (for company owners)
      req.user.role === 'company_owner' ? 
        Incident.aggregate([
          { $match: { companyId } },
          { $lookup: { from: 'plants', localField: 'plantId', foreignField: '_id', as: 'plant' } },
          { $unwind: '$plant' },
          { $group: { 
            _id: '$plantId', 
            plantName: { $first: '$plant.name' },
            total: { $sum: 1 },
            critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
            open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } }
          }},
          { $sort: { total: -1 } }
        ]) : [],
      
      // Monthly trends (last 6 months)
      Incident.aggregate([
        { 
          $match: { 
            ...filter, 
            dateTime: { 
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) 
            } 
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: '$dateTime' },
              month: { $month: '$dateTime' }
            },
            total: { $sum: 1 },
            critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
            medium: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
            low: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } },
            open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Calculate safety score
    const safetyScore = Math.max(0, Math.min(100, 
      100 - (critical * 10) - (open * 2) - (overdue * 5)
    ));

    res.json({ 
      stats: { 
        total, 
        open, 
        investigating, 
        closed: closedThisMonth,
        critical,
        overdue,
        safetyScore,
        byType: byType.map(item => ({ type: item._id, count: item.count })),
        bySeverity: bySeverity.map(item => ({ severity: item._id, count: item.count })),
        byStatus: byStatus.map(item => ({ status: item._id, count: item.count })),
        byPlant: byPlant.map(item => ({ 
          plantId: item._id, 
          plantName: item.plantName,
          total: item.total,
          critical: item.critical,
          open: item.open
        })),
        monthlyTrends: monthlyTrends.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          ...item,
          _id: undefined
        }))
      }
    });
  } catch (error) {
    console.log("Error in fetching dashboard stats", error);
    res.status(500).json({ message: error.message });
  }
});

// Get plant list for company owners
router.get('/:companyId/plants/list', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (req.user.role !== 'company_owner') {
      return res.status(403).json({ message: 'Access denied. Company owners only.' });
    }

    const plants = await Plant.find({ companyId })
      .select('name code location')
      .sort({ name: 1 });

    res.json({ plants });
  } catch (error) {
    console.log("Error in fetching plants", error);
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
      await reminderService.scheduleIncidentInvestigationReminder(incident);

      res.status(201).json({
        message: 'Incident reported successfully',
        incident
      });
    } catch (error) {
      console.log("Error in creating incident", error);
      res.status(500).json({ message: error.message });
    }
});

// Assign investigation team
router.post('/:companyId/:id/assign', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const filter = buildIncidentFilter(req.user, companyId, {});
    filter._id = id;
    
    const { assignedTo, team, timeLimit, priority, assignmentComments } = req.body;

    const imsConfig = await getIMSConfig(companyId);
    const statusMap = imsConfig.statusMap || {};

    const incident = await Incident.findOne(filter);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    if (!incident.investigation) {
      incident.investigation = {};
    }

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

    incident.status = statusMap.investigating || 'investigating';

    await incident.save();

    await incident.populate('reportedBy', 'name email');
    await incident.populate('investigation.assignedTo', 'name role');

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
    const filter = buildIncidentFilter(req.user, companyId, {});
    filter._id = id;
    
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
    console.log("Error in incident close: ",error)
    res.status(500).json({ message: error.message });
  }
});

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
      const filter = buildIncidentFilter(req.user, companyId, {});
      filter._id = id;
      const updateData = req.body;
      const incident = await Incident.findOne(filter);
      if (!incident) return res.status(404).json({ message: 'Incident not found' });

      if (updateData.investigation) {
        incident.investigation = {
          ...incident.investigation,
          ...updateData.investigation
        };
      }

      for (const key of Object.keys(updateData)) {
        if (key !== 'investigation') {
          incident[key] = updateData[key];
        }
      }

      await incident.save();

      await incident.populate('reportedBy', 'name email');
      await incident.populate('investigation.assignedTo', 'name role');

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
    const filter = buildIncidentFilter(req.user, companyId, {});
    filter._id = id;
    
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

export default router;