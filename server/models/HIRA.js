import mongoose from 'mongoose';

const worksheetRowSchema = new mongoose.Schema({
  taskName: { type: String, required: true },
  activityService: { type: String, required: true },
  routineNonRoutine: { 
    type: String, 
    enum: ['Routine', 'Non-Routine'], 
    required: true 
  },
  hazardConcern: { type: String, required: true },
  hazardDescription: { type: String, required: true },
  likelihood: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  consequence: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  riskScore: { type: Number },
  existingRiskControl: { type: String, required: true },
  significantNotSignificant: { 
    type: String, 
    enum: ['Significant', 'Not Significant'], 
    required: true 
  },
  riskCategory: { 
    type: String, 
    enum: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'], 
    required: true 
  },
  recommendation: { type: String, required: true },
  actionOwner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' ,
    default: null
  },
  targetDate: { type: Date },
  actionStatus: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Completed'], 
    default: 'Open' 
  },
  completedDate: { type: Date },
  remarks: { type: String }
});

const hiraSchema = new mongoose.Schema({
  assessmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  title: { type: String, required: true },
  process: { type: String, required: true },
  description: { type: String },
  
  // Assessment team
  assessor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Dates
  assessmentDate: { type: Date, required: true },
  reviewDate: { type: Date },
  
  // Worksheet data
  worksheetRows: [worksheetRowSchema],
  
  // Workflow status
  status: { 
    type: String, 
    enum: ['draft', 'assigned', 'in_progress', 'completed', 'approved', 'rejected', 'closed'],
    default: 'draft' 
  },
  
  // Approval workflow
  approvals: [{
    role: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    comments: String,
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    }
  }],
  
  // Timestamps for workflow
  assignedAt: Date,
  startedAt: Date,
  completedAt: Date,
  approvedAt: Date,
  closedAt: Date,
  
  // Approval details
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalComments: String,
  rejectionReason: String,
  
  // AI suggestions
  aiSuggestions: {
    hazards: [String],
    controls: [String],
    recommendations: [String],
    confidence: Number,
    generatedAt: Date
  },
  
  // Risk summary
  riskSummary: {
    totalTasks: { type: Number, default: 0 },
    highRiskCount: { type: Number, default: 0 },
    moderateRiskCount: { type: Number, default: 0 },
    lowRiskCount: { type: Number, default: 0 },
    significantRisks: { type: Number, default: 0 },
    totalRecommendations: { type: Number, default: 0 }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate risk score and category
hiraSchema.pre('save', function(next) {
  this.worksheetRows.forEach(row => {
    row.riskScore = row.likelihood * row.consequence;
    
    // Determine risk category based on score
    if (row.riskScore <= 4) {
      row.riskCategory = 'Very Low';
    } else if (row.riskScore <= 8) {
      row.riskCategory = 'Low';
    } else if (row.riskScore <= 12) {
      row.riskCategory = 'Moderate';
    } else if (row.riskScore <= 20) {
      row.riskCategory = 'High';
    } else {
      row.riskCategory = 'Very High';
    }
  });
  
  // Update risk summary
  this.riskSummary.totalTasks = this.worksheetRows.length;
  this.riskSummary.highRiskCount = this.worksheetRows.filter(row => 
    ['High', 'Very High'].includes(row.riskCategory)
  ).length;
  this.riskSummary.moderateRiskCount = this.worksheetRows.filter(row => 
    row.riskCategory === 'Moderate'
  ).length;
  this.riskSummary.lowRiskCount = this.worksheetRows.filter(row => 
    ['Low', 'Very Low'].includes(row.riskCategory)
  ).length;
  this.riskSummary.significantRisks = this.worksheetRows.filter(row => 
    row.significantNotSignificant === 'Significant'
  ).length;
  this.riskSummary.totalRecommendations = this.worksheetRows.filter(row => 
    row.recommendation && row.recommendation.trim() !== ''
  ).length;
  
  next();
});

export default mongoose.model('HIRA', hiraSchema);