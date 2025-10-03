import mongoose from 'mongoose';

const observationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  auditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audit',
    required: true
  },
  observationNumber: {
    type: String,
    required: true,
    unique: true
  },
  observation: {
    type: String,
    required: true
  },
  element: String,
  legalStandard: String,
  recommendation: String,
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    required: true
  },
  riskScore: {
    type: Number,
    min: 1,
    max: 20,
    required: true
  },
  category: {
    type: String,
    enum: ['non_compliance', 'observation', 'opportunity']
  },
  severity: {
    type: String,
    enum: ['minor', 'major', 'critical']
  },
  responsiblePerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetDate: Date,
  actionTaken: String,
  completionEvidence: String,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'open'
  },
  rejectionReason: String,
  photos: [String],
  aiSuggestions: {
    element: String,
    legalStandard: String,
    recommendation: String,
    riskAssessment: String,
    confidence: Number
  }
}, {
  timestamps: true
});

export default mongoose.model('Observation', observationSchema);