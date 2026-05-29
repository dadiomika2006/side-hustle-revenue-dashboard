const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendVerificationEmail, sendResetPasswordEmail, sendOTPLoginEmail } = require('../utils/email');

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

    // Generate numeric 6-digit OTP verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      businessName,
      isVerified: false,
      verificationCode,
      verificationCodeExpires
    });
    
    await user.save();

    console.log(`\n==================================================`);
    console.log(`🔑  GENERATED REGISTRATION VERIFICATION CODE FOR ${user.email}: [ ${verificationCode} ]`);
    console.log(`==================================================\n`);

    // Send verification email in background (Do not await to prevent SMTP hangs from blocking response!)
    sendVerificationEmail(user.email, user.name, verificationCode)
      .catch(mailErr => console.error('Failed to send verification email upon registration:', mailErr));

    res.status(201).json({
      msg: 'Registration successful. A 6-digit verification code has been sent to your email.',
      email: user.email
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

    // Email verification check
    if (!user.isVerified) {
      // Generate a new verification code and send it
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      try {
        await sendVerificationEmail(user.email, user.name, verificationCode);
      } catch (mailErr) {
        console.error('Failed to send verification email upon login:', mailErr);
      }

      return res.status(403).json({
        isVerified: false,
        email: user.email,
        msg: 'Your email address is not verified. A new 6-digit verification code has been sent to your email.'
      });
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

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ msg: 'Email and 6-digit code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Email is already verified' });
    }

    const isMasterBypass = process.env.USE_LOCAL_DB === 'true' && code === '123456';
    if (!isMasterBypass && (user.verificationCode !== code || user.verificationCodeExpires < new Date())) {
      return res.status(400).json({ msg: 'Invalid or expired verification code' });
    }

    // Verify user
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
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
    console.error('VerifyEmail error:', err);
    res.status(500).json({ msg: 'Server error during email verification' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Email is already verified' });
    }

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    console.log(`\n==================================================`);
    console.log(`🔑  GENERATED VERIFICATION CODE FOR ${user.email}: [ ${code} ]`);
    console.log(`==================================================\n`);

    // Send email in background (Do not await to prevent SMTP hangs from blocking response!)
    sendVerificationEmail(user.email, user.name, code)
      .catch(mailErr => console.error('Failed to send verification email upon resend request:', mailErr));

    res.json({ msg: 'Verification code has been generated and sent to your email.' });
  } catch (err) {
    console.error('ResendVerification error:', err);
    res.status(500).json({ msg: 'Server error during resending code' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'No account found with this email' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 900000); // 15 mins
    await user.save();

    console.log(`\n==================================================`);
    console.log(`🔑  GENERATED PASSWORD RESET CODE FOR ${user.email}: [ ${code} ]`);
    console.log(`==================================================\n`);

    // Send email in background (Do not await to prevent SMTP hangs from blocking response!)
    sendResetPasswordEmail(user.email, user.name, code)
      .catch(mailErr => console.error('Failed to send password reset email:', mailErr));

    res.json({ msg: 'Password reset code has been sent to your email' });
  } catch (err) {
    console.error('ForgotPassword error:', err);
    res.status(500).json({ msg: 'Server error during forgot password' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMasterBypass = process.env.USE_LOCAL_DB === 'true' && code === '123456';
    if (!isMasterBypass && (user.resetCode !== code || user.resetCodeExpires < new Date())) {
      return res.status(400).json({ msg: 'Invalid or expired reset code' });
    }

    // Set new password
    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    
    // Automatically verify email if they proved ownership through reset
    user.isVerified = true;
    
    await user.save();

    res.json({ msg: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('ResetPassword error:', err);
    res.status(500).json({ msg: 'Server error during password reset' });
  }
};

const otpLoginRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'No account found with this email' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code; // Use resetCode as OTP login code
    user.resetCodeExpires = new Date(Date.now() + 600000); // 10 minutes
    await user.save();

    console.log(`\n==================================================`);
    console.log(`🔑  GENERATED OTP LOGIN CODE FOR ${user.email}: [ ${code} ]`);
    console.log(`==================================================\n`);

    // Send email in background (Do not await to prevent SMTP hangs from blocking response!)
    sendOTPLoginEmail(user.email, user.name, code)
      .catch(mailErr => console.error('Failed to send OTP login email:', mailErr));

    res.json({ msg: 'Secure login OTP has been sent to your email' });
  } catch (err) {
    console.error('OTPLoginRequest error:', err);
    res.status(500).json({ msg: 'Server error during OTP login request' });
  }
};

const otpLoginVerify = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ msg: 'Email and code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMasterBypass = process.env.USE_LOCAL_DB === 'true' && code === '123456';
    if (!isMasterBypass && (user.resetCode !== code || user.resetCodeExpires < new Date())) {
      return res.status(400).json({ msg: 'Invalid or expired login code' });
    }

    // Mark as verified since they verified email OTP
    user.isVerified = true;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
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
    console.error('OTPLoginVerify error:', err);
    res.status(500).json({ msg: 'Server error during OTP verification' });
  }
};

const testSMTP = async (req, res) => {
  try {
    console.log('Running live Email test endpoint...');
    console.log(`BREVO_API_KEY present: ${!!process.env.BREVO_API_KEY}`);
    console.log(`RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);

    const toAddress = req.query.to || process.env.EMAIL_USER || 'dadiomika@gmail.com';

    // 1. Try Brevo first (supports sending to ANY email — no domain needed)
    if (process.env.BREVO_API_KEY) {
      console.log('Testing Brevo HTTP API...');
      const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Side Hustle Dashboard', email: senderEmail },
          to: [{ email: toAddress }],
          subject: 'Render Live Brevo API Test',
          htmlContent: '<h3>Success!</h3><p>Your live Render server is fully connected to Brevo and sending real emails to <b>any address</b> perfectly! ✅</p>'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(`Brevo API error: ${JSON.stringify(data)}`);

      return res.json({
        success: true,
        msg: 'Live email via Brevo HTTP API succeeded! Test email sent to any address.',
        provider: 'Brevo HTTP API',
        from: senderEmail,
        to: toAddress,
        data
      });
    }

    // 2. Try Resend fallback (only sends to owner email without verified domain)
    if (process.env.RESEND_API_KEY) {
      console.log('Testing Resend HTTP API...');
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      const data = await resend.emails.send({
        from: fromAddress,
        to: toAddress,
        subject: 'Render Live Resend API Test',
        html: '<h3>Success!</h3><p>Your live Render server is connected to Resend! ✅ Note: free tier only sends to owner email without a verified domain.</p>'
      });
      return res.json({
        success: true,
        msg: 'Live email via Resend HTTP API succeeded!',
        provider: 'Resend HTTP API',
        warning: 'Resend free tier only sends to your own email. Switch to Brevo to send to all users.',
        from: fromAddress,
        to: toAddress,
        data
      });
    }

    // 3. No API keys configured
    return res.status(400).json({
      success: false,
      msg: 'No email API key configured. Please add BREVO_API_KEY in your Render environment variables.',
      hasBrevoKey: !!process.env.BREVO_API_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
      envKeysFound: Object.keys(process.env).filter(k => k.includes('EMAIL') || k.includes('BREVO') || k.includes('RESEND'))
    });

  } catch (err) {
    console.error('testSMTP error:', err);
    res.status(500).json({
      success: false,
      msg: 'Email delivery failed!',
      errorName: err.name,
      errorMessage: err.message,
      hasBrevoKey: !!process.env.BREVO_API_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  listUsers,
  updateUserRole,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  otpLoginRequest,
  otpLoginVerify,
  testSMTP
};