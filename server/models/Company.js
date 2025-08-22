import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String
  },
  industry: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled'],
      default: 'active'
    },
    expiryDate: Date,
    paymentId: String,
    orderId: String
  },
  config: {
    modules: {
      ptw: {
        enabled: { type: Boolean, default: true },
        flows: {
          issue: { roles: [String], autoAssign: Boolean },
          approval: { 
            steps: [{
              step: Number,
              role: String,
              required: Boolean,
              parallel: Boolean
            }],
            autoApprove: Boolean
          },
          closure: {
            roles: [String],
            requireEvidence: Boolean,
            autoClose: Boolean
          },
          stop: { roles: [String], requireReason: Boolean },
          expiry: { 
            reminderDays: [Number],
            autoExpire: Boolean,
            extensionRoles: [String]
          }
        },
        checklists: [{
          category: String,
          items: [String]
        }]
      },
      ims: {
        enabled: { type: Boolean, default: true },
        flows: {
          report: { roles: [String], autoAssign: Boolean },
          review: { 
            roles: [String],
            autoAssignInvestigation: Boolean,
            escalationHours: Number
          },
          investigation: {
            roles: [String],
            requireRCA: Boolean,
            rcaMethods: [String],
            timeLimit: Number
          },
          actions: {
            assignmentRoles: [String],
            approvalRoles: [String],
            autoClose: Boolean
          },
          closure: {
            roles: [String],
            requireApproval: Boolean
          }
        },
        severityLevels: [{
          level: String,
          color: String,
          escalation: String
        }],
        workflows: {
          investigation: [{
            step: Number,
            role: String,
            timeLimit: Number
          }]
        }
      },
      hazop: {
        enabled: { type: Boolean, default: true },
        flows: {
          creation: { 
            roles: [String],
            requireDrawing: Boolean,
            teamRoles: {
              chairman: [String],
              scribe: [String],
              members: [String]
            }
          },
          nodes: {
            creationRoles: [String],
            approvalRoles: [String]
          },
          worksheets: {
            parameters: [String],
            guideWords: [String],
            riskMatrix: {
              severity: { min: Number, max: Number },
              likelihood: { min: Number, max: Number },
              colors: {
                low: String,
                medium: String,
                high: String,
                veryHigh: String
              }
            }
          },
          closure: {
            roles: [String],
            requireAllNodesComplete: Boolean
          }
        },
        templates: [{
          name: String,
          guideWords: [String],
          parameters: [String]
        }]
      },
      hira: {
        enabled: { type: Boolean, default: true },
        flows: {
          creation: { roles: [String], teamRequired: Boolean },
          worksheet: {
            riskScoring: {
              probability: { min: Number, max: Number },
              severity: { min: Number, max: Number },
              exposure: { min: Number, max: Number }
            },
            acceptabilityLevels: {
              acceptable: Number,
              tolerable: Number,
              unacceptable: Number
            }
          },
          closure: { roles: [String], requireApproval: Boolean }
        },
        riskMatrix: {
          probability: [String],
          severity: [String],
          exposure: [String]
        }
      },
      bbs: {
        enabled: { type: Boolean, default: true },
        flows: {
          observation: { roles: [String], requirePhotos: Boolean },
          review: { 
            roles: [String],
            autoAssign: Boolean,
            escalationHours: Number
          },
          closure: {
            roles: [String],
            requireEvidence: Boolean,
            approvalRoles: [String]
          }
        },
        categories: {
          unsafeActs: [String],
          unsafeConditions: [String]
        }
      },
      audit: {
        enabled: { type: Boolean, default: true },
        flows: {
          creation: { 
            roles: [String],
            teamRequired: Boolean,
            standardTemplates: [String]
          },
          checklist: {
            completionRoles: [String],
            requireEvidence: Boolean
          },
          observations: {
            creationRoles: [String],
            riskScoring: {
              elements: [String],
              standards: [String]
            },
            aiSuggestions: Boolean
          },
          closure: {
            assignmentRoles: [String],
            approvalRoles: [String],
            requireEvidence: Boolean
          }
        },
        templates: [{
          name: String,
          categories: [{
            name: String,
            checklist: [String]
          }]
        }]
      }
    },
    numbering: {
      ptw: {
        prefix: { type: String, default: 'PTW' },
        format: { type: String, default: 'YYMMXXX' },
        startNumber: { type: Number, default: 1 }
      },
      ims: {
        prefix: { type: String, default: 'INC' },
        format: { type: String, default: 'YYMMDDXX' },
        startNumber: { type: Number, default: 1 }
      },
      hazop: {
        prefix: { type: String, default: 'HAZ' },
        format: { type: String, default: 'YYMMXXX' },
        startNumber: { type: Number, default: 1 }
      },
      hira: {
        prefix: { type: String, default: 'HIRA' },
        format: { type: String, default: 'YYMMXXX' },
        startNumber: { type: Number, default: 1 }
      },
      bbs: {
        prefix: { type: String, default: 'BBS' },
        format: { type: String, default: 'YYMMDDXX' },
        startNumber: { type: Number, default: 1 }
      },
      audit: {
        prefix: { type: String, default: 'AUD' },
        format: { type: String, default: 'YYMMXXX' },
        startNumber: { type: Number, default: 1 }
      }
    },
    sla: {
      ptw: {
        approvalTime: { type: Number, default: 24 }, // hours
        reminderBefore: { type: Number, default: 2 }, // hours
        expiryReminder: { type: Number, default: 24 } // hours before expiry
      },
      ims: {
        investigationTime: { type: Number, default: 72 }, // hours
        actionTime: { type: Number, default: 168 }, // hours (1 week)
        closureTime: { type: Number, default: 720 } // hours (30 days)
      },
      hazop: {
        sessionReminder: { type: Number, default: 24 }, // hours before session
        completionTime: { type: Number, default: 2160 } // hours (90 days)
      },
      hira: {
        reviewTime: { type: Number, default: 168 }, // hours (1 week)
        approvalTime: { type: Number, default: 72 } // hours
      },
      bbs: {
        reviewTime: { type: Number, default: 24 }, // hours
        closureTime: { type: Number, default: 168 } // hours (1 week)
      },
      audit: {
        preparationTime: { type: Number, default: 168 }, // hours (1 week)
        completionTime: { type: Number, default: 720 }, // hours (30 days)
        actionTime: { type: Number, default: 2160 } // hours (90 days)
      }
    },
    theme: {
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#64748b' },
      logo: String,
      companyName: String,
      brandColors: {
        success: { type: String, default: '#10b981' },
        warning: { type: String, default: '#f59e0b' },
        danger: { type: String, default: '#ef4444' },
        info: { type: String, default: '#3b82f6' }
      }
    },
    roles: [{
      name: String,
      permissions: [String]
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);