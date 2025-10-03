import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
      // console.log('Token:', token);
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('companyId');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

export const checkCompanyAccess = (req, res, next) => {
  const { companyId } = req.params;
  
  if (req.user.role === 'platform_owner') {
    return next();
  }
  // console.log('User company ID:', req.user.companyId?._id.toString());
  // console.log('Requested company ID:', companyId);
  if (req.user.companyId?._id?.toString() !== companyId) {
    return res.status(403).json({ 
      message: 'Access denied. Cannot access other company data.' 
    });
  }
  
  next();
};