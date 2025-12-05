import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Plant from '../models/Plant.js';
import Company from '../models/Company.js';
import { authenticate, checkCompanyAccess, authorize, checkResourceLimits } from '../middleware/auth.js';
import { 
  validateUserCreation, 
  validateUserUpdate, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';
import logger, { logBusinessEvent } from '../middleware/logger.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

// Get all users for a company
router.get('/:companyId', 
  validateCompanyId, 
  validatePagination, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, role, search, plantId, active } = req.query;

      const filter = { companyId };
      if (role) filter.role = role;
      if (plantId) filter.plantId = plantId;
      if (active !== undefined) filter.isActive = active === 'true';
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'profile.employeeId': { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-password -security')
        .populate('plantId', 'name code')
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
      logger.error('Get users error', { 
        error: error.message, 
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get users in a specific plant
router.get('/:companyId/:plantId',
  validateCompanyId,
  validateObjectId('plantId'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, plantId } = req.params;
      const { role, search, active } = req.query;

      // Verify plant exists and belongs to company
      const plant = await Plant.findOne({ _id: plantId, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      const filter = { companyId, plantId };
      if (role) filter.role = role;
      if (active !== undefined) filter.isActive = active === 'true';
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-password -security')
        .populate('plantId', 'name code')
        .sort({ name: 1 });

      res.json({ users });
    } catch (error) {
      logger.error('Get plant users error', { 
        error: error.message, 
        companyId: req.params.companyId,
        plantId: req.params.plantId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create new user
router.post('/:companyId', 
  validateCompanyId, 
  validateUserCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess,
  checkResourceLimits('users'),
  authorize(['company_owner', 'plant_head']), 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { role, plantId } = req.body;
      // Validation based on user role
      if (req.user.role === 'plant_head') {
        // Plant head can only create users for their plant
        if (!plantId || plantId !== req.user.plantId._id.toString()) {
          return res.status(400).json({ 
            message: 'Plant head can only create users for their assigned plant' 
          });
        }
        
        // Plant head cannot create certain roles
        const restrictedRoles = ['company_owner', 'plant_head', 'platform_owner'];
        if (restrictedRoles.includes(role)) {
          return res.status(403).json({ 
            message: 'Insufficient permissions to create this role' 
          });
        }
      }

      // Verify plant exists if plantId is provided
      if (plantId) {
        const plant = await Plant.findOne({ _id: plantId, companyId });
        if (!plant) {
          return res.status(400).json({ message: 'Invalid plant ID' });
        }
      }

      const userData = {
        ...req.body,
        companyId
      };

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists with this email' 
        });
      }

      const user = new User(userData);
      await user.save();

      logBusinessEvent('USER_CREATED', {
        userId: user._id,
        email: user.email,
        role: user.role,
        companyId,
        plantId: user.plantId,
        createdBy: req.user._id
      });

      // Send welcome notification
      await NotificationService.createNotification({
        title: 'Account Created',
        message: `Welcome to SafetyPro! Your account has been created successfully.`,
        type: 'success',
        userId: user._id,
        companyId
      });

      // Notify managers
      const notificationRoles = req.user.role === 'plant_head' 
        ? ['company_owner'] 
        : ['company_owner', 'plant_head'];

      await NotificationService.notifyByRole(
        companyId,
        notificationRoles,
        {
          title: 'New User Created',
          message: `New user "${user.name}" (${user.role}) has been created.`,
          type: 'info',
          metadata: { userId: user._id }
        }
      );

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.security;

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } catch (error) {
      logger.error('Create user error', { 
        error: error.message, 
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get user by ID
router.get('/:companyId/:id', 
  validateCompanyId,
  validateObjectId('id'),
  validate,
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const user = await User.findOne({ _id: id, companyId })
        .select('-password -security.resetPasswordToken -security.resetPasswordExpires')
        .populate('plantId', 'name code')
        .populate('companyId', 'name industry');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      logger.error('Get user error', { 
        error: error.message, 
        userId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Update user
router.patch('/:companyId/:id', 
  validateCompanyId, 
  validateObjectId('id'), 
  validateUserUpdate, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated via this route
      delete updates.password;
      delete updates.security;
      delete updates.companyId;

      // Check permissions
      const canUpdate = 
        req.user.role === 'company_owner' ||
        (req.user.role === 'plant_head' && updates.role !== 'company_owner') ||
        req.user._id.toString() === id;

      if (!canUpdate) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      // Validate plant assignment for plant heads
      if (req.user.role === 'plant_head' && updates.plantId) {
        if (updates.plantId !== req.user.plantId._id.toString()) {
          return res.status(403).json({ 
            message: 'Plant head can only assign users to their own plant' 
          });
        }
      }

      const user = await User.findOneAndUpdate(
        { _id: id, companyId },
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password -security');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      logBusinessEvent('USER_UPDATED', {
        userId: user._id,
        updatedBy: req.user._id,
        updatedFields: Object.keys(updates)
      });

      res.json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      logger.error('Update user error', { 
        error: error.message, 
        userId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Deactivate user
router.patch('/:companyId/:id/deactivate', 
  validateCompanyId,
  validateObjectId('id'),
  validate,
  authenticate, 
  checkCompanyAccess, 
  authorize(['company_owner', 'plant_head']), 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const user = await User.findOneAndUpdate(
        { _id: id, companyId },
        { 
          isActive: false,
          'security.lockedUntil': undefined,
          'security.loginAttempts': 0
        },
        { new: true }
      ).select('-password -security');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      logBusinessEvent('USER_DEACTIVATED', {
        userId: user._id,
        deactivatedBy: req.user._id
      });

      // Notify user about deactivation
      await NotificationService.createNotification({
        title: 'Account Deactivated',
        message: 'Your account has been deactivated. Please contact your administrator.',
        type: 'warning',
        priority: 'high',
        userId: user._id,
        companyId
      });

      res.json({
        message: 'User deactivated successfully',
        user
      });
    } catch (error) {
      logger.error('Deactivate user error', { 
        error: error.message, 
        userId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Activate user
router.patch('/:companyId/:id/activate', 
  validateCompanyId,
  validateObjectId('id'),
  validate,
  authenticate, 
  checkCompanyAccess, 
  authorize(['company_owner', 'plant_head']), 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const user = await User.findOneAndUpdate(
        { _id: id, companyId },
        { isActive: true },
        { new: true }
      ).select('-password -security');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      logBusinessEvent('USER_ACTIVATED', {
        userId: user._id,
        activatedBy: req.user._id
      });

      // Notify user about activation
      await NotificationService.createNotification({
        title: 'Account Activated',
        message: 'Your account has been activated. Welcome back!',
        type: 'success',
        userId: user._id,
        companyId
      });

      res.json({
        message: 'User activated successfully',
        user
      });
    } catch (error) {
      logger.error('Activate user error', { 
        error: error.message, 
        userId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get user statistics
router.get('/:companyId/stats', 
  validateCompanyId,
  validate,
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;

      const [
        total,
        active,
        inactive,
        byRole,
        byPlant
      ] = await Promise.all([
        User.countDocuments({ companyId }),
        User.countDocuments({ companyId, isActive: true }),
        User.countDocuments({ companyId, isActive: false }),
        User.aggregate([
          { $match: { companyId: mongoose.Types.ObjectId(companyId) } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        User.aggregate([
          { $match: { companyId: mongoose.Types.ObjectId(companyId), plantId: { $exists: true } } },
          {
            $lookup: {
              from: 'plants',
              localField: 'plantId',
              foreignField: '_id',
              as: 'plant'
            }
          },
          { $unwind: '$plant' },
          { $group: { _id: { id: '$plantId', name: '$plant.name' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      res.json({
        stats: {
          total,
          active,
          inactive,
          byRole,
          byPlant
        }
      });
    } catch (error) {
      logger.error('Get user stats error', { 
        error: error.message, 
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;