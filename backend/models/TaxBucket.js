const mongoose = require('mongoose');

const TaxBucketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: [true, 'Bucket name is required'], trim: true },
  percentage: { type: Number, required: [true, 'Percentage is required'], min: 0, max: 100 },
  category: { type: String, trim: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('TaxBucket', TaxBucketSchema);
