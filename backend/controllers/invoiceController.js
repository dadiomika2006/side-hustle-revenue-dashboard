const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// @desc Get all invoices for logged in user
// @route GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('client', 'name email');
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Get single invoice
// @route GET /api/invoices/:id
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone address');
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    // Check user owns invoice
    if (invoice.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    res.json(invoice);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Create new invoice
// @route POST /api/invoices
const createInvoice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { client, items, dueDate, status, notes, receipts } = req.body;
    // Check client exists
    const clientDoc = await Client.findById(client);
    if (!clientDoc) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    // Generate unique invoice number
    const uniqueSuffix = Date.now().toString(36).toUpperCase();
    const invoiceNumber = `INV-${req.user.id.slice(-4)}-${uniqueSuffix}`;
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    const newInvoice = new Invoice({
      user: req.user.id,
      client,
      invoiceNumber,
      items,
      subtotal,
      tax,
      total,
      dueDate,
      status,
      notes,
      receipts: receipts || []
    });
    const invoice = await newInvoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Update invoice status
// @route PUT /api/invoices/:id/status
const updateInvoiceStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    // Check user owns invoice
    if (invoice.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    invoice.status = status;
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Delete invoice
// @route DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    // Check user owns invoice
    if (invoice.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Invoice removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Send invoice email
// @route POST /api/invoices/:id/send
const sendInvoice = async (req, res) => {
  res.status(501).json({ msg: 'Not implemented' });
};

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoiceStatus, deleteInvoice, sendInvoice };