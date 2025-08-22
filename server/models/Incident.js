import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  incidentNumber: {
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
    // required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['injury', 'near_miss', 'property_damage', 'environmental', 'security'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  classification: {
    type: String,
    enum: ['first_aid', 'medical_treatment', 'lost_time', 'fatality'],
    required: function() {
      return this.type === 'injury';
    }
  },
  dateTime: {
    type: Date,
    required: true
  },
  location: {
    area: String,
    specificLocation: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: {
    type: String,
    required: true
  },
  immediateActions: {
    type: String
  },
  affectedPersons: [{
    name: String,
    role: String,
    injuryDetails: String,
    bodyPart: String,
    medicalAttention: Boolean
  }],
  witnesses: [{
    name: String,
    contact: String,
    statement: String
  }],
  investigation: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    findings: String,
    rootCause: {
      immediate: String,
      underlying: String,
      rootCause: String
    },
    fiveWhys: [{
      question: String,
      answer: String
    }],
    fishbone: {
      people: [String],
      process: [String],
      environment: [String],
      equipment: [String],
      materials: [String],
      methods: [String]
    }
  },
  correctiveActions: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    },
    completedDate: Date,
    evidence: String
  }],
  status: {
    type: String,
    enum: ['open', 'investigating', 'pending_closure', 'closed'],
    default: 'open'
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  aiAnalysis: {
    category: String,
    riskLevel: String,
    recommendations: [String],
    similarIncidents: [String],
    confidence: Number
  }
}, {
  timestamps: true
});

export default mongoose.model('Incident', incidentSchema);