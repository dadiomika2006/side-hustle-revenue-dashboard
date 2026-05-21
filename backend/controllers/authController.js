const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 5000,
  socketTimeout: 5000
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, businessName, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with that email' });
    }

    if (phone) {
      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser) {
        return res.status(400).json({ msg: 'Phone number is already in use' });
      }
    }

    const user = new User({ name, email, password, businessName, phone });
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
    const { email, phone, password } = req.body;

    const identifier = email || phone;
    if (!identifier) {
      return res.status(400).json({ msg: 'Email or phone number is required' });
    }

    const user = await User.findOne(email ? { email: email.toLowerCase() } : { phone });
    if (!user) {
      console.warn(`Login attempt failed: User not found for ${email ? 'email' : 'phone'} ${identifier}`);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`Login attempt failed: Incorrect password for ${email ? 'email' : 'phone'} ${identifier}`);
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
      identifier: req.body?.email || req.body?.phone
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
      address: user.address,
      phone: user.phone
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { target } = req.body;

    if (!target) {
      return res.status(400).json({ msg: 'Email or phone number is required' });
    }

    const isEmail = target.includes('@');

    const query = isEmail ? { email: target.toLowerCase() } : { phone: target };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        msg: isEmail
          ? 'No account found with that email'
          : 'No account found with that phone number'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpTarget = target;
    user.otpType = isEmail ? 'email' : 'phone';
    await user.save();

    if (isEmail) {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({ msg: 'Server email configuration is missing. Please add EMAIL_USER and EMAIL_PASS to Render environment variables.' });
      }
      await transporter.sendMail({
        from: `"Side Hustle App" <${process.env.EMAIL_USER}>`,
        to: target,
        subject: 'Your Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                      background: #1a1a2e; color: #e2e8f0; padding: 32px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 40px;">💰</span>
              <h2 style="color: #6366f1; margin: 8px 0;">Side Hustle</h2>
            </div>
            <p style="font-size: 15px; color: #94a3b8;">Your one-time login OTP is:</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 10px;
                           color: #10b981; background: rgba(16,185,129,0.1);
                           padding: 16px 24px; border-radius: 10px;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 13px; color: #94a3b8; text-align: center;">
              This OTP expires in 60 seconds
            </p>
            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `
      });
    } else {
      await twilioClient.messages.create({
        body: `Your Side Hustle OTP is ${otp}. Expires in 60 seconds.`,
        from: process.env.TWILIO_PHONE,
        to: target
      });
    }

    res.json({
      msg: `OTP sent to your ${isEmail ? 'email' : 'phone'}`,
      otpType: isEmail ? 'email' : 'phone',
      expiresIn: 60
    });
  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ msg: 'Server error while sending OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { target, otp } = req.body;

    if (!target || !otp) {
      return res.status(400).json({ msg: 'Target and OTP are required' });
    }

    const isEmail = target.includes('@');
    const query = isEmail ? { email: target.toLowerCase() } : { phone: target };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
    }

    user.otp = null;
    user.otpExpires = null;
    user.otpTarget = null;
    user.otpType = null;
    await user.save();

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
    console.error('verifyOtp error:', err);
    res.status(500).json({ msg: 'Server error while verifying OTP' });
  }
};

const listUsers = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const users = await User.find().select('-password -otp -otpExpires -otpTarget -otpType');
    
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

module.exports = { register, login, getMe, updateProfile, sendOtp, verifyOtp, listUsers, updateUserRole };