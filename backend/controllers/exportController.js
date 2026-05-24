const Transaction = require('../models/Transaction');
const Client = require('../models/Client');

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

exports.exportCSV = async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    const query = { user: req.user.id };
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);

    const txs = await Transaction.find(query).populate('client', 'name').sort({ date: -1 });

    const header = ['Date','Type','Client','Amount','Category','PaymentMethod','Description','InvoiceId'];
    const rows = txs.map(t => [
      t.date ? new Date(t.date).toISOString().split('T')[0] : '',
      t.type,
      t.client ? t.client.name : '',
      t.amount.toFixed(2),
      t.category || '',
      t.paymentMethod || '',
      t.description ? t.description.replace(/\r?\n/g, ' ') : '',
      t.invoice ? String(t.invoice) : ''
    ].map(escapeCsv).join(','));

    const csv = [header.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportCSV error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Basic Schedule C exporter: sums by tax-deductible categories and maps to Schedule C lines
const scheduleCMap = {
  'Advertising': 'Advertising',
  'Car & Truck Expenses': 'Car & Truck Expenses',
  'Commissions & Fees': 'Commissions & Fees',
  'Contract Labor': 'Contract labor',
  'Insurance': 'Insurance',
  'Legal & Professional Services': 'Legal & Professional Services',
  'Office Expense': 'Office Expense',
  'Rent or Lease (Vehicles/Real Estate)': 'Rent or Lease (Vehicles/Real Estate)',
  'Repairs & Maintenance': 'Repairs & Maintenance',
  'Supplies': 'Supplies',
  'Taxes & Licenses': 'Taxes & Licenses',
  'Travel & Meals': 'Travel & Meals',
  'Utilities': 'Utilities',
  'Other Business Expenses': 'Other Business Expenses'
};

exports.exportScheduleC = async (req, res) => {
  try {
    const { year } = req.query;
    const start = year ? new Date(`${year}-01-01`) : new Date(new Date().getFullYear(), 0, 1);
    const end = year ? new Date(`${year}-12-31T23:59:59.999Z`) : new Date();
    const txs = await Transaction.find({ user: req.user.id, date: { $gte: start, $lte: end } });

    // Group expenses by taxCategory
    const totals = {};
    txs.forEach(t => {
      if (t.type === 'expense') {
        const cat = t.taxCategory || 'Other Business Expenses';
        if (!totals[cat]) totals[cat] = 0;
        totals[cat] += t.amount;
      }
    });

    const header = ['Schedule C Category', 'Total'];
    const rows = Object.keys(scheduleCMap).map(k => [scheduleCMap[k], (totals[k] || 0).toFixed(2)].map(escapeCsv).join(','));

    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="schedule_c_${year || new Date().getFullYear()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportScheduleC error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
