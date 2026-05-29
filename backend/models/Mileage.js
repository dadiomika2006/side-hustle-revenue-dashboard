const mongoose = require('mongoose');

const MileageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  miles: { type: Number, required: true, min: 0 },
  vehicle: { type: String },
  purpose: { type: String },
  notes: { type: String },
  rate: { type: Number, default: 0.655 },
  reimbursed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Mileage', MileageSchema);
