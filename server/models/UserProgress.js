import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoachingModule',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

userProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });
userProgressSchema.index({ companyId: 1, completed: 1 });

export default mongoose.model('UserProgress', userProgressSchema);