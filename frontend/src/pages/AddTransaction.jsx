import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdDelete, MdAutorenew, MdHistory } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';

const CATEGORIES = ['salary', 'freelance', 'business', 'rent', 'utilities', 'groceries', 'transportation', 'entertainment', 'other'];
const TAX_CATEGORIES = [
  'Advertising',
  'Car & Truck Expenses',
  'Commissions & Fees',
  'Contract Labor',
  'Insurance',
  'Legal & Professional Services',
  'Office Expense',
  'Rent or Lease (Vehicles/Real Estate)',
  'Repairs & Maintenance',
  'Supplies',
  'Taxes & Licenses',
  'Travel & Meals',
  'Utilities',
  'Other Business Expenses'
];
const PAYMENT_METHODS = ['cash', 'bank', 'card', 'online'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];

const AddTransaction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const baseCurrency = user?.currency || 'INR';
  
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'recurring-rules', or 'history'
  const [clients, setClients] = useState([]);
  const [incomeStreams, setIncomeStreams] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [recurringRules, setRecurringRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [filterType, setFilterType] = useState('all');
  const [filterStream, setFilterStream] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    client: '',
    incomeStream: '',
    receipt: '',
    type: 'income',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'freelance',
    taxCategory: 'Office Expense',
    paymentMethod: 'bank',
    currency: baseCurrency,
    hours: '',
    isRecurring: false,
    frequency: 'monthly',
    endDate: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/income-streams').then(res => setIncomeStreams(res.data)).catch(() => {});
    api.get('/receipts').then(res => setReceipts(res.data?.receipts || [])).catch(() => {});
  }, []);

  const handleAutoPopulateStreams = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const defaults = [
        { name: 'Uber Driving', color: '#10b981', description: 'Gig transport and food delivery' },
        { name: 'Fiverr Freelance', color: '#3b82f6', description: 'Custom contract design & development gigs' },
        { name: 'Etsy Shop', color: '#f59e0b', description: 'Handcrafted products and retail items' },
        { name: 'YouTube Channel', color: '#ef4444', description: 'Ad revenue and product sponsorships' }
      ];
      const promises = defaults.map(d => api.post('/income-streams', d));
      const results = await Promise.all(promises);
      setIncomeStreams(results.map(r => r.data));
      setSuccess('✓ Auto-populated default side hustles successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to auto-populate default side hustles.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecurringRules = async () => {
    setRulesLoading(true);
    try {
      const res = await api.get('/recurring');
      setRecurringRules(res.data.recurring || []);
    } catch {
      setError('Failed to load recurring entries.');
    } finally {
      setRulesLoading(false);
    }
  };

  const loadTransactions = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/transactions', { params: { limit: 100 } });
      setTransactions(res.data.transactions || []);
    } catch {
      setError('Failed to load transaction history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recurring-rules') {
      loadRecurringRules();
    } else if (activeTab === 'history') {
      loadTransactions();
    }
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        client: formData.client || undefined,
        incomeStream: formData.incomeStream || undefined,
        receipt: formData.receipt || undefined,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        currency: formData.currency,
        hours: formData.hours ? parseFloat(formData.hours) : undefined,
        taxCategory: formData.type === 'expense' ? formData.taxCategory : undefined
      };

      if (formData.isRecurring) {
        if (!formData.client) {
          setError('A client/gig is required for recurring transaction templates.');
          setLoading(false);
          return;
        }
        // Submit to recurring rules endpoint
        const recPayload = {
          ...payload,
          startDate: formData.date,
          frequency: formData.frequency,
          endDate: formData.endDate || undefined
        };
        await api.post('/recurring', recPayload);
        setSuccess('✓ Recurring transaction template created successfully!');
        
        // Reset recurring parts
        setFormData({
          ...formData,
          amount: '',
          description: '',
          hours: '',
          isRecurring: false
        });
      } else {
        // Submit to standard transactions endpoint
        await api.post('/transactions', payload);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Error saving transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Cancel this recurring transaction template?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      setRecurringRules(recurringRules.filter(r => r._id !== id));
      setSuccess('Recurring rule cancelled.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error cancelling recurring rule.');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction entry? This cannot be undone.')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter(t => t._id !== id));
      setSuccess('✓ Transaction removed successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error deleting transaction.');
    }
  };

  const handleAssignStream = async (txId, streamId) => {
    try {
      const res = await api.put(`/transactions/${txId}`, { incomeStream: streamId || '' });
      setTransactions(transactions.map(t => t._id === txId ? { ...t, incomeStream: res.data.incomeStream } : t));
      setSuccess('✓ Stream assigned successfully! Refresh dashboard to see updated chart.');
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Failed to assign stream.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Transactions</h1>
        
        <div style={{ display: 'flex', background: 'rgba(30,41,59,0.7)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('add')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              background: activeTab === 'add' ? '#6366f1' : 'transparent',
              color: activeTab === 'add' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <MdAdd size={16} /> Log Entry
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('recurring-rules')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              background: activeTab === 'recurring-rules' ? '#6366f1' : 'transparent',
              color: activeTab === 'recurring-rules' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <MdAutorenew size={16} /> Recurring Rules
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              background: activeTab === 'history' ? '#6366f1' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            📋 Audit History
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {activeTab === 'add' ? (
        <div style={{ maxWidth: '640px' }}>
          <div className="card">
            <form onSubmit={handleSubmit}>
              {/* Type Toggle */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Transaction Type</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['income', 'expense'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setFormData({ ...formData, type: t })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                        fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s ease',
                        background: formData.type === t
                          ? t === 'income' ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'
                          : 'rgba(30,42,69,0.5)',
                        color: formData.type === t
                          ? t === 'income' ? '#10b981' : '#ef4444'
                          : '#94a3b8',
                        border: formData.type === t
                          ? `1px solid ${t === 'income' ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`
                          : '1px solid rgba(99,102,241,0.12)',
                      }}>
                      {t === 'income' ? '📈 Income / Revenue' : '📉 Business Expense'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client, Income Stream & Currency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Client / Gig (optional)</label>
                  <select name="client" value={formData.client} onChange={handleChange} className="form-input">
                    <option value="">None / General</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Side Hustle / Stream</label>
                  <select name="incomeStream" value={formData.incomeStream} onChange={handleChange} className="form-input" style={{ marginBottom: incomeStreams.length === 0 ? '4px' : 'inherit' }}>
                    <option value="">None / General</option>
                    {incomeStreams.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {incomeStreams.length === 0 && (
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                      No streams? <button type="button" onClick={handleAutoPopulateStreams} style={{ background: 'none', border: 'none', color: '#a5b4fc', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontWeight: 'bold' }}>Auto-populate defaults</button>
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="form-input">
                    {CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                  </select>
                </div>
              </div>

              {/* Amount, Hours & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: formData.type === 'income' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input name="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={handleChange} className="form-input" placeholder="0.00" required />
                </div>
                
                {formData.type === 'income' && (
                  <div className="form-group">
                    <label className="form-label">Hours Logged (optional)</label>
                    <input name="hours" type="number" min="0" step="0.1" value={formData.hours} onChange={handleChange} className="form-input" placeholder="e.g. 5.5" />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input name="date" type="date" value={formData.date} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              {/* Category, Tax Category & Payment Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">General Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="form-input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                
                {formData.type === 'expense' ? (
                  <div className="form-group">
                    <label className="form-label">Tax Category (Schedule C)</label>
                    <select name="taxCategory" value={formData.taxCategory} onChange={handleChange} className="form-input">
                      {TAX_CATEGORIES.map(tc => <option key={tc} value={tc}>{tc}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="form-input">
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* If Expense, display normal payment method below */}
              {formData.type === 'expense' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="form-input">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
              )}

              {/* Attach Receipt */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Attach Uploaded Receipt (optional)</label>
                <select name="receipt" value={formData.receipt} onChange={handleChange} className="form-input">
                  <option value="">No receipt attached</option>
                  {receipts.map(r => (
                    <option key={r._id} value={r._id}>
                      📁 {r.originalName} ({Math.round(r.size / 1024)} KB)
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Description (optional)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows={2} placeholder="What was this transaction for?" style={{ resize: 'vertical' }} />
              </div>

              {/* Recurring Switch */}
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#e2e8f0', display: 'block' }}>🔄 Make it a Recurring Template</strong>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Automatically log this transaction on a repeat cycle.</span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                    <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: formData.isRecurring ? '#6366f1' : '#475569',
                      borderRadius: '34px', transition: '0.3s ease',
                      boxShadow: formData.isRecurring ? '0 0 10px rgba(99,102,241,0.5)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                        background: '#ffffff', borderRadius: '50%', transition: '0.3s ease',
                        transform: formData.isRecurring ? 'translateX(22px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="animate-slide-down" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Frequency</label>
                      <select name="frequency" value={formData.frequency} onChange={handleChange} className="form-input">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date (optional)</label>
                      <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="form-input" />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '14px', padding: '12px' }}>
                  {loading ? 'Saving...' : formData.isRecurring ? '✓ Create Recurring Template' : '✓ Log Transaction'}
                </button>
                <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '12px 18px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : activeTab === 'recurring-rules' ? (
        /* Recurring templates listing tab */
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdAutorenew style={{ color: '#6366f1' }} /> Active Recurring Templates
          </h2>
          
          {rulesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : recurringRules.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">🔄</div>
              <h3>No recurring entries defined</h3>
              <p style={{ maxWidth: '320px', margin: '8px auto 0' }}>Log a transaction above and enable the "Make it a Recurring Template" option to auto-generate templates.</p>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Frequency</th>
                    <th>Next Run Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringRules.map(rule => (
                    <tr key={rule._id}>
                      <td>
                        <span style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                          background: rule.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: rule.type === 'income' ? '#10b981' : '#ef4444'
                        }}>
                          {rule.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#e2e8f0' }}>
                        {clients.find(c => c._id === rule.client)?.name || rule.client || '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: rule.type === 'income' ? '#10b981' : '#ef4444' }}>
                        {formatMoney(rule.amount, rule.currency || baseCurrency)}
                      </td>
                      <td style={{ color: '#a5b4fc', textTransform: 'capitalize', fontSize: '13px', fontWeight: 600 }}>
                        ⏳ {rule.frequency}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {new Date(rule.nextRunDate).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" onClick={() => handleDeleteRule(rule._id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>
                          <MdDelete size={14} /> Cancel Template
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Audit History tab */
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Transaction Audit History
            </h2>
            <button onClick={loadTransactions} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              🔄 Refresh List
            </button>
          </div>

          {/* Filters Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
            padding: '14px',
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            borderRadius: '12px'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Search Details</label>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search logs..." 
                className="form-input" 
                style={{ padding: '6px 10px', fontSize: '13px', marginBottom: 0 }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Type</label>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)} 
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px', marginBottom: 0, height: '34px' }}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Side Hustle</label>
              <select 
                value={filterStream} 
                onChange={e => setFilterStream(e.target.value)} 
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px', marginBottom: 0, height: '34px' }}
              >
                <option value="all">All Hustles</option>
                {incomeStreams.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Client / Gig</label>
              <select 
                value={filterClient} 
                onChange={e => setFilterClient(e.target.value)} 
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px', marginBottom: 0, height: '34px' }}
              >
                <option value="all">All Clients</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {historyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">📋</div>
              <h3>No logged transactions</h3>
              <p style={{ maxWidth: '320px', margin: '8px auto 0' }}>Log an entry on the first tab to build your transaction history.</p>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Side Hustle</th>
                    <th>Client / Gig</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Receipt</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(t => {
                      const matchesType = filterType === 'all' || t.type === filterType;
                      const matchesStream = filterStream === 'all' || (t.incomeStream?._id || t.incomeStream) === filterStream;
                      const matchesClient = filterClient === 'all' || (t.client?._id || t.client) === filterClient;
                      const matchesSearch = !searchQuery || 
                        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (t.client?.name && t.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (t.incomeStream?.name && t.incomeStream.name.toLowerCase().includes(searchQuery.toLowerCase()));
                      return matchesType && matchesStream && matchesClient && matchesSearch;
                    })
                    .map(t => (
                      <tr key={t._id}>
                        <td style={{ color: '#94a3b8', fontSize: '13px' }}>
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                            background: t.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: t.type === 'income' ? '#10b981' : '#ef4444'
                          }}>
                            {t.type}
                          </span>
                        </td>
                        <td>
                          {/* ── Inline Stream Assignment ── */}
                          {t.incomeStream ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                background: `${t.incomeStream.color}22`,
                                color: t.incomeStream.color,
                                border: `1px solid ${t.incomeStream.color}44`
                              }}>
                                {t.incomeStream.name}
                              </span>
                              {/* Re-assign button */}
                              <select
                                defaultValue={t.incomeStream._id || t.incomeStream}
                                onChange={e => handleAssignStream(t._id, e.target.value)}
                                title="Re-assign stream"
                                style={{
                                  fontSize: '10px', padding: '2px 4px', borderRadius: '5px', cursor: 'pointer',
                                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                  color: '#a5b4fc', fontFamily: 'inherit', maxWidth: '80px'
                                }}
                              >
                                <option value="">— None</option>
                                {incomeStreams.map(s => (
                                  <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '11px', color: '#ef4444', fontWeight: 700,
                                background: 'rgba(239,68,68,0.1)', padding: '3px 7px',
                                borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)',
                                whiteSpace: 'nowrap'
                              }}>⚠ Unassigned</span>
                              <select
                                defaultValue=""
                                onChange={e => { if (e.target.value) handleAssignStream(t._id, e.target.value); }}
                                style={{
                                  fontSize: '11px', padding: '3px 6px', borderRadius: '6px', cursor: 'pointer',
                                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                  color: '#10b981', fontFamily: 'inherit', fontWeight: 700
                                }}
                              >
                                <option value="">+ Assign stream</option>
                                {incomeStreams.map(s => (
                                  <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {t.client?.name || '—'}
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.description}>
                          {t.description || '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                          {formatMoney(t.amount, t.currency || baseCurrency)}
                        </td>
                        <td>
                          {t.receipt ? (
                            <a 
                              href={`/api/receipts/${t.receipt._id || t.receipt}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              📄 View File
                            </a>
                          ) : (
                            <span style={{ color: '#475569', fontSize: '12px' }}>None</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button type="button" onClick={() => handleDeleteTransaction(t._id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>
                            <MdDelete size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddTransaction;