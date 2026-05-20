import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import mileageApi from '../services/mileageApi';

export default function Mileage() {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ date: '', miles: '', vehicle: '', purpose: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchList(); 
  }, []);

  const fetchList = async () => {
    try {
      const res = await mileageApi.listMileage();
      setList(res.data.mileage || []);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await mileageApi.createMileage({ ...form, date: form.date, miles: Number(form.miles) });
      setForm({ date: '', miles: '', vehicle: '', purpose: '', notes: '' });
      fetchList();
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Mileage Tracker</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Track business trips to auto-calculate tax-deductible travel expenses.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        {/* Log Form Card */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#e2e8f0' }}>🚗 Log Business Trip</h2>
          <form onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Trip Date *</label>
              <input 
                type="date" 
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})} 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Distance (miles) *</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="e.g. 14.5" 
                value={form.miles} 
                onChange={e => setForm({...form, miles: e.target.value})} 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Vehicle Name / Tag</label>
              <input 
                placeholder="e.g. Toyota Prius" 
                value={form.vehicle} 
                onChange={e => setForm({...form, vehicle: e.target.value})} 
                className="form-input" 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Trip Purpose</label>
              <input 
                placeholder="e.g. Client meeting, supply pickup" 
                value={form.purpose} 
                onChange={e => setForm({...form, purpose: e.target.value})} 
                className="form-input" 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Notes (optional)</label>
              <textarea 
                placeholder="Additional trip details..." 
                value={form.notes} 
                onChange={e => setForm({...form, notes: e.target.value})} 
                className="form-input" 
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
              ✓ Log Mileage Entry
            </button>
          </form>
        </div>

        {/* Entries list card */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#e2e8f0' }}>📋 Recent Mileage Logs</h2>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: '32px' }}>📍</div>
              <h3>No mileage logs found</h3>
              <p style={{ maxWidth: '280px', margin: '8px auto 0', fontSize: '13px' }}>Start logging trips to calculate your business deductions.</p>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle &amp; Purpose</th>
                    <th>Miles</th>
                    <th style={{ textAlign: 'right' }}>Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(m => (
                    <tr key={m._id}>
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {new Date(m.date).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{m.purpose || 'Business Trip'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{m.vehicle || 'Default Vehicle'}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#a5b4fc' }}>
                        🚗 {m.miles} mi
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                        {formatMoney(m.miles * (m.rate || 0.67), currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
