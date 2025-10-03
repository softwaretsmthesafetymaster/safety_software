import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String },
  industry: { type: String, required: true },
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
    plan: { type: String, enum: ['basic', 'professional', 'enterprise'], default: 'basic' },
    status: { type: String, enum: ['active', 'suspended', 'cancelled'], default: 'active' },
    expiryDate: Date,
    paymentId: String,
    orderId: String
  },
  config: { type: mongoose.Schema.Types.Mixed, default: {} }, // keep it flexible
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);
