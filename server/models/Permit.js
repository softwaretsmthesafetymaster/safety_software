import mongoose from 'mongoose';

const permitSchema = new mongoose.Schema({
  permitNumber: {
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
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  types: [{
    type: String,
    enum: ['hot_work', 'cold_work', 'electrical', 'confined_space', 'working_at_height', 'excavation']
  }],
  workDescription: {
    type: String,
    required: true
  },
  location: {
    area: String,
    specificLocation: String
  },
  contractor: {
    name: String,
    contact: String,
    license: String
  },
  workers: [{
    name: String,
    id: String,
    contact: String,
    medicalFitness: Boolean
  }],
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    shift: {
      type: String,
      enum: ['day', 'night', '24hour']
    }
  },
  hazards: [{
    type: {
      type: String,
      required: true
    },
    mitigation: {
      type: String,
      required: true
    }
  }],
  ppe: [{
    item: String,
    required: Boolean
  }],
  safetyChecklist: [{
    item: String,
    checked: Boolean,
    remarks: String
  }],
  approvals: [{
    step: Number,
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String,
    timestamp: Date
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'active', 'expired', 'closed', 'cancelled'],
    default: 'draft'
  },
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  signatures: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    signature: String,
    timestamp: Date
  }],
  aiRecommendations: {
    hazards: [String],
    ppe: [String],
    checklist: [String],
    confidence: Number
  }
}, {
  timestamps: true
});

export default mongoose.model('Permit', permitSchema);