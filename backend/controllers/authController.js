const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, businessName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with that email' });
    }

    const user = new User({ name, email, password, businessName });
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        currency: user.currency || 'USD',
        themeMode: user.themeMode || 'dark'
      }
    });
  } catch (err) {
    console.error('Register error details:', {
      message: err.message,
      stack: err.stack,
      body: { ...req.body, password: '[REDACTED]' }
    });
    res.status(500).json({ msg: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        currency: user.currency || 'USD',
        themeMode: user.themeMode || 'dark'
      }
    });
  } catch (err) {
    console.error('Login error details:', {
      message: err.message,
      stack: err.stack,
      identifier: req.body?.email
    });
    res.status(500).json({ msg: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const { name, email, businessName, password, currency, themeMode } = req.body;

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ msg: 'Email is already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (businessName !== undefined) user.businessName = businessName;
    if (currency) user.currency = currency;
    if (themeMode) user.themeMode = themeMode;
    if (password) user.password = password;

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName,
      currency: user.currency,
      themeMode: user.themeMode,
      address: user.address
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const listUsers = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const users = await User.find().select('-password');

    const Client = mongoose.model('Client');
    const Transaction = mongoose.model('Transaction');
    const Invoice = mongoose.model('Invoice');

    const usersWithStats = await Promise.all(users.map(async (u) => {
      const [clientCount, transactionCount, invoiceCount, revAgg] = await Promise.all([
        Client.countDocuments({ user: u._id }),
        Transaction.countDocuments({ user: u._id }),
        Invoice.countDocuments({ user: u._id }),
        Transaction.aggregate([
          { $match: { user: u._id, type: 'income' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      return {
        ...u.toJSON(),
        clientCount,
        transactionCount,
        invoiceCount,
        totalRevenue: revAgg[0]?.total || 0
      };
    }));

    res.json(usersWithStats);
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (String(user._id) === String(req.user.id)) {
      return res.status(400).json({ msg: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({ msg: 'User role updated successfully', user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { register, login, getMe, updateProfile, listUsers, updateUserRole };