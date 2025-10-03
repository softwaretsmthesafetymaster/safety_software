import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['module_completion', 'quiz_mastery', 'perfect_score', 'streak', 'participation', 'milestone']
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  icon: {
    type: String,
    default: 'trophy'
  },
  points: {
    type: Number,
    default: 0
  },
  metadata: {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BBSCoachingModule'
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BBSGame'
    },
    score: Number,
    streakDays: Number,
    milestone: String
  },
  achievedAt: {
    type: Date,
    default: Date.now
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster querying
achievementSchema.index({ userId: 1, type: 1 });
achievementSchema.index({ companyId: 1, 'metadata.moduleId': 1 });
achievementSchema.index({ companyId: 1, 'metadata.gameId': 1 });

const Achievement = mongoose.model('BBSAchievement', achievementSchema);

export default Achievement;
