import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Plant from '../models/Plant.js';
import { authenticate, authorize, checkCompanyAccess } from '../middleware/auth.js';
import { 
  validateCompanyCreation, 
  validateCompanyUpdate, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';
import logger, { logBusinessEvent } from '../middleware/logger.js';
import NotificationService from '../services/notificationService.js';
import moduleConfigs from '../config/moduleConfigs.js';

const router = express.Router();

// Initialize company configuration
const initializeCompanyConfig = (data) => {
  const moduleDefaults = {};
  const roleSet = new Set();

  // Initialize all modules as disabled by default
  for (const moduleName in moduleConfigs) {
    const moduleConfig = moduleConfigs[moduleName].default || {};
    
    moduleDefaults[moduleName] = {
      ...moduleConfig,
      enabled: false // Disable by default
    };

    // Extract roles from module configs
    if (Array.isArray(moduleConfig.roles)) {
      moduleConfig.roles.forEach(role => roleSet.add(role));
    }
  }

  return {
    ...data,
    config: {
      modules: moduleDefaults,
      roles: Array.from(roleSet),
      branding: data.config?.branding || {},
      notifications: data.config?.notifications || {},
      security: data.config?.security || {}
    }
  };
};

// Get all companies (platform owner only)
router.get('/', 
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
        .select('name logo industry subscription isActive createdAt contactInfo')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Company.countDocuments(filter);

      res.json({
        companies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get companies error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create new company
router.post('/', 
  validateCompanyCreation, 
  validate, 
  async (req, res) => {
    try {
      // Initialize company with default module configs
      const companyData = initializeCompanyConfig(req.body);
      
      const company = new Company(companyData);
      await company.save();

      logBusinessEvent('COMPANY_CREATED', {
        companyId: company._id,
        name: company.name,
        industry: company.industry,
        createdBy: req.user?._id
      });

      res.status(201).json({
        message: 'Company created successfully',
        company
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'Company with this name already exists' 
        });
      }
      
      logger.error('Create company error', { error: error.message });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get company by ID
router.get('/:id', 
  validateObjectId('id'),
  validate,
  authenticate, 
  async (req, res) => {
    try {
      let query = { _id: req.params.id };
      
      // Non-platform owners can only access their own company
      if (req.user.role !== 'platform_owner') {
        if (req.user.companyId._id.toString() !== req.params.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const company = await Company.findOne(query);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json({ company });
    } catch (error) {
      logger.error('Get company error', { error: error.message, companyId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Update company
router.patch('/:id', 
  validateObjectId('id'), 
  validateCompanyUpdate, 
  validate, 
  authenticate, 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check permissions
      if (req.user.role !== 'platform_owner' && req.user.role !== 'company_owner') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      if (req.user.role === 'company_owner' && req.user.companyId._id.toString() !== id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const company = await Company.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      logBusinessEvent('COMPANY_UPDATED', {
        companyId: company._id,
        updatedBy: req.user._id,
        updatedFields: Object.keys(updates)
      });

      res.json({
        message: 'Company updated successfully',
        company
      });
    } catch (error) {
      logger.error('Update company error', { 
        error: error.message, 
        companyId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get company statistics
router.get('/:id/stats', 
  validateObjectId('id'),
  validate,
  authenticate, 
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const [
        totalUsers,
        activeUsers,
        totalPlants,
        activePlants
      ] = await Promise.all([
        User.countDocuments({ companyId: id }),
        User.countDocuments({ companyId: id, isActive: true }),
        Plant.countDocuments({ companyId: id }),
        Plant.countDocuments({ companyId: id, isActive: true })
      ]);

      // Get user distribution by role
      const usersByRole = await User.aggregate([
        { $match: { companyId: mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      res.json({
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            byRole: usersByRole
          },
          plants: {
            total: totalPlants,
            active: activePlants
          }
        }
      });
    } catch (error) {
      logger.error('Get company stats error', { 
        error: error.message, 
        companyId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Update company module configuration
router.patch('/:id/modules',
  validateObjectId('id'),
  validate,
  authenticate,
  authorize(['platform_owner', 'company_owner']),
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { modules } = req.body;

      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Update module configuration
      company.config.modules = { ...company.config.modules, ...modules };
      await company.save();

      logBusinessEvent('COMPANY_MODULES_UPDATED', {
        companyId: id,
        updatedBy: req.user._id,
        modules: Object.keys(modules)
      });

      // Notify users about module changes
      await NotificationService.notifyByRole(
        id,
        ['company_owner', 'plant_head'],
        {
          title: 'Module Configuration Updated',
          message: 'Company module settings have been updated. Please review the changes.',
          type: 'info',
          priority: 'normal'
        }
      );

      res.json({
        message: 'Module configuration updated successfully',
        modules: company.config.modules
      });
    } catch (error) {
      logger.error('Update company modules error', { 
        error: error.message, 
        companyId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;