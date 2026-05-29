const mongoose = require('mongoose');
const validator = require('validator');
const { encrypt, decrypt } = require('../utils/encryption');

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String
});

const ClientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    get: decrypt,
    set: (v) => {
      if (v && v.includes(':')) return v;
      return encrypt(v);
    },
    validate: {
      validator: (v) => !v || v.includes(':') || validator.isMobilePhone(v, 'any', { strictMode: false }),
      message: 'Please provide a valid phone number'
    }
  },
  company: {
    type: String,
    trim: true,
    get: decrypt,
    set: (v) => {
      if (v && v.includes(':')) return v;
      return encrypt(v);
    }
  },
  address: addressSchema
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Client', ClientSchema);