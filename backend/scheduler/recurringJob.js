const cron = require('node-cron');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const Reminder = require('../models/Reminder');
const User = require('../models/User');

function addInterval(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d;
}

async function processDueRecurring() {
  try {
    const now = new Date();
    const due = await RecurringTransaction.find({ enabled: true, nextRunDate: { $lte: now } });
    if (!due.length) return;
    for (const rec of due) {
      if (!rec.client) {
        console.warn('Skipping recurring transaction without client:', rec._id);
        // advance nextRunDate to avoid tight loop
        rec.nextRunDate = addInterval(rec.nextRunDate, rec.frequency);
        if (rec.endDate && rec.nextRunDate > rec.endDate) rec.enabled = false;
        await rec.save();
        continue;
      }
      const tx = new Transaction({
        user: rec.user,
        client: rec.client,
        type: rec.type,
        amount: rec.amount,
        description: rec.description,
        date: rec.nextRunDate,
        category: rec.category,
        paymentMethod: rec.paymentMethod
      });
      await tx.save();
      // advance nextRunDate
      rec.nextRunDate = addInterval(rec.nextRunDate, rec.frequency);
      if (rec.endDate && rec.nextRunDate > rec.endDate) rec.enabled = false;
      await rec.save();
    }
  } catch (err) {
    console.error('processDueRecurring error', err);
  }
}

// Schedule to run every day at 00:05
cron.schedule('5 0 * * *', () => {
  console.log('Running recurring transactions job');
  processDueRecurring();
});

// Schedule weekly logging reminder every Sunday at 18:00 (6 PM)
cron.schedule('0 18 * * 0', async () => {
  console.log('Running Sunday logging reminders job');
  try {
    const users = await User.find();
    
    for (const u of users) {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0,0,0,0));
      const endOfDay = new Date(today.setHours(23,59,59,999));
      
      const title = 'Weekly Earnings logging reminder';
      // Look for a reminder created on this Sunday already to avoid duplication
      const existing = await Reminder.findOne({
        user: u._id,
        title,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      if (!existing) {
        await Reminder.create({
          user: u._id,
          title,
          description: "It's Sunday evening! Don't forget to log your earnings and expenses for this week to keep your dashboard up to date.",
          dueDate: new Date(),
          type: 'custom',
          link: '/transactions',
          completed: false
        });
        console.log(`Weekly logging reminder created for user: ${u.email}`);
      }
    }
  } catch (err) {
    console.error('Error generating Sunday logging reminders:', err);
  }
});

// Also expose a manual trigger
module.exports = { processDueRecurring };
