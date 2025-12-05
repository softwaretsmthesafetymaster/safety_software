import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  code: { 
    type: String,
    required: true,
    uppercase: true,
    maxlength: 20
  },
  description: { 
    type: String,
    maxlength: 500
  },
  plantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Plant', 
    required: true 
  },
  location: {
    floor: String,
    building: String,
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  personnel: {
    hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    safetyIncharge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  riskProfile: {
    level: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'medium' 
    },
    lastAssessment: Date,
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  capacity: {
    maxPersonnel: { type: Number, min: 1 },
    currentPersonnel: { type: Number, default: 0 }
  },
  equipment: [{
    name: String,
    type: String,
    serialNumber: String,
    lastMaintenance: Date,
    nextMaintenance: Date
  }],
  emergencyProcedures: {
    evacuation: String,
    assembly: String,
    contacts: [String]
  },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Indexes
areaSchema.index({ plantId: 1, isActive: 1 });
areaSchema.index({ code: 1 });
areaSchema.index({ 'personnel.hod': 1 });
areaSchema.index({ 'personnel.safetyIncharge': 1 });

// Pre-save middleware
areaSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

export default mongoose.model('Area', areaSchema);