import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js'
import crypto from 'crypto';;
import NotificationService from '../services/notificationService.js';
import { authenticate } from '../middleware/auth.js';
import logger, { logSecurityEvent, logBusinessEvent } from '../middleware/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
};

// JWT Create Token Function
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/* ---------------------------------------------------
   REGISTER USER
------------------------------------------------------ */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyId, plantId,profile } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists with this email' });

    // Validate company
    if (role !== 'platform_owner' && companyId) {
      const company = await Company.findById(companyId);
      if (!company || !company.isActive)
        return res.status(400).json({ message: 'Invalid or inactive company' });
    

    // Check user limits
        const userCount = await User.countDocuments({ 
          companyId, 
          isActive: true 
        });
        
        if (userCount >= company.limits.maxUsers) {
          return res.status(429).json({ 
            message: 'Company user limit reached',
            limit: company.limits.maxUsers
          });
        }
    }
    const user = new User({
      name,
      email,
      password,
      role,
      companyId: role !== 'platform_owner' ? companyId : undefined,
      plantId,
      profile: profile || {}
    });

    await user.save();

    const token = createToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);

    logBusinessEvent('USER_REGISTERED', {
        userId: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      });

    if (user.companyId) {
        await NotificationService.createNotification({
          title: 'Welcome to SafetyPro',
          message: `Welcome ${user.name}! Your account has been successfully created.`,
          type: 'success',
          userId: user._id,
          companyId: user.companyId
        });
      }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------------------------------------------
   LOGIN USER
------------------------------------------------------ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('companyId').populate('plantId', 'name code');
    if (!user)
      return res.status(401).json({ message: 'User Not Found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        await user.incrementLoginAttempts();
        logSecurityEvent('LOGIN_ATTEMPT_INVALID_PASSWORD', { 
          userId: user._id, 
          email, 
          ip: req.ip 
        });
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    if (!user.isActive)
      return res.status(401).json({ message: 'Account is inactive' });
    // Check company status
      if (user.companyId && !user.companyId.isActive) {
        return res.status(403).json({ message: 'Company account is inactive' });
      }

    user.security.loginAttempts = 0;
    user.security.lockedUntil = undefined;
    user.security.lastLogin = new Date();
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });
    await user.save();

    const token = createToken(user);

    // ⬇️ THIS WAS MISSING EARLIER ⬇️
    res.cookie('token', token, COOKIE_OPTIONS);

    const loginUser = await User.findById(user._id)
      .populate('plantId', 'name code address')
      .select('-password');

    res.json({
      message: 'Login successful',
      user: loginUser
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------------------------------------------
   LOGOUT
------------------------------------------------------ */
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  logBusinessEvent('USER_LOGOUT', {
    userId: req.user?._id,
    ip: req.ip
  });
  res.json({ message: 'Logout successful' });
});

/* ---------------------------------------------------
   GET PROFILE
------------------------------------------------------ */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('plantId', 'name code');

    res.status(200).json({ user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------------------------------------------
   UPDATE PROFILE
------------------------------------------------------ */
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({ message: 'Profile updated successfully', user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------------------------------------------
   CHANGE PASSWORD
------------------------------------------------------ */
router.patch('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
