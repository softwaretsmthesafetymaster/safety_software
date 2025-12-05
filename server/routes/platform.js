import express from 'express';
import mongoose from 'mongoose';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Plant from '../models/Plant.js';
import Area from '../models/Area.js';
import Notification from '../models/Notification.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validatePagination, validate } from '../middleware/validation.js';
import logger, { logBusinessEvent } from '../middleware/logger.js';
import NotificationService from '../services/notificationService.js';
import moduleConfigs from '../config/moduleConfigs.js';

const router = express.Router();

// Platform Dashboard Stats
router.get('/dashboard/stats',
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {

      const MODULE_PRICING = {
        ptw: 49,
        hira: 79,
        audit: 99,
        hazop: 129,
        ims: 199,
        bbs: 59
      };

      const [
        totalCompanies,
        activeCompanies,
        totalUsers,
        activeUsers,
        totalPlants,
        totalAreas,
        recentNotifications,
        companies,
        monthlyGrowth
      ] = await Promise.all([
        Company.countDocuments(),
        Company.countDocuments({ isActive: true }),
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Plant.countDocuments(),
        Area.countDocuments(),
        Notification.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        Company.find({}, { config: 1 }), // only fetch module config
        Company.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      // ---- Revenue Calculation Based on Enabled Modules ----

      let totalRevenue = 0;
      let moduleRevenueMap = {};

      companies.forEach(company => {
        const modules = company?.config?.modules || {};
        Object.entries(modules).forEach(([moduleKey, module]) => {
          if (module.enabled && MODULE_PRICING[moduleKey]) {

            // Add module price to total revenue
            totalRevenue += MODULE_PRICING[moduleKey];

            // Track revenue distribution per module
            moduleRevenueMap[moduleKey] = (moduleRevenueMap[moduleKey] || 0) + MODULE_PRICING[moduleKey];
          }
        });
      });

      const moduleRevenueDistribution = Object.entries(moduleRevenueMap).map(([name, revenue]) => ({
        module: name,
        revenue
      }));

      // Industry distribution
      const industryStats = await Company.aggregate([
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // User role distribution
      const roleStats = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        overview: {
          totalCompanies,
          activeCompanies,
          totalUsers,
          activeUsers,
          totalPlants,
          totalAreas,
          recentNotifications
        },
        revenue: {
          total: totalRevenue,
          monthly: totalRevenue, // (future: use per-month billing logic)
          byModule: moduleRevenueDistribution
        },
        growth: {
          monthly: monthlyGrowth,
          companies: activeCompanies,
          users: activeUsers
        },
        distribution: {
          industries: industryStats,
          roles: roleStats
        }
      });

    } catch (error) {
      logger.error('Platform dashboard stats error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);


// Get all companies with detailed stats
router.get('/companies',
  validatePagination,
  validate,
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, industry, status } = req.query;

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { 'contactInfo.email': { $regex: search, $options: 'i' } }
        ];
      }
      if (industry) filter.industry = industry;
      if (status) filter['subscription.status'] = status;

      const companies = await Company.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Company.countDocuments(filter);

      // Get additional stats for each company
      const companiesWithStats = await Promise.all(
        companies.map(async (company) => {
          const [userCount, plantCount, areaCount] = await Promise.all([
            User.countDocuments({ companyId: company._id }),
            Plant.countDocuments({ companyId: company._id }),
            Area.countDocuments({ plantId: { $in: await Plant.find({ companyId: company._id }).distinct('_id') } })
          ]);

          return {
            ...company.toObject(),
            stats: {
              users: userCount,
              plants: plantCount,
              areas: areaCount
            }
          };
        })
      );

      res.json({
        companies: companiesWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get platform companies error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get company configuration
router.get('/companies/:id/config',
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json({
        company: {
          _id: company._id,
          name: company.name,
          industry: company.industry,
          config: company.config,
          subscription: company.subscription,
          limits: company.limits
        },
        availableModules: moduleConfigs
      });
    } catch (error) {
      logger.error('Get company config error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Update company configuration
router.patch('/companies/:id/config',
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { modules, limits, subscription } = req.body;

      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const updates = {};
      if (modules) updates['config.modules'] = modules;
      if (limits) updates.limits = limits;
      if (subscription) updates.subscription = { ...company.subscription, ...subscription };

      const updatedCompany = await Company.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      logBusinessEvent('COMPANY_CONFIG_UPDATED', {
        companyId: id,
        updatedBy: req.user._id,
        updates: Object.keys(updates)
      });

      res.json({
        message: 'Company configuration updated successfully',
        company: updatedCompany
      });
    } catch (error) {
      logger.error('Update company config error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Send notification to company
router.post('/companies/:id/notify',
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message, type = 'info', priority = 'normal', roles, userIds } = req.body;

      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      let result;
      if (userIds && userIds.length > 0) {
        result = await NotificationService.notifyUsers(userIds, {
          title,
          message,
          type,
          priority
        }, id);
      } else if (roles && roles.length > 0) {
        result = await NotificationService.notifyByRole(id, roles, {
          title,
          message,
          type,
          priority
        });
      } else {
        result = await NotificationService.notifyCompany(id, {
          title,
          message,
          type,
          priority
        });
      }

      logBusinessEvent('PLATFORM_NOTIFICATION_SENT', {
        companyId: id,
        sentBy: req.user._id,
        type,
        priority,
        recipientCount: result.length
      });

      res.json({
        message: 'Notification sent successfully',
        recipientCount: result.length
      });
    } catch (error) {
      logger.error('Send company notification error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get all users across platform
router.get('/users',
  validatePagination,
  validate,
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, role, companyId, active } = req.query;

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) filter.role = role;
      if (companyId) filter.companyId = companyId;
      if (active !== undefined) filter.isActive = active === 'true';

      const users = await User.find(filter)
        .populate('companyId', 'name industry')
        .populate('plantId', 'name code')
        .select('-password -security')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(filter);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get platform users error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get all plants across platform
router.get('/plants',
  validatePagination,
  validate,
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, companyId } = req.query;

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }
      if (companyId) filter.companyId = companyId;

      const plants = await Plant.find(filter)
        .populate('companyId', 'name industry')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Plant.countDocuments(filter);

      // Get area counts for each plant
      const plantsWithStats = await Promise.all(
        plants.map(async (plant) => {
          const areaCount = await Area.countDocuments({ plantId: plant._id });
          const userCount = await User.countDocuments({ plantId: plant._id });
          
          return {
            ...plant.toObject(),
            stats: {
              areas: areaCount,
              users: userCount
            }
          };
        })
      );

      res.json({
        plants: plantsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get platform plants error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get all areas across platform
router.get('/areas',
  validatePagination,
  validate,
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, plantId, riskLevel } = req.query;

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }
      if (plantId) filter.plantId = plantId;
      if (riskLevel) filter['riskProfile.level'] = riskLevel;

      const areas = await Area.find(filter)
        .populate('plantId', 'name code companyId')
        .populate({
          path: 'plantId',
          populate: {
            path: 'companyId',
            select: 'name industry'
          }
        })
        .populate('personnel.hod', 'name email')
        .populate('personnel.safetyIncharge', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Area.countDocuments(filter);

      res.json({
        areas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get platform areas error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get platform analytics
router.get('/analytics',
  authenticate,
  authorize(['platform_owner']),
  async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      let dateFilter;
      switch (period) {
        case '7d':
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const [
        userGrowth,
        companyGrowth,
        notificationTrends,
        moduleUsage
      ] = await Promise.all([
        User.aggregate([
          { $match: { createdAt: { $gte: dateFilter } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.date': 1 } }
        ]),
        Company.aggregate([
          { $match: { createdAt: { $gte: dateFilter } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.date': 1 } }
        ]),
        Notification.aggregate([
          { $match: { createdAt: { $gte: dateFilter } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                type: '$type'
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.date': 1 } }
        ]),
        Company.aggregate([
          { $unwind: { path: '$config.modules', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$config.modules.k',
              enabled: {
                $sum: { $cond: [{ $eq: ['$config.modules.v.enabled', true] }, 1, 0] }
              },
              total: { $sum: 1 }
            }
          }
        ])
      ]);

      res.json({
        userGrowth,
        companyGrowth,
        notificationTrends,
        moduleUsage
      });
    } catch (error) {
      logger.error('Get platform analytics error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;