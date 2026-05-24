const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const receiptController = require('../controllers/receiptController');
const multer = require('multer');

// POST upload single receipt — field name: "receipt"
router.post('/upload', auth, (req, res, next) => {
  upload.single('receipt')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }
    next();
  });
}, receiptController.uploadReceipt);

// GET list of receipts for user
router.get('/', auth, receiptController.listReceipts);

// GET single receipt file
router.get('/:id', auth, receiptController.getReceipt);

// DELETE receipt
router.delete('/:id', auth, receiptController.deleteReceipt);

module.exports = router;
