const fs = require('fs');
const path = require('path');
const Receipt = require('../models/Receipt');

exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const { transactionId, invoiceId } = req.body;
    const receipt = new Receipt({
      user: req.user.id,
      transaction: transactionId || undefined,
      invoice: invoiceId || undefined,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    await receipt.save();
    res.json({ msg: 'Uploaded', receipt });
  } catch (err) {
    console.error('uploadReceipt error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ msg: 'Receipt not found' });
    if (String(receipt.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Access denied' });
    res.sendFile(path.resolve(receipt.path));
  } catch (err) {
    console.error('getReceipt error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ user: req.user.id }).sort({ uploadedAt: -1 });
    res.json({ receipts });
  } catch (err) {
    console.error('listReceipts error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ msg: 'Receipt not found' });
    if (String(receipt.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Access denied' });
    // Remove file
    if (fs.existsSync(receipt.path)) {
      fs.unlinkSync(receipt.path);
    }
    await receipt.deleteOne();
    res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error('deleteReceipt error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
