const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completed: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['invoice', 'tax', 'goal', 'custom'],
    default: 'custom'
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', ReminderSchema);
