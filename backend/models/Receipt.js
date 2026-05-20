const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  originalName: { type: String },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  mimetype: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Receipt', ReceiptSchema);
