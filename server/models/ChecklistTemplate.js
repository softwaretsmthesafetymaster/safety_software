import mongoose from 'mongoose';

const checklistTemplateSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  standard: {
    type: String,
    enum: ['BIS14489', 'FireSafety', 'ElectricalSafety', 'ISO45001', 'PSM', 'AISafety', 'custom'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  categories: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    questions: [{
      id: {
        type: String,
        // required: true
      },
      question: {
        type: String,
        required: true
      },
      clause: String,
      element: String,
      legalStandard: String,
      isRequired: {
        type: Boolean,
        default: true
      },
      answerType: {
        type: String,
        enum: ['yes_no_na', 'text', 'number'],
        default: 'yes_no_na'
      },
      guidance: String,
      evidenceRequired: {
        type: Boolean,
        default: false
      }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedFile: {
    filename: String,
    originalName: String,
    path: String,
    uploadDate: Date
  }
}, {
  timestamps: true
});

checklistTemplateSchema.index({ companyId: 1, standard: 1, isActive: 1 });
// checklistTemplateSchema.index({ code: 1 });

export default mongoose.model('ChecklistTemplate', checklistTemplateSchema);