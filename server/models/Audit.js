import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  auditNumber: {
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
  type: {
    type: String,
    enum: ['internal', 'external', 'regulatory', 'management', 'process'],
    required: true
  },
  standard: {
    type: String,
    enum: ['ISO45001', 'ISO14001', 'OHSAS18001', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  scope: {
    type: String,
    required: true
  },
  auditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  auditTeam: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],
  auditee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  actualDate: Date,
  areas: [{
    name: String,
    inCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  checklist: [{
    category: String,
    clause: String,
    requirement: String,
    evidence: String,
    finding: {
      type: String,
      enum: ['compliant', 'non_compliant', 'observation', 'opportunity']
    },
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical']
    },
    description: String,
    photos: [String],
    recommendations: String
  }],
  summary: {
    totalItems: Number,
    compliant: Number,
    nonCompliant: Number,
    observations: Number,
    opportunities: Number,
    compliancePercentage: Number
  },
  findings: [{
    type: {
      type: String,
      enum: ['non_compliance', 'observation', 'opportunity']
    },
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical']
    },
    clause: String,
    description: String,
    evidence: String,
    rootCause: String,
    recommendation: String,
    correctiveAction: {
      action: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dueDate: Date,
      status: {
        type: String,
        enum: ['open', 'in_progress', 'closed'],
        default: 'open'
      },
      completedDate: Date,
      verification: String
    }
  }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'closed'],
    default: 'planned'
  },
  aiSuggestions: {
    recommendations: [String],
    similarFindings: [String],
    riskAssessment: String,
    confidence: Number
  }
}, {
  timestamps: true
});

// Calculate compliance percentage before saving
auditSchema.pre('save', function(next) {
  if (this.checklist && this.checklist.length > 0) {
    const total = this.checklist.length;
    const compliant = this.checklist.filter(item => item.finding === 'compliant').length;
    const nonCompliant = this.checklist.filter(item => item.finding === 'non_compliant').length;
    const observations = this.checklist.filter(item => item.finding === 'observation').length;
    const opportunities = this.checklist.filter(item => item.finding === 'opportunity').length;
    
    this.summary = {
      totalItems: total,
      compliant,
      nonCompliant,
      observations,
      opportunities,
      compliancePercentage: total > 0 ? Math.round((compliant / total) * 100) : 0
    };
  }
  next();
});

export default mongoose.model('Audit', auditSchema);