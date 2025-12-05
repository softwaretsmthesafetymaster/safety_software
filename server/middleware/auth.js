import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .populate('companyId')
      .populate('plantId', 'name code');
      
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts.' 
      });
    }

    // Check company status
    if (user.companyId && !user.companyId.isActive) {
      return res.status(403).json({ 
        message: 'Company account is inactive.' 
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

export const checkCompanyAccess = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (req.user.role === 'platform_owner') {
      return next();
    }

    if (!req.user.companyId || req.user.companyId._id.toString() !== companyId) {
      return res.status(403).json({
        message: 'Access denied. Cannot access other company data.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error during access check.' });
  }
};

export const checkResourceLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'platform_owner') {
        return next();
      }

      const company = await Company.findById(req.user.companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found.' });
      }

      let currentCount = 0;
      let maxLimit = 0;

      switch (resourceType) {
        case 'users':
          currentCount = await User.countDocuments({ 
            companyId: company._id, 
            isActive: true 
          });
          maxLimit = company.limits.maxUsers;
          break;
        case 'plants':
          const Plant = (await import('../models/Plant.js')).default;
          currentCount = await Plant.countDocuments({ 
            companyId: company._id, 
            isActive: true 
          });
          maxLimit = company.limits.maxPlants;
          break;
        default:
          return next();
      }

      if (currentCount >= maxLimit) {
        return res.status(429).json({ 
          message: `${resourceType} limit reached. Current: ${currentCount}, Max: ${maxLimit}`,
          limit: maxLimit,
          current: currentCount
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error checking resource limits.' });
    }
  };
};

export const enforceCompanyIsolation = (req, res, next) => {
  if (req.user.role === 'platform_owner') {
    return next();
  }

  const userCompanyId = req.user.companyId?._id?.toString();

  if (req.body && !req.body.companyId) {
    req.body.companyId = userCompanyId;
  }

  if (req.query && !req.query.companyId) {
    req.query.companyId = userCompanyId;
  }

  req.filterByCompany = { companyId: userCompanyId };
  next();
};

export const enforceUserIsolation = (req, res, next) => {
  if (['platform_owner', 'company_owner'].includes(req.user.role)) {
    return next();
  }

  req.filterByUser = {
    $or: [
      { createdBy: req.user._id },
      { assignedTo: req.user._id },
      { 'team.members': req.user._id }
    ]
  };

  next();
};