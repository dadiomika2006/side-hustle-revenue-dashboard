const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 0 },
  frequency: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
  startDate: { type: Date, default: () => new Date() },
  endDate: { type: Date },
  enabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Goal', GoalSchema);
