import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: String,
  description: String,
  // hazardLevel: {
  //   type: String,
  //   enum: ['low', 'medium', 'high', 'critical'],
  //   default: 'medium'
  // },
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  safetyIncharge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Area', areaSchema);
