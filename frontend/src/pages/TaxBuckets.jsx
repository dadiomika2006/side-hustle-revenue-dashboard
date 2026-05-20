import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { listTaxBuckets, getTaxBucketSummary, createTaxBucket, updateTaxBucket, deleteTaxBucket } from '../services/taxBucketApi.js';

const TaxBuckets = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [buckets, setBuckets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ name: '', percentage: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [bucketsRes, summaryRes] = await Promise.all([listTaxBuckets(), getTaxBucketSummary()]);
      setBuckets(bucketsRes.data.buckets || []);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Unable to load tax buckets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.percentage) {
      setError('Bucket name and percentage are required.');
      return;
    }

    setSaving(true);
    try {
      await createTaxBucket({
        name: form.name,
        percentage: Number(form.percentage),
        category: form.category || 'Other'
      });
      setForm({ name: '', percentage: '', category: '' });
      setSuccess('Tax bucket created successfully.');
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to save tax bucket.');
    } finally {
      setSaving(false);
    }
  };

  const toggleBucket = async (bucket) => {
    try {
      await updateTaxBucket(bucket._id, { active: !bucket.active });
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Unable to update bucket status.');
    }
  };

  const removeBucket = async (id) => {
    if (!window.confirm('Delete this tax bucket?')) return;
    try {
      await deleteTaxBucket(id);
      setSuccess('Tax bucket removed.');
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Unable to delete bucket.');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading tax planning...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tax Buckets</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Set aside funds for tax planning and map expenses to categories.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Tax Planning Summary</h2>
          {summary ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { label: 'Total Income', value: formatMoney(summary.totalIncome, currency) },
                { label: 'Total Set Aside', value: formatMoney(summary.totalSetAside, currency) },
                { label: 'Active Buckets', value: summary.activeBuckets }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                  <span style={{ color: '#94a3b8' }}>{item.label}</span>
                  <strong style={{ color: '#e2e8f0' }}>{item.value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <p>No tax planning summary available.</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Create Bucket</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <label className="form-group">
              <span className="form-label">Bucket Name</span>
              <input className="form-input" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Taxes, Savings, etc." />
            </label>
            <label className="form-group">
              <span className="form-label">Percentage</span>
              <input className="form-input" name="percentage" type="number" min="0" max="100" step="0.1" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} placeholder="10" />
            </label>
            <label className="form-group">
              <span className="form-label">Category</span>
              <input className="form-input" name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Income Tax" />
            </label>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent: 'center' }}>
              {saving ? 'Saving...' : <><MdAdd size={18} /> Save Bucket</>}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Active Tax Buckets</h2>
        {buckets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <p>No tax buckets defined yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {buckets.map(bucket => (
              <div key={bucket._id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', padding: '16px', borderRadius: '14px', background: 'rgba(26,26,46,0.9)', border: '1px solid rgba(99,102,241,0.08)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>{bucket.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{bucket.category || 'Other'}</div>
                    </div>
                    <button type="button" onClick={() => toggleBucket(bucket)} className="btn btn-secondary" style={{ padding: '8px 10px', fontSize: '12px' }}>
                      {bucket.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#94a3b8', fontSize: '13px' }}>
                    <span>{bucket.percentage}% set aside</span>
                    <span>{formatMoney(bucket.recommendedAmount ?? 0, currency)} recommended</span>
                  </div>
                </div>
                <button type="button" onClick={() => removeBucket(bucket._id)} className="btn btn-danger" style={{ justifySelf: 'end', alignSelf: 'start', padding: '10px 12px', fontSize: '12px' }}>
                  <MdDelete size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxBuckets;
