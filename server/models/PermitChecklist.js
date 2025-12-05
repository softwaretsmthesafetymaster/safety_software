import mongoose from 'mongoose';

const checklistSchema = new mongoose.Schema({
  permitType: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'electrical', 'lifting', 'workAtHeight', 'confinedSpace',
      'fire', 'environmental', 'hotWork', 'coldWork',
      'excavation', 'demolition', 'chemical', 'radiation'
    ]
  },
  riskAssociated: {
    type: [String],
    default: []
  },
  precautions: {
    type: [String],
    default: []
  },
  ppeRequired: {
    type: [String],
    default: []
  },
  inspectionChecklist: {
    type: [String],
    default: []
  },
  rescueTechniques: {
    type: [String],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Checklist', checklistSchema);
