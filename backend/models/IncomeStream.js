const mongoose = require('mongoose');

const IncomeStreamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  color: { type: String, default: '#6366f1' },
  description: { type: String },
  platformUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IncomeStream', IncomeStreamSchema);
