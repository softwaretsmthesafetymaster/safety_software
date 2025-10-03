import express from 'express';
import Area from '../models/Area.js';
import Plant from '../models/Plant.js';
import { authenticate, checkCompanyAccess, authorize } from '../middleware/auth.js';
import { 
  validatePlantCreation, 
  validateAreaCreation, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';

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
    const { page = 1, limit = 10, search } = req.query;

    const filter = { companyId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const plants = await Plant.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Plant.countDocuments(filter);

    res.json({
      plants,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new plant
router.post('/:companyId', 
  validateCompanyId, 
  validatePlantCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  authorize(['company_owner', 'plant_head']), 
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const plantData = {
      ...req.body,
      companyId
    };

    const plant = new Plant(plantData);
    await plant.save();

    res.status(201).json({
      message: 'Plant created successfully',
      plant
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get plant by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const plant = await Plant.findOne({ _id: id, companyId });

    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    res.json({ plant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update plant
router.patch('/:companyId/:id', authenticate, checkCompanyAccess, authorize(['company_owner', 'plant_head']), async (req, res) => {
  try {
    const { companyId, id } = req.params;
    const updates = req.body;

    const plant = await Plant.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    );

    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    res.json({
      message: 'Plant updated successfully',
      plant
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete plant
router.delete('/:companyId/:id', authenticate, checkCompanyAccess, authorize(['company_owner']), async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const plant = await Plant.findOneAndDelete({ _id: id, companyId });

    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add area to plant
router.post(
  '/:companyId/:id/areas',
  authenticate,
  validateCompanyId,
  validateAreaCreation,
  validate,
  validateObjectId('id'),
  checkCompanyAccess,
  authorize(['company_owner', 'plant_head']),
  async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const areaData = req.body;

      // ensure plant exists under the same company
      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      const area = new Area({ ...areaData, plantId: id });
      await area.save();

      res.json({
        message: 'Area added successfully',
        area,
      });
    } catch (error) {
      console.log("Error in Creating Area: ",error)
      res.status(500).json({ message: error.message });
    }
  }
);


// ➤ Update area
router.patch(
  '/:companyId/:id/areas/:areaId',
  authenticate,
  checkCompanyAccess,
  authorize(['company_owner', 'plant_head']),
  async (req, res) => {
    try {
      const { companyId, id, areaId } = req.params;
      const updates = req.body;

      // ensure plant exists under the same company
      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      const area = await Area.findOneAndUpdate(
        { _id: areaId, plantId: id },
        updates,
        { new: true }
      );

      if (!area) {
        return res.status(404).json({ message: 'Area not found' });
      }

      res.json({
        message: 'Area updated successfully',
        area,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);


// ➤ Delete area
router.delete(
  '/:companyId/:id/areas/:areaId',
  authenticate,
  checkCompanyAccess,
  authorize(['company_owner', 'plant_head']),
  async (req, res) => {
    try {
      const { companyId, id, areaId } = req.params;

      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      const area = await Area.findOneAndDelete({ _id: areaId, plantId: id });

      if (!area) {
        return res.status(404).json({ message: 'Area not found' });
      }

      res.json({
        message: 'Area deleted successfully',
        area,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);


// ➤ Get all areas for a plant
router.get(
  '/:companyId/:id/areas',
  authenticate,
  checkCompanyAccess,
  async (req, res) => {
    try {
      const { companyId, id } = req.params;

      const plant = await Plant.findOne({ _id: id, companyId });
      if (!plant) {
        return res.status(404).json({ message: 'Plant not found' });
      }

      const areas = await Area.find({ plantId: id })
        .populate('hod', 'name email')
        .populate('safetyIncharge', 'name email');

      res.json({ areas });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;