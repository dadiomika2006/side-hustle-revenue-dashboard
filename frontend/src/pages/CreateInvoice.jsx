import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdDelete } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    dueDate: '',
    status: 'pending',
    notes: ''
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, price: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'quantity' || field === 'price' ? value : value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, price: '' }]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client) { setError('Please select a client.'); return; }
    const hasEmpty = items.some(i => !i.description.trim() || !i.price || parseFloat(i.price) <= 0);
    if (hasEmpty) { setError('All line items need a description and price.'); return; }
    setLoading(true);
    try {
      await api.post('/invoices', {
        ...formData,
        items: items.map(i => ({ description: i.description, quantity: parseInt(i.quantity), price: parseFloat(i.price) }))
      });
      navigate('/invoices');
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Error creating invoice');
      setLoading(false);
    }
  };

  const fmt = (n) => formatMoney(n, currency);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Create Invoice</h1>
      </div>

      <div style={{ maxWidth: '780px' }}>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Client & Dates */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: '#94a3b8' }}>INVOICE DETAILS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Client</label>
                <select name="client" value={formData.client} onChange={handleChange} className="form-input" required>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Due Date</label>
                <input name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                  {['pending', 'paid', 'overdue', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8' }}>LINE ITEMS</h2>
              <button type="button" onClick={addItem} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                <MdAdd /> Add Item
              </button>
            </div>

            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 36px', gap: '8px', marginBottom: '8px', padding: '0 4px' }}>
              {['Description', 'Qty', 'Unit Price', ''].map(h => (
                <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 36px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} className="form-input" style={{ marginBottom: 0 }} placeholder="Item description" required />
                <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', e.target.value)} className="form-input" style={{ marginBottom: 0 }} />
                <input type="number" min="0" step="0.01" value={item.price} onChange={e => handleItemChange(i, 'price', e.target.value)} className="form-input" style={{ marginBottom: 0 }} placeholder="0.00" />
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: items.length === 1 ? 'not-allowed' : 'pointer', opacity: items.length === 1 ? 0.3 : 1, padding: '4px', display: 'flex' }}>
                  <MdDelete size={18} />
                </button>
              </div>
            ))}

            {/* Totals */}
            <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', marginTop: '16px', paddingTop: '16px' }}>
              {[['Subtotal', subtotal], ['Tax (10%)', tax], ['Total', total]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '14px', fontWeight: label === 'Total' ? 800 : 600, color: label === 'Total' ? '#e2e8f0' : '#94a3b8', minWidth: '90px', textAlign: 'right' }}>{fmt(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-input" rows={3} placeholder="Payment terms, thank you note..." style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Creating...' : '✓ Create Invoice'}
            </button>
            <button type="button" onClick={() => navigate('/invoices')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;