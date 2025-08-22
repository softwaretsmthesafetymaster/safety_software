import mongoose from 'mongoose';

const hazopSchema = new mongoose.Schema({
  studyNumber: {
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
  description: String,
  methodology: {
    type: String,
    enum: ['HAZOP', 'WHAT-IF', 'CHECKLIST', 'FMEA'],
    default: 'HAZOP'
  },
  facilitator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    expertise: String
  }],
  studyBoundary: {
    startPoint: String,
    endPoint: String,
    inclusions: [String],
    exclusions: [String]
  },
  process: {
    name: String,
    description: String,
    operatingConditions: {
      temperature: { min: Number, max: Number, unit: String },
      pressure: { min: Number, max: Number, unit: String },
      flowRate: { min: Number, max: Number, unit: String }
    },
    drawings: [{
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['PFD', 'PID', 'LAYOUT', 'ISOMETRIC', 'OTHER']
      }
    }]
  },
  nodes: [{
    nodeNumber: String,
    description: String,
    intention: String,
    equipment: [String],
    operatingConditions: String,
    worksheets: [{
      parameter: String,
      guideWord: String,
      deviation: String,
      causes: [String],
      consequences: [String],
      safeguards: [String],
      likelihood: {
        type: String,
        enum: ['rare', 'unlikely', 'possible', 'likely', 'almost_certain']
      },
      severity: {
        type: String,
        enum: ['negligible', 'minor', 'moderate', 'major', 'catastrophic']
      },
      risk: {
        type: String,
        enum: ['very_low', 'low', 'medium', 'high', 'very_high']
      },
      riskScore: Number,
      recommendations: [{
        action: String,
        type: {
          type: String,
          enum: ['immediate', 'short_term', 'long_term']
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical']
        },
        responsibility: String,
        targetDate: Date,
        status: {
          type: String,
          enum: ['open', 'in_progress', 'closed'],
          default: 'open'
        },
        completedDate: Date,
        evidence: String
      }]
    }]
  }],
  sessions: [{
    date: Date,
    duration: Number,
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    nodesReviewed: [String],
    notes: String,
    nextSession: Date
  }],
  riskMatrix: {
    likelihood: [String],
    severity: [String],
    riskLevels: [[String]]
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'closed'],
    default: 'planned'
  },
  completionDate: Date,
  reportGenerated: {
    type: Boolean,
    default: false
  },
  aiSuggestions: {
    deviations: [String],
    causes: [String],
    consequences: [String],
    safeguards: [String],
    confidence: Number
  }
}, {
  timestamps: true
});

// Calculate risk score before saving
hazopSchema.pre('save', function(next) {
  this.nodes.forEach(node => {
    node.worksheets.forEach(worksheet => {
      if (worksheet.likelihood && worksheet.severity) {
        const likelihoodScore = ['rare', 'unlikely', 'possible', 'likely', 'almost_certain'].indexOf(worksheet.likelihood) + 1;
        const severityScore = ['negligible', 'minor', 'moderate', 'major', 'catastrophic'].indexOf(worksheet.severity) + 1;
        worksheet.riskScore = likelihoodScore * severityScore;
        
        if (worksheet.riskScore <= 4) worksheet.risk = 'very_low';
        else if (worksheet.riskScore <= 8) worksheet.risk = 'low';
        else if (worksheet.riskScore <= 15) worksheet.risk = 'medium';
        else if (worksheet.riskScore <= 20) worksheet.risk = 'high';
        else worksheet.risk = 'very_high';
      }
    });
  });
  next();
});

export default mongoose.model('HAZOP', hazopSchema);