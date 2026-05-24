const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Client = require('../models/Client');
const IncomeStream = require('../models/IncomeStream');
const Receipt = require('../models/Receipt');
const Invoice = require('../models/Invoice');
const { validationResult } = require('express-validator');


// @desc    Get all transactions for logged in user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { type, category, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('client', 'name')
        .populate('incomeStream', 'name color')
        .populate('receipt', 'originalName filename size'),
      Transaction.countDocuments(filter)
    ]);

    res.json({ transactions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('client', 'name email')
      .populate('incomeStream', 'name color')
      .populate('receipt', 'originalName filename size');
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    res.json(transaction);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { client, incomeStream, type, amount, description, date, category, paymentMethod, receipt, hours } = req.body;

    // Verify client belongs to user if provided
    if (client) {
      const clientDoc = await Client.findOne({ _id: client, user: req.user.id });
      if (!clientDoc) {
        return res.status(404).json({ msg: 'Client not found' });
      }
    }

    // Verify incomeStream belongs to user if provided
    if (incomeStream) {
      const streamDoc = await IncomeStream.findOne({ _id: incomeStream, user: req.user.id });
      if (!streamDoc) {
        return res.status(404).json({ msg: 'Income Stream not found' });
      }
    }

    const newTransaction = new Transaction({
      user: req.user.id,
      client: client || undefined,
      incomeStream: incomeStream || undefined,
      type,
      amount,
      description,
      date,
      category,
      paymentMethod,
      hours: hours || undefined,
      receipt: receipt || undefined
    });

    const transaction = await newTransaction.save();
    const populatedTransaction = await Transaction.populate(transaction, [
      { path: 'client', select: 'name' },
      { path: 'incomeStream', select: 'name color' }
    ]);
    res.status(201).json(populatedTransaction);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: `Invalid field format for ${err.path}` });
    }
    res.status(500).json({ msg: 'Server error', error: err.message, stack: err.stack });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { client, incomeStream, type, amount, description, date, category, paymentMethod, receipt, hours } = req.body;

    let transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (client) {
      const clientDoc = await Client.findOne({ _id: client, user: req.user.id });
      if (!clientDoc) {
        return res.status(404).json({ msg: 'Client not found' });
      }
    }

    if (incomeStream) {
      const streamDoc = await IncomeStream.findOne({ _id: incomeStream, user: req.user.id });
      if (!streamDoc) {
        return res.status(404).json({ msg: 'Income Stream not found' });
      }
    }

    const updateFields = {
      client: client === '' ? null : client,
      incomeStream: incomeStream === '' ? null : incomeStream,
      type,
      amount,
      description,
      date,
      category,
      paymentMethod,
      receipt: receipt === '' ? null : receipt,
      hours: hours === '' ? null : hours
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) delete updateFields[key];
    });

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      { path: 'client', select: 'name' },
      { path: 'incomeStream', select: 'name color' }
    ]);

    res.json(transaction);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ msg: messages.join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: `Invalid field format for ${err.path}` });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Transaction removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get income/expense summary
// @route   GET /api/transactions/summary
// @access  Private
const getTransactionSummary = async (req, res) => {
  try {
    // Cast string id to ObjectId — critical for aggregation pipeline matching
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [incomeAgg, expenseAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'income' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
      ])
    ]);

    const income = incomeAgg[0]?.total || 0;
    const expense = expenseAgg[0]?.total || 0;

    res.json({
      income,
      expense,
      balance: income - expense,
      savingsRate: income > 0 ? (((income - expense) / income) * 100).toFixed(1) : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
};