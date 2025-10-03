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
    required: true
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant.areas'
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
  affectedPersons: {
    type: [
      {
        name: String,
        role: String,
        injuryDetails: String,
        bodyPart: String,
        medicalAttention: Boolean
      }
    ],
    default: []
  },
  witnesses: {
    type: [
      {
        name: String,
        contact: String,
        statement: String
      }
    ],
    default: []
  },
  bodyPart: {
    type: [String],
    default: []
  },
  bodyMap: {
    injuries: {
      type: [
        {
          bodyPart: String,
          injuryType: String,
          severity: String,
          coordinates: {
            x: Number,
            y: Number
          }
        }
      ],
      default: []
    }
  },
  investigation: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    timeLimit: {
      type: Number,
      default: 72
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    assignmentComments: String,
    assignedAt: Date,
    findings: String,
    rootCause: {
      immediate: String,
      underlying: String,
      rootCause: String
    },
    fiveWhys: {
      type: [
        {
          question: String,
          answer: String
        }
      ],
      default: []
    },
    fishbone: {
      people: { type: [String], default: [] },
      process: { type: [String], default: [] },
      environment: { type: [String], default: [] },
      equipment: { type: [String], default: [] },
      materials: { type: [String], default: [] },
      methods: { type: [String], default: [] }
    }
  },
  correctiveActions: {
    type: [
      {
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
      }
    ],
    default: []
  },
  status: {
    type: String,
    enum: ['open', 'investigating','rca_submitted' ,'actions_assigned','pending_closure', 'closed', 'reassigned'],
    default: 'open'
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedAt: Date,
  closureComments: String,
  reassignReason: String,
  attachments: {
    type: [
      {
        name: String,
        url: String,
        type: String
      }
    ],
    default: []
  },
  aiAnalysis: {
    category: String,
    riskLevel: String,
    recommendations: {
      type: [String],
      default: []
    },
    similarIncidents: {
      type: [String],
      default: []
    },
    confidence: Number
  }
}, {
  timestamps: true
});

export default mongoose.model('Incident', incidentSchema);
