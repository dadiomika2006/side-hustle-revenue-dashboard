const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const receiptController = require('../controllers/receiptController');

// POST upload single receipt — field name: "receipt"
router.post('/upload', auth, upload.single('receipt'), receiptController.uploadReceipt);

// GET list of receipts for user
router.get('/', auth, receiptController.listReceipts);

// GET single receipt file
router.get('/:id', auth, receiptController.getReceipt);

// DELETE receipt
router.delete('/:id', auth, receiptController.deleteReceipt);

module.exports = router;
