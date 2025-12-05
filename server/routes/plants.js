import express from 'express';
import mongoose from 'mongoose';
import Plant from '../models/Plant.js';
import Area from '../models/Area.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { authenticate, checkCompanyAccess, authorize, checkResourceLimits } from '../middleware/auth.js';
import { 
  validatePlantCreation, 
  validateAreaCreation, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';
import logger, { logBusinessEvent } from '../middleware/logger.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

// Get all plants for a company
router.get('/:companyId', 
  validateCompanyId, 
  validatePagination, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, search, active } = req.query;

      const filter = { companyId };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }
      if (active !== undefined) {
        filter.isActive = active === 'true';
      }

      const plants = await Plant.find(filter)
        .populate('contact.manager', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Plant.countDocuments(filter);

      // Get area counts for each plant
      const plantsWithAreaCount = await Promise.all(
        plants.map(async (plant) => {
          const areaCount = await Area.countDocuments({ plantId: plant._id });
          return {
            ...plant.toObject(),
            areaCount
          };
        })
      );

      res.json({
        plants: plantsWithAreaCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get plants error', { 
        error: error.message, 
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create new plant
router.post('/:companyId', 
  validateCompanyId, 
  // validatePlantCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess,
  checkResourceLimits('plants'),
  authorize(['company_owner', 'plant_head']), 
  async (req, res) => {
    try {
      const { companyId } = req.params;
      const plantData = { ...req.body, companyId };
      // Check if plant code already exists
      const existingPlant = await Plant.findOne({ code: plantData.code });
      if (existingPlant) {
        return res.status(400).json({ 
          message: 'Plant code already exists. Please choose a different code.' 
        });
      }

      const plant = new Plant(plantData);
      await plant.save();

      logBusinessEvent('PLANT_CREATED', {
        plantId: plant._id,
        plantName: plant.name,
        plantCode: plant.code,
        companyId,
        createdBy: req.user._id
      });

      // Notify relevant users
      await NotificationService.notifyByRole(
        companyId,
        ['company_owner', 'plant_head'],
        {
          title: 'New Plant Created',
          message: `Plant "${plant.name}" (${plant.code}) has been created.`,
          type: 'info',
          metadata: { plantId: plant._id }
        }
      );

      res.status(201).json({
        message: 'Plant created successfully',
        plant
      });
    } catch (error) {
      logger.error('Create plant error', { 
        error: error.message, 
        companyId: req.params.companyId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get plant by ID
router.get('/:companyId/:id', 
  validateCompanyId,
  validateObjectId('id'),
  validate,
  authenticate, 
  checkCompanyAccess, 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const plant = await Plant.findOne({ _id: id, companyId })
        .populate('contact.manager', 'name email phone');

      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      // Get additional statistics
      const [areaCount, userCount] = await Promise.all([
        Area.countDocuments({ plantId: id }),
        User.countDocuments({ plantId: id, isActive: true })
      ]);

      res.json({ 
        plant: {
          ...plant.toObject(),
          statistics: {
            areas: areaCount,
            users: userCount
          }
        }
      });
    } catch (error) {
      logger.error('Get plant error', { 
        error: error.message, 
        plantId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Update plant
router.patch('/:companyId/:id', 
  validateCompanyId,
  validateObjectId('id'),
  validate,
  authenticate, 
  checkCompanyAccess, 
  authorize(['company_owner', 'plant_head']), 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const updates = req.body;

      // Check if plant code exists (if being updated)
      if (updates.code) {
        const existingPlant = await Plant.findOne({ 
          code: updates.code, 
          _id: { $ne: id } 
        });
        if (existingPlant) {
          return res.status(400).json({ 
            message: 'Plant code already exists. Please choose a different code.' 
          });
        }
      }

      const plant = await Plant.findOneAndUpdate(
        { _id: id, companyId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      logBusinessEvent('PLANT_UPDATED', {
        plantId: plant._id,
        plantName: plant.name,
        companyId,
        updatedBy: req.user._id,
        updatedFields: Object.keys(updates)
      });

      res.json({
        message: 'Plant updated successfully',
        plant
      });
    } catch (error) {
      logger.error('Update plant error', { 
        error: error.message, 
        plantId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Delete plant
router.delete('/:companyId/:id', 
  validateCompanyId,
  validateObjectId('id'),
  validate,
  authenticate, 
  checkCompanyAccess, 
  authorize(['company_owner']), 
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      // Check if plant has areas
      const areaCount = await Area.countDocuments({ plantId: id });
      if (areaCount > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete plant with existing areas. Please delete all areas first.' 
        });
      }

      // Check if plant has users
      const userCount = await User.countDocuments({ plantId: id, isActive: true });
      if (userCount > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete plant with active users. Please reassign or deactivate users first.' 
        });
      }

      const plant = await Plant.findOneAndDelete({ _id: id, companyId });

      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      logBusinessEvent('PLANT_DELETED', {
        plantId: plant._id,
        plantName: plant.name,
        plantCode: plant.code,
        companyId,
        deletedBy: req.user._id
      });

      res.json({ message: 'Plant deleted successfully' });
    } catch (error) {
      logger.error('Delete plant error', { 
        error: error.message, 
        plantId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get all areas for a plant
router.get('/:companyId/:id/areas',
  validateCompanyId,
  validateObjectId('id'),
  validate,
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const { search, riskLevel } = req.query;

      // Verify plant exists
      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      const filter = { plantId: id };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }
      if (riskLevel) {
        filter['riskProfile.level'] = riskLevel;
      }

      const areas = await Area.find(filter)
        .populate('personnel.hod', 'name email')
        .populate('personnel.safetyIncharge', 'name email')
        .populate('personnel.supervisor', 'name email')
        .sort({ name: 1 });

      res.json({ areas });
    } catch (error) {
      logger.error('Get plant areas error', { 
        error: error.message, 
        plantId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Add area to plant
router.post('/:companyId/:id/areas',
  validateCompanyId,
  validateObjectId('id'),
  validateAreaCreation,
  validate,
  authenticate,
  checkCompanyAccess,
  authorize(['company_owner', 'plant_head']),
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const areaData = req.body;

      // Verify plant exists
      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      // Check if area code already exists in this plant
      const existingArea = await Area.findOne({ 
        code: areaData.code, 
        plantId: id 
      });
      if (existingArea) {
        return res.status(400).json({ 
          message: 'Area code already exists in this plant. Please choose a different code.' 
        });
      }

      const area = new Area({ ...areaData, plantId: id });
      await area.save();

      // Populate personnel details
      await area.populate([
        { path: 'personnel.hod', select: 'name email' },
        { path: 'personnel.safetyIncharge', select: 'name email' },
        { path: 'personnel.supervisor', select: 'name email' }
      ]);

      logBusinessEvent('AREA_CREATED', {
        areaId: area._id,
        areaName: area.name,
        areaCode: area.code,
        plantId: id,
        companyId,
        createdBy: req.user._id
      });

      // Notify plant users
      await NotificationService.notifyPlant(
        id,
        {
          title: 'New Area Created',
          message: `Area "${area.name}" (${area.code}) has been created in ${plant.name}.`,
          type: 'info',
          metadata: { areaId: area._id, plantId: id }
        },
        companyId
      );

      res.status(201).json({
        message: 'Area created successfully',
        area
      });
    } catch (error) {
      logger.error('Create area error', { 
        error: error.message, 
        plantId: req.params.id 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Update area
router.patch('/:companyId/:id/areas/:areaId',
  validateCompanyId,
  validateObjectId('id'),
  validateObjectId('areaId'),
  validate,
  authenticate,
  checkCompanyAccess,
  authorize(['company_owner', 'plant_head']),
  async (req, res) => {
    try {
      const { companyId, id, areaId } = req.params;
      const updates = req.body;

      // Verify plant exists
      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      // Check if area code exists (if being updated)
      if (updates.code) {
        const existingArea = await Area.findOne({ 
          code: updates.code, 
          plantId: id,
          _id: { $ne: areaId }
        });
        if (existingArea) {
          return res.status(400).json({ 
            message: 'Area code already exists in this plant. Please choose a different code.' 
          });
        }
      }

      const area = await Area.findOneAndUpdate(
        { _id: areaId, plantId: id },
        { $set: updates },
        { new: true, runValidators: true }
      ).populate([
        { path: 'personnel.hod', select: 'name email' },
        { path: 'personnel.safetyIncharge', select: 'name email' },
        { path: 'personnel.supervisor', select: 'name email' }
      ]);

      if (!area) {
        return res.status(404).json({ message: 'Area not found' });
      }

      logBusinessEvent('AREA_UPDATED', {
        areaId: area._id,
        areaName: area.name,
        plantId: id,
        companyId,
        updatedBy: req.user._id,
        updatedFields: Object.keys(updates)
      });

      res.json({
        message: 'Area updated successfully',
        area
      });
    } catch (error) {
      logger.error('Update area error', { 
        error: error.message, 
        areaId: req.params.areaId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Delete area
router.delete('/:companyId/:id/areas/:areaId',
  validateCompanyId,
  validateObjectId('id'),
  validateObjectId('areaId'),
  validate,
  authenticate,
  checkCompanyAccess,
  authorize(['company_owner', 'plant_head']),
  async (req, res) => {
    try {
      const { companyId, id, areaId } = req.params;

      // Verify plant exists
      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      const area = await Area.findOneAndDelete({ _id: areaId, plantId: id });

      if (!area) {
        return res.status(404).json({ message: 'Area not found' });
      }

      logBusinessEvent('AREA_DELETED', {
        areaId: area._id,
        areaName: area.name,
        areaCode: area.code,
        plantId: id,
        companyId,
        deletedBy: req.user._id
      });

      res.json({ message: 'Area deleted successfully' });
    } catch (error) {
      logger.error('Delete area error', { 
        error: error.message, 
        areaId: req.params.areaId 
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;