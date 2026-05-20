const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

const getActiveGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id, enabled: true }).sort({ createdAt: -1 });
    res.json({ goals });
  } catch (err) {
    console.error('getActiveGoals error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const createGoal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, targetAmount, frequency, startDate, endDate } = req.body;
    const goal = new Goal({
      user: req.user.id,
      name,
      targetAmount,
      frequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    console.error('createGoal error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateGoal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });
    Object.assign(goal, req.body);
    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error('updateGoal error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });
    await goal.deleteOne();
    res.json({ msg: 'Goal removed' });
  } catch (err) {
    console.error('deleteGoal error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getGoalProgress = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id, enabled: true });
    const now = new Date();
    const summaries = await Promise.all(goals.map(async (goal) => {
      const start = new Date(goal.startDate);
      let end;
      if (goal.frequency === 'annual') {
        start.setMonth(0, 1);
        start.setHours(0,0,0,0);
        end = new Date(start.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else {
        start.setDate(1);
        start.setHours(0,0,0,0);
        end = new Date(start.getFullYear(), start.getMonth()+1, 0, 23, 59, 59, 999);
      }
      const incomeAgg = await Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user.id), type: 'income', date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const progress = incomeAgg[0]?.total || 0;
      return {
        id: goal._id,
        name: goal.name,
        frequency: goal.frequency,
        targetAmount: goal.targetAmount,
        achievedAmount: progress,
        progress: goal.targetAmount > 0 ? Math.min((progress / goal.targetAmount) * 100, 100) : 0,
        periodLabel: goal.frequency === 'annual' ? `${start.getFullYear()}` : `${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`
      };
    }));
    res.json({ goals: summaries });
  } catch (err) {
    console.error('getGoalProgress error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getActiveGoals, createGoal, updateGoal, deleteGoal, getGoalProgress };
