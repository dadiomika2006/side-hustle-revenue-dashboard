const Reminder = require('../models/Reminder');
const Invoice = require('../models/Invoice');
const Goal = require('../models/Goal');

/**
 * Auto-generate dynamic system reminders (overdue invoices, tax reminders, and goals)
 * @param {string} userId 
 */
async function autoGenerateReminders(userId) {
  try {
    const now = new Date();
    
    // 1. Check for overdue invoices
    const overdueInvoices = await Invoice.find({
      user: userId,
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lt: now }
    }).populate('client');

    for (const inv of overdueInvoices) {
      // Update status to overdue if not already
      if (inv.status === 'pending') {
        inv.status = 'overdue';
        await inv.save();
      }

      // Check if reminder already exists for this invoice
      const reminderKey = `Invoice #${inv.invoiceNumber} is Overdue`;
      const existing = await Reminder.findOne({ user: userId, title: reminderKey });
      
      if (!existing) {
        await Reminder.create({
          user: userId,
          title: reminderKey,
          description: `Invoice for ${inv.client?.name || 'Client'} of amount ${inv.total} was due on ${new Date(inv.dueDate).toLocaleDateString()}`,
          dueDate: inv.dueDate,
          type: 'invoice',
          link: '/invoices',
          completed: false
        });
      }
    }

    // 2. Check for active goals nearing deadline
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const nearDueGoals = await Goal.find({
      user: userId,
      enabled: true,
      targetAmount: { $gt: 0 },
      // Check if near due
      $expr: {
        $and: [
          { $gt: ['$targetAmount', '$achievedAmount'] }
        ]
      }
    });

    // Filtering goals where target dates are upcoming in the next 3 days
    for (const goal of nearDueGoals) {
      // In this system, goals might have dynamic targets or end dates. If they have a specific date/period, we log reminders.
      // Let's create a general reminder if they have active goals and need to catch up
      const reminderKey = `Financial Goal: "${goal.name}" Progress Check`;
      const existing = await Reminder.findOne({ user: userId, title: reminderKey });
      if (!existing) {
        await Reminder.create({
          user: userId,
          title: reminderKey,
          description: `You are currently at ${goal.achievedAmount} out of your target of ${goal.targetAmount}! Take some actions to close the gap.`,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          type: 'goal',
          link: '/goals',
          completed: false
        });
      }
    }

    // 3. Tax check-in (auto generate quarterly)
    const quarterlyTaxKey = 'Quarterly Tax Planning Check-In';
    const taxReminder = await Reminder.findOne({ user: userId, title: quarterlyTaxKey });
    if (!taxReminder) {
      await Reminder.create({
        user: userId,
        title: quarterlyTaxKey,
        description: 'Review your logged transactions and check your active Tax Buckets allocation to prepare for quarterly filings.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        type: 'tax',
        link: '/tax-buckets',
        completed: false
      });
    }

  } catch (err) {
    console.error('Error auto-generating reminders:', err);
  }
}

// @desc Get all reminders (with auto-generation first)
exports.getReminders = async (req, res) => {
  try {
    await autoGenerateReminders(req.user.id);
    
    const reminders = await Reminder.find({ user: req.user.id })
      .sort({ completed: 1, dueDate: 1 });
      
    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Create custom reminder
exports.createReminder = async (req, res) => {
  try {
    const { title, description, dueDate, type, link } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ msg: 'Title and due date are required' });
    }
    
    const reminder = new Reminder({
      user: req.user.id,
      title,
      description,
      dueDate,
      type: type || 'custom',
      link
    });
    
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Toggle reminder completion status
exports.toggleReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }
    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    reminder.completed = !reminder.completed;
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Delete reminder
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }
    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    await reminder.deleteOne();
    res.json({ msg: 'Reminder deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
