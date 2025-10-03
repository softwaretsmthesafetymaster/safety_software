import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['platform_owner', 'company_owner', 'plant_head', 'safety_incharge', 'hod', 'contractor', 'worker','user','admin']
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
  isActive: {
    type: Boolean,
    default: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  permissions: [{
    type: String
  }],
  lastLogin: {
    type: Date
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);