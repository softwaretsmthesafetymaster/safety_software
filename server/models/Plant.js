import mongoose from 'mongoose';

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 20
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  location: {
    address: { type: String, maxlength: 200 },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  capacity: {
    maxEmployees: { type: Number, min: 1 },
    operationalArea: Number, // in square meters
    productionCapacity: Number
  },
  contact: {
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String, maxlength: 20 },
    email: { 
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    }
  },
  operatingHours: {
    start: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    end: { type: String, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    timezone: { type: String, default: 'UTC' }
  },
  certifications: [{
    name: { type: String, required: true },
    number: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    status: { type: String, enum: ['active', 'expired', 'pending'], default: 'active' }
  }],
  emergencyContacts: [{
    name: { type: String, required: true },
    role: String,
    phone: { type: String, required: true },
    email: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
plantSchema.index({ companyId: 1, isActive: 1 });
// plantSchema.index({ code: 1 });
plantSchema.index({ name: 1 });

// Pre-save middleware
plantSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

export default mongoose.model('Plant', plantSchema);