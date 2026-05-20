const mongoose = require('mongoose');
const TaxBucket = require('../models/TaxBucket');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

const getTaxBuckets = async (req, res) => {
  try {
    const buckets = await TaxBucket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ buckets });
  } catch (err) {
    console.error('getTaxBuckets error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const createTaxBucket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, percentage, category } = req.body;
    const bucket = new TaxBucket({
      user: req.user.id,
      name,
      percentage,
      category: category || 'Other'
    });
    await bucket.save();
    res.status(201).json(bucket);
  } catch (err) {
    console.error('createTaxBucket error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateTaxBucket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const bucket = await TaxBucket.findOne({ _id: req.params.id, user: req.user.id });
    if (!bucket) return res.status(404).json({ msg: 'Tax bucket not found' });

    bucket.name = req.body.name ?? bucket.name;
    bucket.percentage = req.body.percentage ?? bucket.percentage;
    bucket.category = req.body.category ?? bucket.category;
    bucket.active = typeof req.body.active === 'boolean' ? req.body.active : bucket.active;
    await bucket.save();

    res.json(bucket);
  } catch (err) {
    console.error('updateTaxBucket error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const deleteTaxBucket = async (req, res) => {
  try {
    const bucket = await TaxBucket.findOne({ _id: req.params.id, user: req.user.id });
    if (!bucket) return res.status(404).json({ msg: 'Tax bucket not found' });
    await bucket.deleteOne();
    res.json({ msg: 'Tax bucket removed' });
  } catch (err) {
    console.error('deleteTaxBucket error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getTaxBucketSummary = async (req, res) => {
  try {
    const buckets = await TaxBucket.find({ user: req.user.id, active: true });
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const incomeAgg = await Transaction.aggregate([
      { $match: { user: userId, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncome = incomeAgg[0]?.total || 0;
    const recommendations = buckets.map(bucket => ({
      id: bucket._id,
      name: bucket.name,
      category: bucket.category,
      percentage: bucket.percentage,
      recommendedAmount: Number((totalIncome * bucket.percentage / 100).toFixed(2))
    }));

    const totalSetAside = recommendations.reduce((sum, item) => sum + item.recommendedAmount, 0);

    res.json({
      totalIncome,
      totalSetAside: Number(totalSetAside.toFixed(2)),
      recommendations,
      activeBuckets: recommendations.length
    });
  } catch (err) {
    console.error('getTaxBucketSummary error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getTaxBuckets,
  createTaxBucket,
  updateTaxBucket,
  deleteTaxBucket,
  getTaxBucketSummary
};
