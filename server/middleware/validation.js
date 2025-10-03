import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Error in validation",errors)
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Common validations
export const validateObjectId = (field) => [
  param(field).isMongoId().withMessage(`Invalid ${field} format`)
];

export const validateCompanyId = [
  param('companyId').isMongoId().withMessage('Invalid company ID format')
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

// Plant Validations
export const validatePlantCreation = [
  body('name').notEmpty().withMessage('Plant name is required'),
  body('code').notEmpty().withMessage('Plant code is required'),
];

export const validateAreaCreation = [
  body('name').notEmpty().withMessage('Area name is required'),
  body('code').notEmpty().withMessage('Area code is required'),
 
];

// User Validations
export const validateUserCreation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['platform_owner', 'company_owner', 'plant_head', 'safety_incharge', 'hod', 'contractor', 'worker','user','admin'])
    .withMessage('Invalid role'),
  // body('plantId').optional().isMongoId().withMessage('Valid plant ID is required')
];

export const validateUserUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['platform_owner', 'company_owner', 'plant_head', 'safety_incharge', 'hod', 'contractor', 'worker','user','admin'])
    .withMessage('Invalid role'),
  // body('plantId').optional().isMongoId().withMessage('Valid plant ID is required')
];

// Company Validations
export const validateCompanyCreation = [
  body('name').notEmpty().withMessage('Company name is required'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid email is required'),
  body('contactInfo.phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

export const validateCompanyUpdate = [
  body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('industry').optional().notEmpty().withMessage('Industry cannot be empty'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid email is required'),
  body('contactInfo.phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

// Query parameter validations
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required')
];

// File upload validations
export const validateFileUpload = [
  body('files').optional().isArray().withMessage('Files must be an array'),
  body('files.*.name').optional().notEmpty().withMessage('File name is required'),
  body('files.*.type').optional().isIn(['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    .withMessage('Invalid file type'),
  body('files.*.size').optional().isInt({ max: 10485760 }).withMessage('File size must be less than 10MB')
];