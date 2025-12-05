import mongoose from 'mongoose';

const bbsReportSchema = new mongoose.Schema({
  reportNumber: {
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
  observer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  observationDate: {
    type: Date,
    required: true
  },
  location: {
    area: String,
    specificLocation: String
  },
  observedPersons: [{
    name: String,
    designation: String,
    department: String
  }],
  observationType: {
    type: String,
    enum: ['unsafe_act', 'unsafe_condition', 'safe_behavior'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  immediateAction: {
    type: String
  },
  rootCause: {
    type: String
  },
  correctiveActions: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'pending_closure', 'completed'],
      default: 'pending'
    },
    lessonsLearned: String,
    completedDate: Date,
    completionComments: String,
    completionEvidence: String,
    evidencePhotos: [String],
    effectivenessRating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  feedback: {
    given: Boolean,
    method: {
      type: String,
      enum: ['verbal', 'written', 'demonstration']
    },
    response: String
  },
  photos: [{
    url: String,
    description: String
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: Date,
  reviewComments: String,
  reviewDecision: {
    type: String,
    enum: ['approve', 'reassign']
  },
  reassignReason: String,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  lessonsLearned: String,
  status: {
    type: String,
    enum: ['open', 'approved', 'pending_closure', 'closed', 'reassigned'],
    default: 'open'
  }
}, {
  timestamps: true
});

export default mongoose.model('BBSReport', bbsReportSchema);