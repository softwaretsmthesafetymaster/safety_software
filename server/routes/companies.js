import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import ConfigHelper from '../utils/configHelper.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  validateCompanyCreation, 
  validateCompanyUpdate, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';

const router = express.Router();

// Get all companies (platform owner only)
router.get('/', 
  validatePagination, 
  validate, 
  authenticate, 
  authorize(['platform_owner']), 
  async (req, res) => {
  try {
    const companies = await Company.find()
      .select('name logo industry subscription isActive createdAt')
      .sort({ createdAt: -1 });

    res.json({ companies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new company
router.post('/', validateCompanyCreation, validate, async (req, res) => {
  try {
    // Initialize company with default module configs
    const companyData = ConfigHelper.initializeCompanyConfig(req.body);

    const company = new Company(companyData);
    await company.save();

    res.status(201).json({
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get company by ID
router.get('/:id', authenticate, async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
});

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
      updates,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get company statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    if (req.user.role !== 'platform_owner' && req.user.companyId.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [userCount] = await Promise.all([
      User.countDocuments({ companyId: id, isActive: true })
    ]);

    res.json({
      stats: {
        totalUsers: userCount,
        // Add more statistics as needed
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;