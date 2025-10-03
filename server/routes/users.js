import express from 'express';
import User from '../models/User.js';
import { authenticate, checkCompanyAccess, authorize } from '../middleware/auth.js';
import { 
  validateUserCreation, 
  validateUserUpdate, 
  validateCompanyId, 
  validateObjectId, 
  validatePagination,
  validate 
} from '../middleware/validation.js';

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
    const { page = 1, limit = 10, role, search, plantId } = req.query;

    const filter = { companyId };
    if (role) filter.role = role;
    if (plantId) filter.plantId = plantId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('plantId', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//fetch user in a plant of a company
router.get('/:companyId/:plantId',
  validateCompanyId,
  validate,
  authenticate,
  checkCompanyAccess,
  async(req,res) => {
    try{
      const {companyId,plantId}=req.params
      const users=await User.find({companyId,plantId})
      .populate('plantId','name code')
      .select('-password')
      res.json({users})
    }catch(error){
      console.log(error)
      res.status(500).json({message:error.message})
    }

  }
)

// Create new user
router.post('/:companyId', 
  validateCompanyId, 
  validateUserCreation, 
  validate, 
  authenticate, 
  checkCompanyAccess, 
  authorize(['company_owner', 'plant_head']), 
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const {role,plantId}=req.body
    if (!plantId){
      return res.status(400).json({ message: 'Plant ID is required for plant_head role' });
    }
    if (!role){
      return res.status(400).json({ message: 'Role is required' });
    }
    const userData = {
      ...req.body,
      companyId
    };
    
    
    userData.isPaid = req.user.isPaid; // Default to false, can be updated later

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User(userData);
    await user.save();
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:companyId/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const user = await User.findOne({ _id: id, companyId })
      .select('-password')
      .populate('plantId', 'name code areas');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

    // Prevent password update through this route
    delete updates.password;

    // Check permissions
    if (req.user.role !== 'company_owner' && req.user.role !== 'plant_head' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, companyId },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Deactivate user
router.patch('/:companyId/:id/deactivate', authenticate, checkCompanyAccess, authorize(['company_owner', 'plant_head']), async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const user = await User.findOneAndUpdate(
      { _id: id, companyId },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Activate user
router.patch('/:companyId/:id/activate', authenticate, checkCompanyAccess, authorize(['company_owner', 'plant_head']), async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const user = await User.findOneAndUpdate(
      { _id: id, companyId },
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User activated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user statistics
router.get('/:companyId/stats/dashboard', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;

    const [
      total,
      active,
      inactive,
      byRole
    ] = await Promise.all([
      User.countDocuments({ companyId }),
      User.countDocuments({ companyId, isActive: true }),
      User.countDocuments({ companyId, isActive: false }),
      User.aggregate([
        { $match: { companyId: companyId } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      stats: {
        total,
        active,
        inactive,
        byRole
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;