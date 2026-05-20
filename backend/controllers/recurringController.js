const RecurringTransaction = require('../models/RecurringTransaction');

exports.createRecurring = async (req, res) => {
  try {
    const data = req.body;
    data.user = req.user.id;
    // Ensure nextRunDate exists
    if (!data.nextRunDate) data.nextRunDate = data.startDate;
    const recurring = new RecurringTransaction(data);
    await recurring.save();
    res.json({ recurring });
  } catch (err) {
    console.error('createRecurring error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listRecurring = async (req, res) => {
  try {
    const list = await RecurringTransaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ recurring: list });
  } catch (err) {
    console.error('listRecurring error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getRecurring = async (req, res) => {
  try {
    const rec = await RecurringTransaction.findById(req.params.id);
    if (!rec) return res.status(404).json({ msg: 'Not found' });
    if (String(rec.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Access denied' });
    res.json({ recurring: rec });
  } catch (err) {
    console.error('getRecurring error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateRecurring = async (req, res) => {
  try {
    const rec = await RecurringTransaction.findById(req.params.id);
    if (!rec) return res.status(404).json({ msg: 'Not found' });
    if (String(rec.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Access denied' });
    Object.assign(rec, req.body);
    await rec.save();
    res.json({ recurring: rec });
  } catch (err) {
    console.error('updateRecurring error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteRecurring = async (req, res) => {
  try {
    const rec = await RecurringTransaction.findById(req.params.id);
    if (!rec) return res.status(404).json({ msg: 'Not found' });
    if (String(rec.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Access denied' });
    await rec.deleteOne();
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error('deleteRecurring error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
