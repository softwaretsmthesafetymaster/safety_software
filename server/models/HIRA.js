import mongoose from 'mongoose';

const hiraSchema = new mongoose.Schema({
  assessmentNumber: {
    type: String,
    required: true,
    unique: true
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
  title: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  process: {
    type: String,
    required: true
  },
  assessor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assessmentDate: {
    type: Date,
    required: true
  },
  reviewDate: Date,
  activities: [{
    activity: {
      type: String,
      required: true
    },
    hazards: [{
      hazard: String,
      category: {
        type: String,
        enum: ['chemical', 'physical', 'biological', 'ergonomic', 'psychosocial']
      },
      source: String,
      potentialConsequences: [String],
      existingControls: [String],
      probability: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      severity: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      exposure: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      riskScore: {
        type: Number,
        required: true
      },
      riskLevel: {
        type: String,
        enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
        required: true
      },
      acceptability: {
        type: String,
        enum: ['acceptable', 'tolerable', 'unacceptable'],
        required: true
      },
      additionalControls: [{
        control: String,
        type: {
          type: String,
          enum: ['elimination', 'substitution', 'engineering', 'administrative', 'ppe']
        },
        responsibility: String,
        targetDate: Date,
        status: {
          type: String,
          enum: ['planned', 'in_progress', 'completed'],
          default: 'planned'
        }
      }],
      residualRisk: {
        probability: Number,
        severity: Number,
        exposure: Number,
        score: Number,
        level: String
      }
    }]
  }],
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'approved'],
    default: 'draft'
  },
  aiRecommendations: {
    hazards: [String],
    controls: [String],
    riskReductions: [String],
    confidence: Number
  }
}, {
  timestamps: true
});

// Calculate risk score before saving
hiraSchema.pre('save', function(next) {
  this.activities.forEach(activity => {
    activity.hazards.forEach(hazard => {
      hazard.riskScore = hazard.probability * hazard.severity * hazard.exposure;
      
      if (hazard.riskScore <= 30) hazard.riskLevel = 'very_low';
      else if (hazard.riskScore <= 60) hazard.riskLevel = 'low';
      else if (hazard.riskScore <= 90) hazard.riskLevel = 'moderate';
      else if (hazard.riskScore <= 120) hazard.riskLevel = 'high';
      else hazard.riskLevel = 'very_high';
      
      if (hazard.riskLevel === 'very_low' || hazard.riskLevel === 'low') {
        hazard.acceptability = 'acceptable';
      } else if (hazard.riskLevel === 'moderate') {
        hazard.acceptability = 'tolerable';
      } else {
        hazard.acceptability = 'unacceptable';
      }
    });
  });
  next();
});

export default mongoose.model('HIRA', hiraSchema);