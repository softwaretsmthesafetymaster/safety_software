import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common validations
export const validateObjectId = (field) => [
  param(field).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid ${field} format`);
    }
    return true;
  })
];

export const validateCompanyId = [
  param('companyId').custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid company ID format');
    }
    return true;
  })
];

// User Validations
export const validateUserCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
    
  body('role')
    .isIn(['platform_owner', 'company_owner', 'plant_head', 'safety_incharge', 'hod', 'contractor', 'worker', 'user', 'admin'])
    .withMessage('Invalid role'),
  
  body('plantId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid plant ID format');
      }
      return true;
    }),
  
    
  body('profile.employeeId')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Employee ID must not exceed 50 characters')
];

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('role')
    .optional()
    .isIn(['platform_owner', 'company_owner', 'plant_head', 'safety_incharge', 'hod', 'contractor', 'worker', 'user', 'admin'])
    .withMessage('Invalid role'),
  
  
];

// Plant Validations
export const validatePlantCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plant name must be between 2 and 100 characters'),
  
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Plant code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-_]+$/i)
    .withMessage('Plant code can only contain letters, numbers, hyphens, and underscores'),
  
  body('location.coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('capacity.maxEmployees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max employees must be a positive integer')
];

// Area Validations
export const validateAreaCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Area name must be between 2 and 100 characters'),
  
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Area code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-_]+$/i)
    .withMessage('Area code can only contain letters, numbers, hyphens, and underscores'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('personnel.hod')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid HOD ID format');
      }
      return true;
    }),
  
  body('personnel.safetyIncharge')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Safety Incharge ID format');
      }
      return true;
    }),
  
  body('riskProfile.level')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid risk level'),
  
  body('capacity.maxPersonnel')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max personnel must be a positive integer')
];

// Company Validations
export const validateCompanyCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('industry')
    .isIn([
      'Manufacturing', 'Oil & Gas', 'Chemical', 'Construction',
      'Mining', 'Power Generation', 'Pharmaceuticals',
      'Food & Beverage', 'Automotive', 'Aerospace', 'Other'
    ])
    .withMessage('Invalid industry'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('contactInfo.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('contactInfo.website')
    .optional()
    .isURL()
    .withMessage('Valid website URL is required')
];

export const validateCompanyUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('industry')
    .optional()
    .isIn([
      'Manufacturing', 'Oil & Gas', 'Chemical', 'Construction',
      'Mining', 'Power Generation', 'Pharmaceuticals',
      'Food & Beverage', 'Automotive', 'Aerospace', 'Other'
    ])
    .withMessage('Invalid industry'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('contactInfo.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required')
];

// Query parameter validations
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .matches(/^[a-zA-Z_.-]+:(asc|desc)$/)
    .withMessage('Sort must be in format "field:asc" or "field:desc"')
];

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (req.query.startDate && value && new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// PTW Validations
export const validatePermitCreation = [
  body('types').isArray({ min: 1 }).withMessage('At least one permit type is required'),
  body('workDescription').notEmpty().withMessage('Work description is required'),
  body('location.area').notEmpty().withMessage('Area is required'),
  body('schedule.startDate').isISO8601().withMessage('Valid start date is required'),
  body('schedule.endDate').isISO8601().withMessage('Valid end date is required'),
  
];

export const validatePermitApproval = [
  body('comments').notEmpty().withMessage('Comments are required for approval decision')
];

// IMS Validations
export const validateIncidentCreation = [
  body('type').isIn(['injury', 'near_miss', 'property_damage', 'environmental', 'security'])
    .withMessage('Invalid incident type'),
  body('severity').isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('dateTime').isISO8601().withMessage('Valid date and time is required'),
  body('location.area').notEmpty().withMessage('Area is required'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('classification').optional().isIn(['first_aid', 'medical_treatment', 'lost_time', 'fatality'])
    .withMessage('Invalid classification')
];

export const validateInvestigationUpdate = [
  body('investigation.assignedTo').isMongoId().withMessage('Valid investigator ID is required'),
  body('investigation.findings').optional().isLength({ min: 10 })
    .withMessage('Findings must be at least 10 characters'),
  body('investigation.rootCause.immediate').optional().notEmpty()
    .withMessage('Immediate cause cannot be empty'),
  body('investigation.rootCause.underlying').optional().notEmpty()
    .withMessage('Underlying cause cannot be empty'),
  body('investigation.rootCause.rootCause').optional().notEmpty()
    .withMessage('Root cause cannot be empty')
];

// HAZOP Validations
export const validateHAZOPCreation = [
  body('title').notEmpty().withMessage('Study title is required'),
  body('methodology').isIn(['HAZOP', 'WHAT-IF', 'CHECKLIST', 'FMEA'])
    .withMessage('Invalid methodology'),
  body('plantId').isMongoId().withMessage('Valid plant ID is required'),
  body('process.name').notEmpty().withMessage('Process name is required')
];

export const validateNodeCreation = [
  body('nodeNumber').notEmpty().withMessage('Node number is required'),
  body('description').notEmpty().withMessage('Node description is required'),
  body('intention').notEmpty().withMessage('Node intention is required')
];

// HIRA Validations
export const validateHIRACreation = [
  body('title').notEmpty().withMessage('Assessment title is required'),
  body('process').notEmpty().withMessage('Process is required'),
  body('plantId').isMongoId().withMessage('Valid plant ID is required'),
  body('assessmentDate').isISO8601().withMessage('Valid assessment date is required')
];

export const validateHazardAssessment = [
  body('activities').isArray({ min: 1 }).withMessage('At least one activity is required'),
  body('activities.*.activity').notEmpty().withMessage('Activity description is required'),
  body('activities.*.hazards').isArray({ min: 1 }).withMessage('At least one hazard per activity is required'),
  body('activities.*.hazards.*.hazard').notEmpty().withMessage('Hazard description is required'),
  body('activities.*.hazards.*.category').isIn(['chemical', 'physical', 'biological', 'ergonomic', 'psychosocial'])
    .withMessage('Invalid hazard category'),
  body('activities.*.hazards.*.probability').isInt({ min: 1, max: 5 })
    .withMessage('Probability must be between 1 and 5'),
  body('activities.*.hazards.*.severity').isInt({ min: 1, max: 5 })
    .withMessage('Severity must be between 1 and 5'),
  body('activities.*.hazards.*.exposure').isInt({ min: 1, max: 5 })
    .withMessage('Exposure must be between 1 and 5')
];

// BBS Validations
export const validateBBSCreation = [
  body('observationDate').isISO8601().withMessage('Valid observation date is required'),
  body('location.area').notEmpty().withMessage('Area is required'),
  body('observationType').isIn(['unsafe_act', 'unsafe_condition', 'safe_behavior'])
    .withMessage('Invalid observation type'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('severity').isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('plantId').isMongoId().withMessage('Valid plant ID is required')
];

// Audit Validations
export const validateAuditCreation = [
  body('type').isIn(['internal', 'external', 'regulatory', 'management', 'process'])
    .withMessage('Invalid audit type'),
  body('standard').isIn(['ISO45001', 'ISO14001', 'OHSAS18001', 'custom'])
    .withMessage('Invalid standard'),
  body('title').notEmpty().withMessage('Audit title is required'),
  body('scope').isLength({ min: 10 }).withMessage('Scope must be at least 10 characters'),
  body('plantId').isMongoId().withMessage('Valid plant ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required')
];

export const validateChecklistUpdate = [
  body('checklist').isArray({ min: 1 }).withMessage('At least one checklist item is required'),
  body('checklist.*.category').notEmpty().withMessage('Category is required'),
  body('checklist.*.clause').notEmpty().withMessage('Clause is required'),
  body('checklist.*.requirement').notEmpty().withMessage('Requirement is required'),
  body('checklist.*.finding').isIn(['compliant', 'non_compliant', 'observation', 'opportunity'])
    .withMessage('Invalid finding type'),
  body('checklist.*.severity').optional().isIn(['minor', 'major', 'critical'])
    .withMessage('Invalid severity level')
];


// File upload validations
export const validateFileUpload = [
  body('files').optional().isArray().withMessage('Files must be an array'),
  body('files.*.name').optional().notEmpty().withMessage('File name is required'),
  body('files.*.type').optional().isIn(['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    .withMessage('Invalid file type'),
  body('files.*.size').optional().isInt({ max: 10485760 }).withMessage('File size must be less than 10MB')
];