import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Permit from '../models/Permit.js';
import Incident from '../models/Incident.js';
import HAZOP from '../models/HAZOP.js';
import HIRA from '../models/HIRA.js';
import BBSReport from '../models/BBSReport.js';
import Audit from '../models/Audit.js';
import Plant from '../models/Plant.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get platform statistics
router.get('/stats', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      totalRecords,
      newCompaniesThisPeriod,
      revenueData
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ 'subscription.status': 'active' }),
      User.countDocuments(),
      User.countDocuments({ isActive: true, lastLogin: { $gte: startDate } }),
      Promise.all([
        Permit.countDocuments(),
        Incident.countDocuments(),
        HAZOP.countDocuments(),
        HIRA.countDocuments(),
        BBSReport.countDocuments(),
        Audit.countDocuments()
      ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
      Company.countDocuments({ createdAt: { $gte: startDate } }),
      Company.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$subscription.plan', 'basic'] }, then: 99 },
                    { case: { $eq: ['$subscription.plan', 'professional'] }, then: 299 },
                    { case: { $eq: ['$subscription.plan', 'enterprise'] }, then: 599 }
                  ],
                  default: 99
                }
              }
            }
          }
        }
      ])
    ]);

    // Calculate growth percentages
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime()));
    
    const [
      previousCompanies,
      previousUsers,
      previousRevenue
    ] = await Promise.all([
      Company.countDocuments({ createdAt: { $lt: startDate } }),
      User.countDocuments({ createdAt: { $lt: startDate } }),
      Company.aggregate([
        { $match: { createdAt: { $lt: startDate } } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$subscription.plan', 'basic'] }, then: 99 },
                    { case: { $eq: ['$subscription.plan', 'professional'] }, then: 299 },
                    { case: { $eq: ['$subscription.plan', 'enterprise'] }, then: 599 }
                  ],
                  default: 99
                }
              }
            }
          }
        }
      ])
    ]);

    const currentRevenue = revenueData[0]?.totalRevenue || 0;
    const prevRevenue = previousRevenue[0]?.totalRevenue || 0;

    const stats = {
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      totalRecords,
      newCompaniesThisPeriod,
      currentRevenue,
      monthlyGrowth: previousCompanies > 0 ? ((totalCompanies - previousCompanies) / previousCompanies * 100) : 0,
      userGrowth: previousUsers > 0 ? ((totalUsers - previousUsers) / previousUsers * 100) : 0,
      revenueGrowth: prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Platform stats error:', error);
    res.status(500).json({ message: 'Failed to fetch platform statistics' });
  }
});

// Get revenue data
router.get('/revenue', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const { range = '6m' } = req.query;
    
    const months = range === '12m' ? 12 : 6;
    const revenueData = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const [monthlyRevenue, companiesCount, newCompanies] = await Promise.all([
        Company.aggregate([
          { $match: { createdAt: { $lte: monthEnd } } },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$subscription.plan', 'basic'] }, then: 99 },
                      { case: { $eq: ['$subscription.plan', 'professional'] }, then: 299 },
                      { case: { $eq: ['$subscription.plan', 'enterprise'] }, then: 599 }
                    ],
                    default: 99
                  }
                }
              }
            }
          }
        ]),
        Company.countDocuments({ createdAt: { $lte: monthEnd } }),
        Company.countDocuments({ 
          createdAt: { $gte: monthStart, $lte: monthEnd } 
        })
      ]);

      revenueData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: (monthlyRevenue[0]?.totalRevenue || 0) / 1000, // Convert to thousands
        companies: companiesCount,
        newCompanies,
        churnRate: Math.random() * 2 // Mock churn rate - implement actual calculation
      });
    }

    res.json(revenueData);
  } catch (error) {
    console.error('Revenue data error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue data' });
  }
});

// Get module adoption rates
router.get('/modules/adoption', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const companies = await Company.find({}, 'config.modules');
    const totalCompanies = companies.length;
    
    const modules = ['ptw', 'ims', 'hazop', 'hira', 'bbs', 'audit'];
    const adoptionData = modules.map(module => {
      const enabledCount = companies.filter(c => c.config?.modules?.[module]?.enabled).length;
      return {
        module: module.toUpperCase(),
        enabled: enabledCount,
        total: totalCompanies,
        percentage: totalCompanies > 0 ? Math.round((enabledCount / totalCompanies) * 100) : 0,
        color: {
          ptw: '#3b82f6',
          ims: '#ef4444',
          hazop: '#8b5cf6',
          hira: '#f59e0b',
          bbs: '#10b981',
          audit: '#6366f1'
        }[module]
      };
    });

    res.json(adoptionData);
  } catch (error) {
    console.error('Module adoption error:', error);
    res.status(500).json({ message: 'Failed to fetch module adoption data' });
  }
});

// Get industry distribution
router.get('/industries', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const industryData = await Company.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          color: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'Manufacturing'] }, then: '#3b82f6' },
                { case: { $eq: ['$_id', 'Oil & Gas'] }, then: '#ef4444' },
                { case: { $eq: ['$_id', 'Chemical'] }, then: '#10b981' },
                { case: { $eq: ['$_id', 'Construction'] }, then: '#f59e0b' },
                { case: { $eq: ['$_id', 'Mining'] }, then: '#8b5cf6' },
                { case: { $eq: ['$_id', 'Power Generation'] }, then: '#06b6d4' },
                { case: { $eq: ['$_id', 'Pharmaceuticals'] }, then: '#84cc16' },
                { case: { $eq: ['$_id', 'Other'] }, then: '#f97316' }
              ],
              default: '#6b7280'
            }
          }
        }
      }
    ]);

    res.json(industryData);
  } catch (error) {
    console.error('Industry data error:', error);
    res.status(500).json({ message: 'Failed to fetch industry data' });
  }
});

// Get system health
router.get('/health', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    // Get database connection info
    const dbStats = await Promise.all([
      Company.countDocuments(),
      User.countDocuments(),
      Permit.countDocuments(),
      Incident.countDocuments()
    ]);

    const totalRecords = dbStats.reduce((sum, count) => sum + count, 0);
    
    // Mock system health data - in production, get from actual system monitoring
    const healthData = {
      uptime: 99.9,
      responseTime: 120,
      errorRate: 0.1,
      activeConnections: totalRecords / 100,
      storage: 75,
      memory: 68,
      cpu: 45,
      database: {
        connections: 25,
        queries: 1250,
        avgQueryTime: 15,
        totalRecords
      },
      api: {
        requests: 15000,
        errors: 15,
        avgResponseTime: 120
      }
    };

    res.json(healthData);
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ message: 'Failed to fetch system health' });
  }
});

// Get user activity data
router.get('/activity', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const days = range === '7d' ? 7 : 30;
    
    const activityData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const [activeUsers, newUsers, totalUsers] = await Promise.all([
        User.countDocuments({ 
          lastLogin: { $gte: dayStart, $lt: dayEnd },
          isActive: true 
        }),
        User.countDocuments({ 
          createdAt: { $gte: dayStart, $lt: dayEnd } 
        }),
        User.countDocuments({ createdAt: { $lte: dayEnd } })
      ]);

      activityData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeUsers,
        newUsers,
        sessions: Math.floor(activeUsers * 1.5), // Estimate sessions
        pageViews: Math.floor(activeUsers * 8), // Estimate page views
        apiCalls: Math.floor(activeUsers * 25) // Estimate API calls
      });
    }

    res.json(activityData);
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ message: 'Failed to fetch user activity data' });
  }
});

// Get company growth data
router.get('/growth', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const { range = '12m' } = req.query;
    const months = range === '6m' ? 6 : 12;
    
    const growthData = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const [
        companiesUpToDate,
        newCompanies,
        activeUsersUpToDate,
        monthlyRevenue
      ] = await Promise.all([
        Company.countDocuments({ createdAt: { $lte: monthEnd } }),
        Company.countDocuments({ 
          createdAt: { $gte: monthStart, $lte: monthEnd } 
        }),
        User.countDocuments({ 
          createdAt: { $lte: monthEnd },
          isActive: true 
        }),
        Company.aggregate([
          { $match: { createdAt: { $lte: monthEnd } } },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$subscription.plan', 'basic'] }, then: 99 },
                      { case: { $eq: ['$subscription.plan', 'professional'] }, then: 299 },
                      { case: { $eq: ['$subscription.plan', 'enterprise'] }, then: 599 }
                    ],
                    default: 99
                  }
                }
              }
            }
          }
        ])
      ]);

      growthData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        companies: companiesUpToDate,
        newCompanies,
        revenue: (monthlyRevenue[0]?.totalRevenue || 0) / 1000, // Convert to thousands
        activeUsers: activeUsersUpToDate,
        churnRate: Math.random() * 3 // Mock churn rate
      });
    }

    res.json(growthData);
  } catch (error) {
    console.error('Growth data error:', error);
    res.status(500).json({ message: 'Failed to fetch growth data' });
  }
});

// Get detailed company analytics
router.get('/companies/:companyId/analytics', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const [
      company,
      userCount,
      plantCount,
      permitCount,
      incidentCount,
      hazopCount,
      hiraCount,
      bbsCount,
      auditCount
    ] = await Promise.all([
      Company.findById(companyId),
      User.countDocuments({ companyId }),
      Plant.countDocuments({ companyId }),
      Permit.countDocuments({ companyId }),
      Incident.countDocuments({ companyId }),
      HAZOP.countDocuments({ companyId }),
      HIRA.countDocuments({ companyId }),
      BBSReport.countDocuments({ companyId }),
      Audit.countDocuments({ companyId })
    ]);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const analytics = {
      company: {
        name: company.name,
        industry: company.industry,
        plan: company.subscription?.plan,
        status: company.subscription?.status,
        createdAt: company.createdAt
      },
      metrics: {
        users: userCount,
        plants: plantCount,
        totalRecords: permitCount + incidentCount + hazopCount + hiraCount + bbsCount + auditCount,
        moduleBreakdown: {
          ptw: permitCount,
          ims: incidentCount,
          hazop: hazopCount,
          hira: hiraCount,
          bbs: bbsCount,
          audit: auditCount
        }
      },
      enabledModules: Object.entries(company.config?.modules || {})
        .filter(([_, config]) => config?.enabled)
        .map(([module, _]) => module)
    };

    res.json(analytics);
  } catch (error) {
    console.error('Company analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch company analytics' });
  }
});

// Update company configuration
router.patch('/companies/:companyId/config', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const { companyId } = req.params;
    const { config } = req.body;

    const company = await Company.findByIdAndUpdate(
      companyId,
      { 
        $set: { 
          config,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      message: 'Company configuration updated successfully',
      company
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ message: 'Failed to update company configuration' });
  }
});

// Get system performance metrics
router.get('/performance', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const [
      totalQueries,
      avgResponseTime,
      errorCount,
      activeConnections
    ] = await Promise.all([
      // Mock performance data - implement actual monitoring
      Promise.resolve(15000),
      Promise.resolve(120),
      Promise.resolve(15),
      User.countDocuments({ isActive: true })
    ]);

    const performance = {
      database: {
        totalQueries,
        avgQueryTime: 15,
        connections: Math.floor(activeConnections / 10)
      },
      api: {
        requests: totalQueries,
        avgResponseTime,
        errors: errorCount,
        errorRate: (errorCount / totalQueries) * 100
      },
      system: {
        uptime: 99.9,
        cpu: 45,
        memory: 68,
        storage: 75
      }
    };

    res.json(performance);
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ message: 'Failed to fetch performance metrics' });
  }
});

// Get company list with filters
router.get('/companies', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      industry, 
      status, 
      plan,
      expiring 
    } = req.query;

    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (industry) filter.industry = industry;
    if (status) filter['subscription.status'] = status;
    if (plan) filter['subscription.plan'] = plan;
    
    if (expiring === 'true') {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      filter['subscription.expiryDate'] = { $lte: sevenDaysFromNow };
    }

    const companies = await Company.find(filter)
      .select('name logo industry subscription isActive createdAt updatedAt config')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Company.countDocuments(filter);

    // Add user and plant counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const [userCount, plantCount] = await Promise.all([
          User.countDocuments({ companyId: company._id }),
          Plant.countDocuments({ companyId: company._id })
        ]);

        return {
          ...company.toObject(),
          userCount,
          plantCount,
          enabledModules: Object.entries(company.config?.modules || {})
            .filter(([_, config]) => config?.enabled)
            .map(([module, _]) => module)
        };
      })
    );

    res.json({
      companies: companiesWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Companies list error:', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// Get platform alerts
router.get('/alerts', authenticate, authorize(['platform_owner']), async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const [
      suspendedCompanies,
      expiringCompanies,
      inactiveUsers,
      systemErrors
    ] = await Promise.all([
      Company.countDocuments({ 'subscription.status': 'suspended' }),
      Company.countDocuments({ 
        'subscription.expiryDate': { $lte: sevenDaysFromNow },
        'subscription.status': 'active'
      }),
      User.countDocuments({ 
        isActive: false,
        lastLogin: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      }),
      // Mock system errors - implement actual error tracking
      Promise.resolve(5)
    ]);

    const alerts = {
      suspended: suspendedCompanies,
      expiring: expiringCompanies,
      inactive: inactiveUsers,
      errors: systemErrors,
      total: suspendedCompanies + expiringCompanies + inactiveUsers + systemErrors
    };

    res.json(alerts);
  } catch (error) {
    console.error('Platform alerts error:', error);
    res.status(500).json({ message: 'Failed to fetch platform alerts' });
  }
});

export default router;