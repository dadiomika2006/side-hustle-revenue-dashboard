const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// @desc Get all clients for logged in user
// @route GET /api/clients
const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Get single client
// @route GET /api/clients/:id
const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    // Check user owns client
    if (client.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    res.json(client);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Create new client
// @route POST /api/clients
const createClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, phone, company, address } = req.body;
    const newClient = new Client({
      user: req.user.id,
      name,
      email,
      phone,
      company,
      address: {
        street: address?.street,
        city: address?.city,
        state: address?.state,
        zip: address?.zip,
        country: address?.country
      }
    });
    const client = await newClient.save();
    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Update client
// @route PUT /api/clients/:id
const updateClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, phone, company, address } = req.body;
    let client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    // Check user owns client
    if (client.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    // Update client
    client.name = name || client.name;
    client.email = email || client.email;
    client.phone = phone || client.phone;
    client.company = company || client.company;
    client.address = {
      street: address?.street || client.address?.street,
      city: address?.city || client.address?.city,
      state: address?.state || client.address?.state,
      zip: address?.zip || client.address?.zip,
      country: address?.country || client.address?.country
    };
    await client.save();
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc Delete client
// @route DELETE /api/clients/:id
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    // Check user owns client
    if (client.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Client.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Client removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getClientMargins = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Aggregate transactions by client and type, summing the amounts in base currency
    const clientStats = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: { client: '$client', type: '$type' },
          total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } }
        }
      }
    ]);
    
    const margins = {};
    clientStats.forEach(stat => {
      const clientId = stat._id.client ? stat._id.client.toString() : 'null';
      if (clientId === 'null') return;
      if (!margins[clientId]) {
        margins[clientId] = { income: 0, expense: 0, hours: 0 };
      }
      if (stat._id.type === 'income') {
        margins[clientId].income = stat.total;
      } else if (stat._id.type === 'expense') {
        margins[clientId].expense = stat.total;
      }
    });

    // Also get hours worked per client for hourly rate tracking
    const clientHours = await Transaction.aggregate([
      { $match: { user: userId, type: 'income', hours: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$client',
          totalHours: { $sum: '$hours' }
        }
      }
    ]);

    clientHours.forEach(stat => {
      const clientId = stat._id ? stat._id.toString() : 'null';
      if (clientId !== 'null' && margins[clientId]) {
        margins[clientId].hours = stat.totalHours || 0;
      }
    });
    
    // Calculate profit and margin and average hourly rate
    Object.keys(margins).forEach(clientId => {
      const m = margins[clientId];
      m.profit = m.income - m.expense;
      m.margin = m.income > 0 ? parseFloat(((m.profit / m.income) * 100).toFixed(1)) : 0;
      m.hourlyRate = m.hours > 0 ? parseFloat((m.income / m.hours).toFixed(1)) : 0;
    });
    
    res.json(margins);
  } catch (err) {
    console.error('getClientMargins error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient, getClientMargins };