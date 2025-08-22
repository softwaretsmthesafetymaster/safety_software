import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all companies (platform owner only)
router.get('/', authenticate, authorize(['platform_owner']), async (req, res) => {
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
router.post('/',  async (req, res) => {
  try {
    const companyData = req.body;
    
    // Set default configuration
    if (!companyData.config) {
      companyData.config = {
        modules: {
          ptw: {
            enabled: true,
            workflows: {
              approval: [
                { step: 1, role: 'safety_incharge', required: true },
                { step: 2, role: 'plant_head', required: true }
              ]
            },
            checklists: [
              {
                category: 'PPE',
                items: ['Hard Hat', 'Safety Glasses', 'Gloves', 'Safety Shoes']
              }
            ]
          },
          ims: {
            enabled: true,
            severityLevels: [
              { level: 'Low', color: '#22c55e', escalation: 'safety_incharge' },
              { level: 'Medium', color: '#f59e0b', escalation: 'plant_head' },
              { level: 'High', color: '#ef4444', escalation: 'company_owner' },
              { level: 'Critical', color: '#dc2626', escalation: 'company_owner' }
            ]
          },
          hazop: { enabled: true },
          hira: { enabled: true },
          bbs: { enabled: true },
          audit: { enabled: true }
        }
      };
    }

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
router.patch('/:id', authenticate, async (req, res) => {
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