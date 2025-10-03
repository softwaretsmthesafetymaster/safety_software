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
    default: ''
  },
  duration: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
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
  },
  assignments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed'],
      default: 'assigned'
    }
  }]
}, {
  timestamps: true
});

// Index for faster querying
coachingModuleSchema.index({ companyId: 1, isActive: 1 });
coachingModuleSchema.index({ 'assignments.userId': 1 });

const CoachingModule = mongoose.model('BBSCoachingModule', coachingModuleSchema);

export default CoachingModule;
