const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');
const { getExchangeRate } = require('../utils/exchangeRates');
require('./User');


const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  incomeStream: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncomeStream'
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    get: decrypt,
    set: (v) => {
      if (v && v.includes(':')) return v;
      return encrypt(v);
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  category: {
    type: String,
    enum: ['salary', 'freelance', 'business', 'other', 'rent', 'utilities', 'groceries', 'transportation', 'entertainment']
  },
  taxCategory: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'card', 'online']
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'INR'],
    default: 'INR'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  baseAmount: {
    type: Number
  },
  hours: {
    type: Number,
    min: [0, 'Hours cannot be negative']
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  receipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receipt'
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

TransactionSchema.pre('save', async function() {
  if (this.isModified('amount') || this.isModified('currency') || !this.baseAmount) {
    try {
      const User = mongoose.model('User');
      const userDoc = await User.findById(this.user);
      const userCurrency = userDoc?.currency || 'USD';
      
      this.exchangeRate = getExchangeRate(this.currency || 'USD', userCurrency);
      this.baseAmount = this.amount * this.exchangeRate;
    } catch (err) {
      console.error('Transaction pre-save currency conversion error:', err);
      this.baseAmount = this.amount;
    }
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);