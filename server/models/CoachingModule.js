import mongoose from 'mongoose';

const coachingModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
      },
      message: 'Please enter a valid YouTube URL'
    }
  },
  duration: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  topics: [{
    type: String,
    trim: true
  }],
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
  }
}, {
  timestamps: true
});

coachingModuleSchema.index({ companyId: 1, isActive: 1 });
coachingModuleSchema.index({ difficulty: 1, topics: 1 });

export default mongoose.model('CoachingModule', coachingModuleSchema);