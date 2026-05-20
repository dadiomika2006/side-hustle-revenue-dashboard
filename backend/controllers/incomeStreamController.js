const IncomeStream = require('../models/IncomeStream');

exports.listIncomeStreams = async (req, res) => {
  try {
    const streams = await IncomeStream.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching income streams' });
  }
};

exports.createIncomeStream = async (req, res) => {
  try {
    const { name, color, description, platformUrl } = req.body;
    if (!name) return res.status(400).json({ msg: 'Name is required' });

    const stream = new IncomeStream({
      user: req.user.id,
      name,
      color: color || '#6366f1',
      description,
      platformUrl
    });

    const saved = await stream.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: 'Error creating income stream' });
  }
};

exports.updateIncomeStream = async (req, res) => {
  try {
    let stream = await IncomeStream.findById(req.params.id);
    if (!stream) return res.status(404).json({ msg: 'Income stream not found' });
    if (stream.user.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    const { name, color, description, platformUrl } = req.body;
    if (name) stream.name = name;
    if (color !== undefined) stream.color = color;
    if (description !== undefined) stream.description = description;
    if (platformUrl !== undefined) stream.platformUrl = platformUrl;

    await stream.save();
    res.json(stream);
  } catch (err) {
    res.status(500).json({ msg: 'Error updating income stream' });
  }
};

exports.deleteIncomeStream = async (req, res) => {
  try {
    const stream = await IncomeStream.findById(req.params.id);
    if (!stream) return res.status(404).json({ msg: 'Income stream not found' });
    if (stream.user.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    await IncomeStream.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Income stream deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting income stream' });
  }
};
