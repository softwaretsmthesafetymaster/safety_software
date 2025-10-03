import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BBSCoachingModule',
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BBSGame',
    required: true
  },
  attempts: [{
    attempt: Number,
    score: Number,
    passed: Boolean,
    takenAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalAttempts: {
    type: Number,
    default: 0
  },
  lastScore: {
    type: Number,
    default: 0
  },
  bestScore: {
    type: Number,
    default: 0
  },
  lastAttempted: {
    type: Date,
    default: Date.now
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
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  quizScores: [{
    score: Number,
    totalQuestions: Number,
    passed: Boolean,
    takenAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Ensure one progress document per user per module
userProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

// Index for faster querying
userProgressSchema.index({ companyId: 1, userId: 1, completed: 1 });

const UserProgress = mongoose.model('BBSUserProgress', userProgressSchema);

export default UserProgress;
