import mongoose from 'mongoose';

const gameScenarioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  situation: {
    type: String,
    required: true
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    outcome: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    isOptimal: {
      type: Boolean,
      default: false
    }
  }],
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

gameScenarioSchema.index({ gameId: 1, isActive: 1 });

export default mongoose.model('GameScenario', gameScenarioSchema);