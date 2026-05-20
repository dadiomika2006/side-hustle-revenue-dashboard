const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getInvoices, getInvoice, createInvoice, updateInvoiceStatus, deleteInvoice, sendInvoice } = require('../controllers/invoiceController');
const { validateInvoice } = require('../validators/invoiceValidator');

// All routes are protected by auth middleware
router.use(auth);

// @route GET /api/invoices
// @desc Get all invoices
router.get('/', getInvoices);

// @route GET /api/invoices/:id
// @desc Get single invoice
router.get('/:id', getInvoice);

// @route POST /api/invoices
// @desc Create new invoice
router.post('/', validateInvoice, createInvoice);

// @route PUT /api/invoices/:id/status
// @desc Update invoice status
router.put('/:id/status', updateInvoiceStatus);

// @route POST /api/invoices/:id/send
// @desc Send invoice to client
router.post('/:id/send', sendInvoice);

// @route DELETE /api/invoices/:id
// @desc Delete invoice
router.delete('/:id', deleteInvoice);

module.exports = router;