import mongoose from 'mongoose';

const videoLibrarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  youtubeUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
      },
      message: 'Please enter a valid YouTube URL'
    }
  },
  duration: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['safety_procedures', 'ppe_training', 'risk_assessment', 'emergency_response', 'behavioral_safety', 'incident_investigation', 'general_safety']
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnailUrl: {
    type: String
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
  viewCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

videoLibrarySchema.index({ companyId: 1, plantId: 1, isActive: 1 });
videoLibrarySchema.index({ category: 1, tags: 1 });

export default mongoose.model('VideoLibrary', videoLibrarySchema);