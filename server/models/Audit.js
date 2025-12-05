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
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistTemplate',
    required: true
  },
  type: {
    type: String,
    enum: ['internal', 'external', 'regulatory', 'management', 'process'],
    default: 'internal'
  },
  standard: {
    type: String,
    enum: ['BIS14489', 'FireSafety', 'ElectricalSafety', 'ISO45001', 'PSM', 'AISafety', 'custom'],
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
    categoryId: String,
    categoryName: String,
    questionId: String,
    question: String,
    clause: String,
    element: String,
    legalStandard: String,
    answer: {
      type: String,
      enum: ['yes', 'no', 'na']
    },
    remarks: String,
    evidence: String,
    photos: [String],
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date
  }],
  summary: {
    totalQuestions: Number,
    answered: Number,
    yesAnswers: Number,
    noAnswers: Number,
    naAnswers: Number,
    compliancePercentage: Number
  },
  observations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Observation'
  }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'checklist_completed', 'observations_pending', 'completed', 'closed'],
    default: 'planned'
  },
  checklistCompletedAt: Date,
  observationsCompletedAt: Date,
  completedAt: Date,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedAt: Date,
  closureComments: String
}, {
  timestamps: true
});

// Auto-update status based on checklist and observations completion
auditSchema.pre('save', function(next) {
  // Calculate checklist summary
  if (this.checklist && this.checklist.length > 0) {
    const total = this.checklist.length;
    const answered = this.checklist.filter(item => item.answer).length;
    const yesAnswers = this.checklist.filter(item => item.answer === 'yes').length;
    const noAnswers = this.checklist.filter(item => item.answer === 'no').length;
    const naAnswers = this.checklist.filter(item => item.answer === 'na').length;
    
    this.summary = {
      totalQuestions: total,
      answered,
      yesAnswers,
      noAnswers,
      naAnswers,
      compliancePercentage: total > 0 ? Math.round(((yesAnswers + naAnswers) / total) * 100) : 0
    };

    // Update status based on checklist completion
    if (answered === total && this.status === 'in_progress') {
      this.status = 'checklist_completed';
      this.checklistCompletedAt = new Date();
    }
  }

  next();
});

export default mongoose.model('Audit', auditSchema);