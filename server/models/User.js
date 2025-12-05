import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    
  },
  role: {
    type: String,
    required: true,
    enum: [
      'platform_owner', 'company_owner', 'plant_head', 
      'safety_incharge', 'hod', 'contractor', 'worker', 
      'user', 'admin', 'auditor', 'observer'
    ]
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function() {
      return this.role !== 'platform_owner';
    }
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant'
  },
  profile: {
    phone: { type: String, maxlength: 20 },
    employeeId: { type: String, maxlength: 50 },
    department: { type: String, maxlength: 100 },
    designation: { type: String, maxlength: 100 },
    joiningDate: Date,
    avatar: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now 
  },
  security: {
    lastLogin: Date,
    passwordChangedAt: { type: Date, default: Date.now },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  permissions: [{
    type: String
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    language: { type: String, default: 'en' }
  }
}, {
  timestamps: true
});

// Indexes
// userSchema.index({ email: 1 });
userSchema.index({ companyId: 1, role: 1 });
userSchema.index({ plantId: 1 });
userSchema.index({ isActive: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockedUntil && this.security.lockedUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.security.passwordChangedAt = Date.now() - 1000;
  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementLoginAttempts = function() {
  if (this.security.lockedUntil && this.security.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockedUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockedUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

export default mongoose.model('User', userSchema);