import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  logo: { type: String },
  industry: { 
    type: String, 
    required: true,
    enum: [
      'Manufacturing', 'Oil & Gas', 'Chemical', 'Construction', 
      'Mining', 'Power Generation', 'Pharmaceuticals', 
      'Food & Beverage', 'Automotive', 'Aerospace', 'Other'
    ]
  },
  address: {
    street: { type: String, maxlength: 200 },
    city: { type: String, maxlength: 100 },
    state: { type: String, maxlength: 100 },
    country: { type: String, maxlength: 100 },
    zipCode: { type: String, maxlength: 20 }
  },
  contactInfo: {
    phone: { type: String, maxlength: 20 },
    email: { 
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    website: { type: String, maxlength: 200 }
  },
  subscription: {
    plan: { 
      type: String, 
      enum: ['basic', 'professional', 'enterprise'], 
      default: 'basic' 
    },
    status: { 
      type: String, 
      enum: ['inactive', 'active', 'suspended', 'cancelled'], 
      default: 'inactive' 
    },
    expiryDate: Date,
    paymentId: String,
    orderId: String
  },
  limits: {
    maxUsers: { type: Number, default: 10, min: 1 },
    maxPlants: { type: Number, default: 2, min: 1 },
    maxStorageMB: { type: Number, default: 500, min: 100 }
  },
  config: {
    modules: { type: mongoose.Schema.Types.Mixed, default: {} },
    roles: { type: [String], default: [] },
    branding: {
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#6366f1' },
      logo: String,
      companyName: String
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    security: {
      sessionTimeout: { type: Number, default: 30 }, // minutes
      passwordExpiry: { type: Number, default: 90 }, // days
      maxLoginAttempts: { type: Number, default: 5 }
    }
  },
  trial: {
    enabled: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    endsAt: { 
      type: Date, 
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indexes for performance
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ 'subscription.status': 1 });
companySchema.index({ isActive: 1 });

// Pre-save middleware
companySchema.pre('save', function(next) {
  if (this.isNew && !this.config.branding.companyName) {
    this.config.branding.companyName = this.name;
  }
  next();
});

export default mongoose.model('Company', companySchema);