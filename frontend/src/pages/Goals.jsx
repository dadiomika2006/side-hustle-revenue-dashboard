import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { MdAdd, MdDelete, MdInfoOutline } from 'react-icons/md';

const Goals = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState([]);
  const [form, setForm] = useState({ name: '', targetAmount: '', frequency: 'monthly', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGoals = async () => {
    try {
      setLoading(true);
      const [goalsRes, progressRes] = await Promise.all([
        api.get('/goals'),
        api.get('/goals/progress')
      ]);
      setGoals(goalsRes.data.goals || []);
      setProgress(progressRes.data.goals || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/goals', {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        frequency: form.frequency,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      });
      setForm({ name: '', targetAmount: '', frequency: 'monthly', startDate: '', endDate: '' });
      setSuccess('Goal added successfully.');
      await loadGoals();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to add goal.');
    }
  };

  const handleRemove = async (goalId) => {
    try {
      await api.delete(`/goals/${goalId}`);
      await loadGoals();
    } catch (err) {
      console.error(err);
      setError('Failed to remove goal.');
    }
  };

  const progressMap = progress.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Track your revenue milestones and stay on target with recurring goals.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Active Goal Progress</h2>
          {loading ? (
            <div className="empty-state">
              <span>Loading goals...</span>
            </div>
          ) : progress.length > 0 ? (
            progress.map(goal => (
              <div key={goal.id} style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>{goal.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{goal.periodLabel} · {goal.frequency}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    {formatMoney(goal.achievedAmount, currency)} / {formatMoney(goal.targetAmount, currency)}
                  </div>
                </div>
                <div style={{ height: '10px', background: 'rgba(148,163,184,0.16)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${goal.progress}%`, minHeight: '10px', background: '#6366f1' }} />
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{goal.progress.toFixed(0)}% achieved</div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <p>No active goals yet.</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Create New Goal</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <label className="input-group">
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Profit target"
                required
              />
            </label>
            <label className="input-group">
              <span>Target Amount</span>
              <input
                type="number"
                name="targetAmount"
                value={form.targetAmount}
                onChange={handleChange}
                placeholder="5000"
                min="0"
                required
              />
            </label>
            <label className="input-group">
              <span>Frequency</span>
              <select name="frequency" value={form.frequency} onChange={handleChange}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <label className="input-group">
              <span>Start Date</span>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
            </label>
            <label className="input-group">
              <span>End Date</span>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
            </label>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <MdAdd size={18} /> Add Goal
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Your Current Goals</h2>
        {goals.length > 0 ? (
          goals.map(goal => (
            <div key={goal._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(99,102,241,0.08)', padding: '14px 0' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>{goal.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{goal.frequency} · Target {formatMoney(goal.targetAmount, currency)}</div>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => handleRemove(goal._id)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdDelete size={16} /> Remove
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <MdInfoOutline size={28} />
            <p>No goals created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
