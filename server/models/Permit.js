import mongoose from 'mongoose';

const permitSchema = new mongoose.Schema({
  permitNumber: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  types: [{
    type: String,
    enum: ['hot_work', 'cold_work', 'electrical', 'confined_space', 'working_at_height', 'excavation']
  }],
  isHighRisk: { type: Boolean, default: false },
  workDescription: { type: String, required: true },
  location: { area: String, specificLocation: String },
  contractor: { name: String, contact: String, license: String },
  workers: [{ name: String, id: String, contact: String, medicalFitness: Boolean }],
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    shift: { type: String, enum: ['day', 'night', '24hour'] }
  },
  hazards: [{ type: { type: String, required: true }, mitigation: { type: String, required: true } }],
  ppe: [{ item: String, required: Boolean }],
  safetyChecklist: [{ item: String, checked: Boolean, remarks: String }],
  approvals: [{
    step: Number,
    role: String,
    label: String,
    required: { type: Boolean, default: true },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comments: String,
    timestamp: Date
  }],
  expiresAt: Date,
  status: {
    type: String,
    enum: [
      'draft','pending','pending-hod','submitted', 'in-progress', 'approved', 'active', 'expired',
      'closed', 'cancelled', 'stopped', 'pending_closure', 'extension-pending'
    ],
    default: 'draft'
  },
  documents: [{ name: String, url: String, type: String }],
  signatures: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String, signature: String, timestamp: Date }],
  closure: {
    closureReason: String,
    workCompleted: Boolean,
    safetyChecklistCompleted: Boolean,
    equipmentReturned: Boolean,
    areaCleared: Boolean,
    closureEvidence: String,
    closurePhotos: [String],
    closureComments: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  stopDetails: {
    stopReason: String,
    safetyIssue: String,
    immediateActions: String,
    stopComments: String,
    stoppedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stoppedAt: Date
  },
  activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activatedAt: Date,
  aiRecommendations: { hazards: [String], ppe: [String], checklist: [String], confidence: Number },
  closureFlow: [{
    step: Number,
    role: String,
    label: String,
    required: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date
  }],
  stopWorkRoles: [{ role: String, label: String }],
  extensions: [{ hours: Number, requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, comments: String, approvedAt: Date }],
}, { timestamps: true });

export default mongoose.model('Permit', permitSchema);
