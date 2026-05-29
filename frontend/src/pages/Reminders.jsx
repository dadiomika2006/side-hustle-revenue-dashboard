import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MdNotificationsActive, MdRadioButtonUnchecked, MdCheckCircle, MdDelete, MdAdd, MdAccessTime } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('task');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reminders');
      setReminders(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError('Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.post('/reminders', {
        title: newTitle,
        description: newDesc || undefined,
        type: newType,
        dueDate: newDueDate ? new Date(newDueDate) : new Date(Date.now() + 24 * 60 * 60 * 1000) // Default tomorrow
      });
      setReminders([res.data, ...reminders]);
      setNewTitle('');
      setNewDesc('');
      setNewType('task');
      setNewDueDate('');
      setSuccess('✓ Reminder added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding reminder:', err);
      setError('Failed to add reminder. Please try again.');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/reminders/${id}`);
      setReminders(reminders.map(r => r._id === id ? res.data : r));
    } catch (err) {
      console.error('Error toggling reminder:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder permanently?')) return;
    try {
      await api.delete(`/reminders/${id}`);
      setReminders(reminders.filter(r => r._id !== id));
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Reminders &amp; Task Center</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Organize business tasks, set tax check-ins, and manage critical reminders.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 992 ? '1fr' : '1.2fr 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Create Reminder Card */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdAdd size={20} style={{ color: '#6366f1' }} /> Create New Task
          </h2>

          <form onSubmit={handleAdd} style={{ display: 'grid', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Task Title <span style={{ color: '#f87171' }}>*</span></label>
              <input 
                type="text" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                placeholder="e.g. Pay Q2 estimated taxes" 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)} 
                placeholder="Details or specific notes about this task..." 
                className="form-input" 
                rows="3" 
                style={{ resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={newType} onChange={e => setNewType(e.target.value)} className="form-input">
                  <option value="task">General Task</option>
                  <option value="invoice">Invoice Follow-up</option>
                  <option value="tax">Tax Preparation</option>
                  <option value="weekly">Weekly Checklist</option>
                  <option value="mileage">Mileage Log</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  value={newDueDate} 
                  onChange={e => setNewDueDate(e.target.value)} 
                  className="form-input" 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              Create Task
            </button>
          </form>
        </div>

        {/* Task List Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MdNotificationsActive size={20} style={{ color: '#f59e0b' }} /> Outstanding Tasks ({activeReminders.length})
            </h2>
            <button 
              onClick={loadReminders} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              disabled={loading}
            >
              🔄 Sync
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : reminders.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: '32px' }}>🎉</div>
              <h3>All caught up!</h3>
              <p style={{ maxWidth: '280px', margin: '8px auto 0', fontSize: '13px' }}>No active tasks or reminders. Use the left panel to schedule new ones.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              
              {/* Outstanding Reminders */}
              {activeReminders.map(rem => (
                <div key={rem._id} style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  padding: '16px', borderRadius: '12px',
                  background: 'rgba(30,41,59,0.3)',
                  border: '1px solid rgba(245,158,11,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleToggle(rem._id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f59e0b', display: 'flex', padding: 0, marginTop: '2px' }}
                    >
                      <MdRadioButtonUnchecked size={20} />
                    </button>
                    <div>
                      <span style={{ fontWeight: 700, color: '#e2e8f0', display: 'block', fontSize: '14px' }}>{rem.title}</span>
                      {rem.description && <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>{rem.description}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                          {rem.type}
                        </span>
                        {rem.dueDate && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MdAccessTime size={12} /> Due {new Date(rem.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {rem.link && (
                      <Link to={rem.link} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Resolve →
                      </Link>
                    )}
                    <button onClick={() => handleDelete(rem._id)} className="btn btn-danger" style={{ padding: '6px' }}>
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Completed Reminders */}
              {completedReminders.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    ✓ Completed Tasks ({completedReminders.length})
                  </h3>
                  <div style={{ display: 'grid', gap: '10px', opacity: 0.6 }}>
                    {completedReminders.map(rem => (
                      <div key={rem._id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: '12px',
                        background: 'rgba(30,41,59,0.15)',
                        border: '1px solid rgba(255,255,255,0.04)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <button 
                            type="button" 
                            onClick={() => handleToggle(rem._id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#10b981', display: 'flex', padding: 0 }}
                          >
                            <MdCheckCircle size={20} />
                          </button>
                          <div>
                            <span style={{ fontWeight: 700, color: '#94a3b8', textDecoration: 'line-through', fontSize: '13px' }}>{rem.title}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(rem._id)} className="btn btn-danger" style={{ padding: '6px' }}>
                          <MdDelete size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
