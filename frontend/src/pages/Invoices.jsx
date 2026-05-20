import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdDelete, MdDownload } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { generateInvoicePDF } from '../utils/generateInvoicePDF.js';

const fmt = (n, currency = 'USD') => formatMoney(n, currency);

const Invoices = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.get('/invoices')
      .then(res => setInvoices(res.data))
      .catch(() => setError('Error loading invoices'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv._id !== id));
      setSuccess('Invoice deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error deleting invoice'); }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/invoices/${id}/status`, { status });
      setInvoices(invoices.map(inv => inv._id === id ? { ...inv, status: res.data.status } : inv));
      setSuccess('Invoice status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error updating status'); }
    finally { setUpdatingId(null); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>;

  // Invoice status stats calculations
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const cancelledInvoices = invoices.filter(i => i.status === 'cancelled');

  const paidSum = paidInvoices.reduce((acc, i) => acc + i.total, 0);
  const pendingSum = pendingInvoices.reduce((acc, i) => acc + i.total, 0);
  const overdueSum = overdueInvoices.reduce((acc, i) => acc + i.total, 0);
  const cancelledSum = cancelledInvoices.reduce((acc, i) => acc + i.total, 0);

  const statusCards = [
    { label: 'Paid Invoices', count: paidInvoices.length, sum: paidSum, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Pending Invoices', count: pendingInvoices.length, sum: pendingSum, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Overdue Invoices', count: overdueInvoices.length, sum: overdueSum, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    { label: 'Cancelled Invoices', count: cancelledInvoices.length, sum: cancelledSum, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Track client billing status, download PDFs, and monitor accounts receivable.</p>
        </div>
        <Link to="/create-invoices" className="btn btn-primary"><MdAdd size={18} /> New Invoice</Link>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Invoice Status Tracker Grid */}
      {invoices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {statusCards.map(card => (
            <div key={card.label} style={{
              background: card.bg,
              border: `1px solid ${card.color}26`,
              padding: '16px',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: card.color }}>{fmt(card.sum, currency)}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>{card.count} total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <h3 style={{ marginBottom: '8px' }}>No invoices yet</h3>
            <Link to="/create-invoices" className="btn btn-primary" style={{ marginTop: '12px' }}><MdAdd size={16} /> Create Invoice</Link>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Total</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td style={{ fontFamily:'monospace', fontSize:'13px', color:'#a5b4fc', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                  <td>
                    <div style={{ fontWeight:700, color:'#e2e8f0' }}>{inv.client?.name || '—'}</div>
                    <div style={{ fontSize:'12px', color:'#94a3b8' }}>{inv.client?.email || ''}</div>
                  </td>
                  <td style={{ fontWeight:700, color:'#e2e8f0' }}>{fmt(inv.total, currency)}</td>
                  <td style={{ color:'#94a3b8', fontSize:'13px' }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <select value={inv.status} onChange={e => handleStatusChange(inv._id, e.target.value)}
                      disabled={updatingId === inv._id}
                      style={{ background:'rgba(30,41,59,0.5)', border:'1px solid rgba(99,102,241,0.15)', borderRadius: '8px', padding: '6px 12px', cursor:'pointer', fontWeight:600, fontSize:'13px', fontFamily:'inherit',
                        color: inv.status==='paid'?'#10b981':inv.status==='overdue'?'#ef4444':inv.status==='pending'?'#f59e0b':'#94a3b8' }}>
                      {['pending','paid','overdue','cancelled'].map(s => (
                        <option key={s} value={s} style={{ background:'#1a1a2e', color: '#e2e8f0' }}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <button onClick={() => generateInvoicePDF(inv, user, currency)} className="btn btn-secondary" style={{ padding:'6px 10px', fontSize:'12px', marginRight: '6px' }}>
                      <MdDownload size={14} /> PDF
                    </button>
                    <button onClick={() => handleDelete(inv._id)} className="btn btn-danger" style={{ padding:'6px 10px', fontSize:'12px' }}>
                      <MdDelete size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Invoices;