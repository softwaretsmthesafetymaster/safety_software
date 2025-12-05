import express from 'express';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import Incident from '../models/Incident.js';
import BBSReport from '../models/BBSReport.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Utility: get role-based filter for incidents
function getIncidentFilter(req) {
  const user = req.user;
  let filter = { companyId: req.params.companyId };

  if (user.role === 'company_owner') {
    return filter;
  }

  if (user.role === 'plant_head') {
    filter.plantId = user.plantId;
    return filter;
  }

  filter.$or = [
    { reportedBy: user._id },
    { 'investigation.assignedTo': user._id },
    { 'investigation.team': user._id },
    { 'correctiveActions.assignedTo': user._id }
  ];

  return filter;
}

// Utility: get role-based filter for BBS
function getBBSFilter(req) {
  const user = req.user;
  let filter = { companyId: req.params.companyId };

  if (user.role === 'company_owner') {
    return filter;
  }

  if (user.role === 'plant_head') {
    filter.plantId = user.plantId;
    return filter;
  }

  filter.$or = [
    { observer: user._id },
    { reviewedBy: user._id },
    { completedBy: user._id },
    { "correctiveActions.assignedTo": user._id }
  ];

  return filter;
}

// Main dashboard stats endpoint
router.get('/:companyId/stats', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { timeRange = '30d', modules = 'ptw,ims,bbs,audit', plantId } = req.query;

    const selectedModules = modules.split(',');
    
    // Date filter based on time range
    let dateFilter = {};
    if (timeRange) {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        dateFilter.createdAt = { $gte: startDate };
      }
    }

    let stats = {};

    // IMS Stats
    if (selectedModules.includes('ims')) {
      const incidentFilter = getIncidentFilter(req);
      if (plantId && req.user.role === 'company_owner') incidentFilter.plantId = plantId;

      const [
        incidentTotal,
        incidentOpen,
        incidentInvestigating,
        incidentClosed,
        incidentCritical,
        incidentHigh,
        incidentMedium,
        incidentLow
      ] = await Promise.all([
        Incident.countDocuments({ ...incidentFilter, ...dateFilter }),
        Incident.countDocuments({ ...incidentFilter, ...dateFilter, status: 'open' }),
        Incident.countDocuments({ ...incidentFilter, ...dateFilter, status: 'investigating' }),
        Incident.countDocuments({ ...incidentFilter, ...dateFilter, status: 'closed' }),
        Incident.countDocuments({ ...incidentFilter, ...dateFilter, severity: 'critical' }),
        Incident.countDocuments({ ...incidentFilter, ...dateFilter, severity: 'high' }),
        Incident.countDocuments({ ...incidentFilter, ...dateFilter, severity: 'medium' }),
        Incident.countDocuments({ ...incidentFilter, ...dateFilter, severity: 'low' })
      ]);

      // Calculate monthly data for incidents
      const incidentMonthlyData = [];
      const months = timeRange === '1y' ? 12 : 6;
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthFilter = {
          ...incidentFilter,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        };
        
        const count = await Incident.countDocuments(monthFilter);
        incidentMonthlyData.push({ count });
      }

      stats.incidentStats = {
        total: incidentTotal,
        open: incidentOpen,
        investigating: incidentInvestigating,
        closed: incidentClosed,
        critical: incidentCritical,
        high: incidentHigh,
        medium: incidentMedium,
        low: incidentLow,
        monthlyData: incidentMonthlyData,
        daysSinceLastIncident: 45, // Calculate from actual data
        avgInvestigationTime: 24,  // Calculate from actual data
        incidentRate: '0.02',      // Calculate from actual data
        trend: incidentTotal > 0 ? '+5%' : '0%',
        daysTrend: '+5 days',
        rateTrend: '-10%'
      };
    }

    // BBS Stats
    if (selectedModules.includes('bbs')) {
      const bbsFilter = getBBSFilter(req);
      if (plantId && req.user.role === 'company_owner') bbsFilter.plantId = plantId;

      const [
        bbsTotal,
        bbsOpen,
        bbsClosed,
        bbsSafeBehaviors,
        bbsUnsafeActs,
        bbsUnsafeConditions,
        bbsCritical,
        bbsHigh,
        bbsMedium,
        bbsLow
      ] = await Promise.all([
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, status: 'open' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, status: 'closed' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, observationType: 'safe_behavior' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, observationType: 'unsafe_act' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, observationType: 'unsafe_condition' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, severity: 'critical' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, severity: 'high' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, severity: 'medium' }),
        BBSReport.countDocuments({ ...bbsFilter, ...dateFilter, severity: 'low' })
      ]);

      // Calculate monthly data for BBS
      const bbsMonthlyData = [];
      const months = timeRange === '1y' ? 12 : 6;
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthFilter = {
          ...bbsFilter,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        };
        
        const count = await BBSReport.countDocuments(monthFilter);
        bbsMonthlyData.push({ count });
      }

      stats.bbsStats = {
        total: bbsTotal,
        open: bbsOpen,
        closed: bbsClosed,
        safeBehaviors: bbsSafeBehaviors,
        unsafeActs: bbsUnsafeActs,
        unsafeConditions: bbsUnsafeConditions,
        critical: bbsCritical,
        high: bbsHigh,
        medium: bbsMedium,
        low: bbsLow,
        monthlyData: bbsMonthlyData,
        avgResponseTime: 12,      // Calculate from actual data
        qualityScore: 85,         // Calculate from actual data
        trend: bbsTotal > 0 ? '+15%' : '0%',
        targetObservations: 100,
        rateTrend: '+20%'
      };
    }

    // PTW Stats (placeholder - implement when PTW module is available)
    if (selectedModules.includes('ptw')) {
      stats.permitStats = {
        total: 150,
        active: 45,
        closed: 105,
        monthlyData: Array(6).fill(0).map(() => ({ count: Math.floor(Math.random() * 30) + 10 })),
        avgProcessingTime: 8,
        avgResponseTime: 6,
        trend: '+8%',
        responseTrend: '-15%'
      };
    }

    // Audit Stats (placeholder - implement when Audit module is available)
    if (selectedModules.includes('audit')) {
      stats.auditStats = {
        total: 50,
        inProgress: 8,
        completed: 42,
        monthlyData: Array(6).fill(0).map(() => ({ count: Math.floor(Math.random() * 10) + 5 })),
        avgCompliance: 92,
        avgAuditTime: 16,
        trend: '+5%',
        complianceTrend: '+3%',
        monthlyCompliance: Array(6).fill(0).map(() => Math.floor(Math.random() * 20) + 80)
      };
    }

    // Get notifications
    const notificationFilter = { companyId, userId: req.user._id };
    const notifications = await Notification.find(notificationFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    stats.notifications = notifications;

    res.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Export dashboard data
router.get('/:companyId/export', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { format = 'excel', timeRange = '30d', modules = 'ptw,ims,bbs,audit', plantId } = req.query;

    // This would implement actual file generation
    // For now, return a success message
    
    if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=safety-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=safety-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // Return placeholder response
    res.json({ 
      message: `Dashboard export in ${format} format would be generated here`,
      params: { timeRange, modules, plantId }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;