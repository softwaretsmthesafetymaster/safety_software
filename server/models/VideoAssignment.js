import mongoose from 'mongoose';

const videoAssignmentSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoLibrary',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['assigned', 'watched', 'completed'],
    default: 'assigned'
  },
  watchProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  watchedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

videoAssignmentSchema.index({ userId: 1, companyId: 1, plantId: 1 });
videoAssignmentSchema.index({ videoId: 1, status: 1 });

export default mongoose.model('VideoAssignment', videoAssignmentSchema);