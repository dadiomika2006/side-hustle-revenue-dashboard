const Mileage = require('../models/Mileage');

exports.createMileage = async (req, res) => {
  try {
    const data = req.body;
    data.user = req.user.id;
    const m = new Mileage(data);
    await m.save();
    res.json({ mileage: m });
  } catch (err) {
    console.error('createMileage error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listMileage = async (req, res) => {
  try {
    const list = await Mileage.find({ user: req.user.id }).sort({ date: -1 });
    res.json({ mileage: list });
  } catch (err) {
    console.error('listMileage error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getMileage = async (req, res) => {
  try {
    const m = await Mileage.findById(req.params.id);
    if (!m) return res.status(404).json({ msg: 'Not found' });
    if (String(m.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Access denied' });
    res.json({ mileage: m });
  } catch (err) {
    console.error('getMileage error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteMileage = async (req, res) => {
  try {
    const m = await Mileage.findById(req.params.id);
    if (!m) return res.status(404).json({ msg: 'Not found' });
    if (String(m.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Access denied' });
    await m.deleteOne();
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error('deleteMileage error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.summaryByMonth = async (req, res) => {
  try {
    const agg = await Mileage.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId(req.user.id) } },
      { $project: { year: { $year: '$date' }, month: { $month: '$date' }, miles: 1, amount: { $multiply: ['$miles', '$rate'] } } },
      { $group: { _id: { year: '$year', month: '$month' }, totalMiles: { $sum: '$miles' }, totalAmount: { $sum: '$amount' } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    res.json({ summary: agg });
  } catch (err) {
    console.error('summaryByMonth error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
