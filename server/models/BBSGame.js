import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'scenario', 'matching', 'puzzle'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  estimatedTime: {
    type: Number, // in minutes
    required: true
  },
  points: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'fill_blank', 'matching'],
      required: true
    },
    options: [{
      text: String,
      isCorrect: Boolean,
      points: Number
    }],
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [String]
  }],
  passingScore: {
    type: Number,
    default: 70 // percentage
  },
  attemptsAllowed: {
    type: Number,
    default: 3 // -1 for unlimited
  },
  categories: [{
    type: String,
    trim: true
  }],
  thumbnailUrl: String,
  instructions: String,
  isTimed: {
    type: Boolean,
    default: false
  },
  timeLimit: Number, // in seconds
  showFeedback: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: true
  },
  showScore: {
    type: Boolean,
    default: true
  },
  showLeaderboard: {
    type: Boolean,
    default: true
  },
  completionMessage: String
}, {
  timestamps: true
});

// Indexes for faster querying
gameSchema.index({ companyId: 1, isActive: 1 });
gameSchema.index({ type: 1, difficulty: 1 });
gameSchema.index({ categories: 1 });

const Game = mongoose.model('BBSGame', gameSchema);

export default Game;
