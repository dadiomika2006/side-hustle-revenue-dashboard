import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete, MdEdit, MdTrendingUp, MdSchedule, MdAttachMoney } from 'react-icons/md';
import api from '../services/api';
import ClientDetailModal from '../components/ClientDetailModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';

const Clients = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  
  const [clients, setClients] = useState([]);
  const [margins, setMargins] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const loadData = async () => {
    try {
      const [clientsRes, marginsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/clients/margins')
      ]);
      setClients(clientsRes.data);
      setMargins(marginsRes.data || {});
    } catch {
      setError('Error fetching clients');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/clients', formData);
      setClients([res.data, ...clients]);
      setFormData({ name: '', email: '', phone: '', company: '' });
      setShowForm(false);
      setSuccess('Client added!');
      await loadData(); // refresh margins
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Error adding client');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this client? All associated transactions will remain but be unlinked.')) return;
    try {
      await api.delete(`/clients/${id}`);
      setClients(clients.filter(c => c._id !== id));
      setSuccess('Client removed.');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error deleting client'); }
  };

  const handleOpenModal = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleModalSave = async (updatedClient) => {
    setClients(clients.map(c => c._id === updatedClient._id ? updatedClient : c));
    setShowModal(false);
    setSuccess('Client updated!');
    await loadData(); // refresh stats
    setTimeout(() => setSuccess(''), 3000);
  };

  if (fetchLoading) return <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gigs & Clients</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Track profitability, revenue metrics, and hourly efficiency per gig.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <MdAdd size={18} /> {showForm ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card animate-slide-up" style={{ marginBottom: '24px', maxWidth: '560px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: '#94a3b8' }}>NEW CLIENT</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="jane@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="+1 555 000 0000" />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input name="company" value={formData.company} onChange={handleChange} className="form-input" placeholder="Acme Inc." />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : '✓ Add Client'}
            </button>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 style={{ marginBottom: '8px' }}>No clients yet</h3>
            <p>Add your first client to get started tracking per-gig margins.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Gig / Client</th>
                <th>Company</th>
                <th>Revenue / Expenses</th>
                <th>Profit Margin</th>
                <th>Avg. Hourly Rate</th>
                <th>Added</th>
                <th style={{ textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const clientStat = margins[c._id] || { income: 0, expense: 0, profit: 0, margin: 0, hourlyRate: 0 };
                const marginVal = parseFloat(clientStat.margin);
                
                let marginColor = '#f59e0b'; // yellow
                if (marginVal > 70) marginColor = '#10b981'; // green
                else if (marginVal < 30) marginColor = '#ef4444'; // red

                return (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#6366f1,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight:700, color:'#e2e8f0', display: 'block' }}>{c.name}</span>
                          <span style={{ color:'#94a3b8', fontSize:'11px' }}>{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color:'#e2e8f0', fontSize:'13px', fontWeight:500 }}>{c.company || '—'}</td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                        {formatMoney(clientStat.income, currency)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                        -{formatMoney(clientStat.expense, currency)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                          background: `${marginColor}18`,
                          color: marginColor,
                          border: `1px solid ${marginColor}33`
                        }}>
                          📈 {clientStat.margin}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {clientStat.hourlyRate > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#a5b4fc' }}>
                          ⚡ {formatMoney(clientStat.hourlyRate, currency)}/hr
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '13px' }}>No hours logged</span>
                      )}
                    </td>
                    <td style={{ color:'#94a3b8', fontSize:'12px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign:'right' }}>
                      <button onClick={() => handleOpenModal(c)} className="btn btn-secondary" style={{ padding:'6px 10px', marginRight: '6px' }}>
                        <MdEdit size={14} /> Edit Details
                      </button>
                      <button onClick={() => handleDelete(c._id)} className="btn btn-danger" style={{ padding:'6px 10px' }}>
                        <MdDelete size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <ClientDetailModal 
        client={selectedClient} 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleModalSave} 
      />
    </div>
  );
};

export default Clients;