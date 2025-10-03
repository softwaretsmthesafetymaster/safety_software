import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyId, plantId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate company if not platform owner
    if (role !== 'platform_owner' && companyId) {
      const company = await Company.findById(companyId);
      if (!company || !company.isActive) {
        return res.status(400).json({ message: 'Invalid or inactive company' });
      }
    }

    const user = new User({
      name,
      email,
      password,
      role,
      companyId: role !== 'platform_owner' ? companyId : undefined,
      plantId
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      // token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        isPaid: user.isPaid,

      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
    .populate('companyId')
    .populate('plantId' , 'name code');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPaid: user.isPaid,
        plantId:user.plantId,
        companyId: user.companyId?._id,
        company: user.companyId ? {
          name: user.companyId.name,
          logo: user.companyId.logo
        } : null,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      // .populate('companyId', 'name logo')
      .populate('plantId', 'name code');

    res.json({ user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPaid: user.isPaid,
      plantId:user.plantId,
      companyId: user.companyId?._id,
      company: user.companyId ? {
        name: user.companyId.name,
        logo: user.companyId.logo
      } : null,
      permissions: user.permissions
    } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    console.log(req.body);
    const updates = req.body;
    delete updates.password; // Prevent password update through this route
    delete updates.role; // Prevent role change through this route

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Change password
router.patch('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;