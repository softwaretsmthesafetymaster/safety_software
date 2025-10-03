import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
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
  score: {
    type: Number,
    required: true,
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizQuestion'
    },
    selectedOption: Number,
    isCorrect: Boolean,
    points: Number,
    timeSpent: Number
  }],
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

gameScoreSchema.index({ userId: 1, gameId: 1 });
gameScoreSchema.index({ companyId: 1, plantId: 1, score: -1 });

// Calculate percentage and passed status before saving
gameScoreSchema.pre('save', async function(next) {
  if (this.totalQuestions > 0) {
    this.percentage = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    
    // Get game passing score
    const game = await mongoose.model('Game').findById(this.gameId);
    if (game) {
      this.passed = this.percentage >= game.passingScore;
    }
  }
  next();
});

export default mongoose.model('GameScore', gameScoreSchema);