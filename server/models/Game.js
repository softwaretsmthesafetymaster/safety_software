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
    enum: ['quiz', 'scenario', 'puzzle', 'find_hazard', 'matching'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  estimatedTime: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
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
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

gameSchema.index({ companyId: 1, plantId: 1, isActive: 1 });
gameSchema.index({ type: 1, difficulty: 1 });

export default mongoose.model('Game', gameSchema);