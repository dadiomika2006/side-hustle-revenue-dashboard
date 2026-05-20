const mongoose = require('mongoose');

const RecurringTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String },
  startDate: { type: Date, required: true },
  frequency: { type: String, enum: ['daily','weekly','monthly','yearly'], required: true },
  nextRunDate: { type: Date, required: true },
  endDate: { type: Date },
  enabled: { type: Boolean, default: true },
  category: { type: String },
  paymentMethod: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RecurringTransaction', RecurringTransactionSchema);
