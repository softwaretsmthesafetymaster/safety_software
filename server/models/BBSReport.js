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
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    },
    completedDate: Date
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
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

export default mongoose.model('BBSReport', bbsReportSchema);