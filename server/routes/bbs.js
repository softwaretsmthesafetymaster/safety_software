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
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const router = express.Router();

router.use('', coachingRoutes);
router.use('', gameRoutes);

function getRoleBasedFilter(req) {
  const user = req.user;
  let filter = { companyId: req.params.companyId };

  // COMPANY OWNER → full access
  if (user.role === 'company_owner') {
    return filter;
  }

  // PLANT HEAD → only their plant
  if (user.role === 'plant_head') {
    filter.plantId = user.plantId;
    return filter;
  }

  // USER / HOD / SAFETY_INCHARGE → must be involved
  filter.$or = [
    { observer: user._id },
    { reviewedBy: user._id },
    { completedBy: user._id },
    { "correctiveActions.assignedTo": user._id }
  ];

  return filter;
}

function buildQueryFilter(req) {
  const baseFilter = getRoleBasedFilter(req);
  const { plantIds, startDate, endDate, areas, types, status, severity, search, observer } = req.query;

  // Plant filter (only for company owners)
  if (plantIds && req.user.role === 'company_owner') {
    const plantIdArray = plantIds.split(',').filter(id => id);
    if (plantIdArray.length > 0) {
      baseFilter.plantId = { $in: plantIdArray };
    }
  }

  // Date range filter
  if (startDate && endDate) {
    baseFilter.observationDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + 'T23:59:59.999Z')
    };
  }

  // Areas filter
  if (areas) {
    const areaArray = areas.split(',').filter(area => area);
    if (areaArray.length > 0) {
      baseFilter['location.area'] = { $in: areaArray };
    }
  }

  // Types filter
  if (types) {
    const typeArray = types.split(',').filter(type => type);
    if (typeArray.length > 0) {
      baseFilter.observationType = { $in: typeArray };
    }
  }

  // Status filter
  if (status) {
    baseFilter.status = status;
  }

  // Severity filter
  if (severity) {
    baseFilter.severity = severity;
  }

  // Observer filter
  if (observer) {
    baseFilter.observer = observer;
  }

  // Search filter
  if (search) {
    baseFilter.$or = [
      ...(baseFilter.$or || []),
      { reportNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.area': { $regex: search, $options: 'i' } },
      { 'location.specificLocation': { $regex: search, $options: 'i' } }
    ];
  }

  return baseFilter;
}

// Get User Achievements
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

// Get BBS trends data
router.get('/:companyId/trends',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const filter = buildQueryFilter(req);
      
      // Get trends data (last 6 months)
      const trends = [];
      const monthlyTrends = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const monthFilter = {
          ...filter,
          observationDate: {
            $gte: monthStart,
            $lte: monthEnd
          }
        };

        const [observations, actions] = await Promise.all([
          BBSReport.countDocuments(monthFilter),
          BBSReport.countDocuments({ ...monthFilter, status: 'closed' })
        ]);

        const monthData = {
          month: format(monthStart, 'MMM yyyy'),
          date: format(monthStart, 'yyyy-MM'),
          observations,
          actions,
          total: observations,
          closed: actions,
          open: observations - actions
        };

        trends.push(monthData);
        monthlyTrends.push(monthData);
      }

      // Plant comparison (only for company owner)
      let plantComparison = [];
      if (req.user.role === 'company_owner') {
        const plantStats = await BBSReport.aggregate([
          { $match: filter },
          {
            $lookup: {
              from: 'plants',
              localField: 'plantId',
              foreignField: '_id',
              as: 'plant'
            }
          },
          { $unwind: '$plant' },
          {
            $group: {
              _id: '$plantId',
              plantName: { $first: '$plant.name' },
              total: { $sum: 1 },
              closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
              open: { $sum: { $cond: [{ $ne: ['$status', 'closed'] }, 1, 0] } }
            }
          }
        ]);
        
        plantComparison = plantStats;
      }

      res.json({
        trends,
        monthlyTrends,
        plantComparison
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Download BBS reports
router.get('/:companyId/download',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const filter = buildQueryFilter(req);
      const { download } = req.query;
      
      const reports = await BBSReport.find(filter)
        .populate('observer', 'name email')
        .populate('plantId', 'name code')
        .populate('correctiveActions.assignedTo', 'name role')
        .sort({ createdAt: -1 });

      if (download === 'excel') {
        // Set headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=bbs-reports.xlsx');
        
        // Create Excel data
        const excelData = reports.map(report => ({
          'Report Number': report.reportNumber,
          'Observation Date': format(new Date(report.observationDate), 'yyyy-MM-dd'),
          'Plant': report.plantId?.name,
          'Area': report.location?.area,
          'Observer': report.observer?.name,
          'Type': report.observationType,
          'Severity': report.severity,
          'Status': report.status,
          'Description': report.description,
          'Created At': format(new Date(report.createdAt), 'yyyy-MM-dd HH:mm:ss')
        }));

        // For now, return JSON (in real implementation, use a library like xlsx)
        res.json(excelData);
      } else {
        res.json({ reports });
      }
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
    const { page = 1, limit = 10 } = req.query;
    const filter = buildQueryFilter(req);

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
    const filter = getRoleBasedFilter(req);
    filter._id = id;

    const report = await BBSReport.findOne(filter)
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
    const filter = getRoleBasedFilter(req);
    filter._id = id;

    const report = await BBSReport.findOneAndUpdate(
      filter,
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
    const filter = getRoleBasedFilter(req);
    filter._id = id;

    const report = await BBSReport.findOne(filter);
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
      } else {
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
    const filter = getRoleBasedFilter(req);
    filter._id = id;
    
    const report = await BBSReport.findOne(filter);
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
    const filter = getRoleBasedFilter(req);
    filter._id = id;

    const report = await BBSReport.findOne(filter);
    if (!report) {
      return res.status(404).json({ message: 'BBS report not found' });
    }

    if (approvalDecision === 'approve') {
      report.approvedBy = req.user._id;
      report.approvedAt = new Date();
      report.correctiveActions.forEach(action => {
        action.status = 'completed';
      });
      report.status = 'closed';
    } else {
      report.status = 'approved';
      report.correctiveActions.forEach(action => {
        action.status = 'pending';
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
    const filter = buildQueryFilter(req);
    
    // Get current period stats
    const [
      total,
      open,
      closed,
      unsafeActs,
      unsafeConditions,
      safeBehaviors,
      criticalCount,
      highCount,
      mediumCount,
      lowCount
    ] = await Promise.all([
      BBSReport.countDocuments(filter),
      BBSReport.countDocuments({ ...filter, status: { $ne: 'closed' } }),
      BBSReport.countDocuments({ ...filter, status: 'closed' }),
      BBSReport.countDocuments({ ...filter, observationType: 'unsafe_act' }),
      BBSReport.countDocuments({ ...filter, observationType: 'unsafe_condition' }),
      BBSReport.countDocuments({ ...filter, observationType: 'safe_behavior' }),
      BBSReport.countDocuments({ ...filter, severity: 'critical' }),
      BBSReport.countDocuments({ ...filter, severity: 'high' }),
      BBSReport.countDocuments({ ...filter, severity: 'medium' }),
      BBSReport.countDocuments({ ...filter, severity: 'low' })
    ]);

    // Get previous period stats for comparison
    let previousFilter = { ...filter };
    if (filter.observationDate) {
      const currentStart = new Date(req.query.startDate || subMonths(new Date(), 1));
      const currentEnd = new Date(req.query.endDate || new Date());
      const periodDiff = currentEnd.getTime() - currentStart.getTime();
      const previousStart = new Date(currentStart.getTime() - periodDiff);
      const previousEnd = new Date(currentStart.getTime());
      
      previousFilter.observationDate = {
        $gte: previousStart,
        $lte: previousEnd
      };
    }

    const [prevTotal, prevOpen, prevClosed, prevSafeBehaviors] = await Promise.all([
      BBSReport.countDocuments(previousFilter),
      BBSReport.countDocuments({ ...previousFilter, status: { $ne: 'closed' } }),
      BBSReport.countDocuments({ ...previousFilter, status: 'closed' }),
      BBSReport.countDocuments({ ...previousFilter, observationType: 'safe_behavior' })
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous * 100).toFixed(1);
      return change > 0 ? `+${change}%` : `${change}%`;
    };

    res.json({
      stats: {
        total,
        open,
        closed,
        unsafeActs,
        unsafeConditions,
        safeBehaviors,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        totalChange: calculateChange(total, prevTotal),
        openChange: calculateChange(open, prevOpen),
        closedChange: calculateChange(closed, prevClosed),
        safeBehaviorsChange: calculateChange(safeBehaviors, prevSafeBehaviors)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;