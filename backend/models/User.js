const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  businessName: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'partnership']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'INR'],
    default: 'INR'
  },
  themeMode: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  address: addressSchema,
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  resetCode: String,
  resetCodeExpires: Date

}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to exclude sensitive data
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
