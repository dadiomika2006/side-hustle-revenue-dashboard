import React, { useState, useEffect } from 'react';
import { MdTrendingUp, MdAdd, MdEdit, MdDelete, MdLink, MdColorLens, MdAddCircleOutline, MdClose } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
];

const IncomeStreams = () => {
  const { user } = useAuth();
  
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    color: '#6366f1',
    description: '',
    platformUrl: ''
  });

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/income-streams');
      setStreams(res.data || []);
    } catch (err) {
      setError('Failed to fetch income streams.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoPopulate = async () => {
    setLoading(true);
    setError('');
    try {
      const defaults = [
        { name: 'Uber Driving', color: '#10b981', description: 'Gig transport and food delivery' },
        { name: 'Fiverr Freelance', color: '#3b82f6', description: 'Custom contract design & development gigs' },
        { name: 'Etsy Shop', color: '#f59e0b', description: 'Handcrafted products and retail items' },
        { name: 'YouTube Channel', color: '#ef4444', description: 'Ad revenue and product sponsorships' }
      ];
      const promises = defaults.map(d => api.post('/income-streams', d));
      const results = await Promise.all(promises);
      setStreams(results.map(r => r.data));
      setSuccess('✓ Auto-populated default side hustles successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to auto-populate default side hustles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handlePresetColor = (color) => {
    setForm({ ...form, color });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError('Name is required');
      return;
    }

    try {
      if (editingId) {
        const res = await api.put(`/income-streams/${editingId}`, form);
        setStreams(streams.map(s => s._id === editingId ? res.data : s));
        setSuccess('✓ Side hustle updated successfully!');
      } else {
        const res = await api.post('/income-streams', form);
        setStreams([res.data, ...streams]);
        setSuccess('✓ New side hustle created successfully!');
      }
      
      // Reset form
      setForm({ name: '', color: '#6366f1', description: '', platformUrl: '' });
      setShowForm(false);
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error saving income stream.');
    }
  };

  const handleEdit = (stream) => {
    setForm({
      name: stream.name,
      color: stream.color || '#6366f1',
      description: stream.description || '',
      platformUrl: stream.platformUrl || ''
    });
    setEditingId(stream._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income stream? Transactions associated with this stream will be unassigned.')) return;
    try {
      await api.delete(`/income-streams/${id}`);
      setStreams(streams.filter(s => s._id !== id));
      setSuccess('✓ Side hustle removed.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error deleting income stream.');
    }
  };

  const handleCancel = () => {
    setForm({ name: '', color: '#6366f1', description: '', platformUrl: '' });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Side Hustles &amp; Income Streams</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Create and manage custom revenue streams (e.g. Uber, Etsy Shop, YouTube) to track your margins.</p>
        </div>
        
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdAddCircleOutline size={18} /> Add Custom Stream
          </button>
        )}
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {showForm && (
        <div className="card animate-slide-up" style={{ maxWidth: '640px', marginBottom: '28px', border: `1px solid rgba(99, 102, 241, 0.25)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0' }}>
              {editingId ? '✏️ Edit Side Hustle' : '✨ Define New Side Hustle'}
            </h2>
            <button onClick={handleCancel} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <MdClose size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Side Hustle Name *</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="e.g. Etsy Shop, Uber Driving, Medium Writing" 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Platform URL (optional)</label>
              <input 
                name="platformUrl" 
                value={form.platformUrl} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="e.g. https://www.etsy.com/shop/yourname" 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Description (optional)</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                className="form-input" 
                rows={2} 
                placeholder="What is this side hustle about?" 
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdColorLens /> Color Code / Theme Accent
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetColor(preset)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px', border: form.color === preset ? '2.5px solid #ffffff' : '1px solid rgba(255,255,255,0.15)',
                      background: preset, cursor: 'pointer', transform: form.color === preset ? 'scale(1.15)' : 'none',
                      transition: 'all 0.15s ease', boxShadow: form.color === preset ? `0 0 10px ${preset}` : 'none'
                    }}
                  />
                ))}
                
                {/* Custom Color Input */}
                <input 
                  type="color" 
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: 'transparent', cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {editingId ? '✓ Save Changes' : '✓ Create Stream'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
          <span style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>Loading side hustles...</span>
        </div>
      ) : streams.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
          <h3 style={{ fontSize: '18px', color: '#e2e8f0', fontWeight: 700 }}>No side hustles defined</h3>
          <p style={{ color: '#94a3b8', maxWidth: '380px', margin: '8px auto 20px', fontSize: '14px' }}>
            Set up your custom income channels first to assign transactions and visualize profit margins per hustle.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              + Define Custom Hustle
            </button>
            <button onClick={handleAutoPopulate} className="btn btn-secondary" style={{ background: 'rgba(99,102,241,0.15)', borderColor: '#6366f1' }}>
              ⚡ Auto-Populate Defaults
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {streams.map(stream => (
            <div 
              key={stream._id} 
              className="card"
              style={{
                position: 'relative',
                borderLeft: `5px solid ${stream.color || '#6366f1'}`,
                background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.85) 100%)',
                boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 10px 25px rgba(0,0,0,0.35), 0 0 10px ${stream.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.25)`;
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                  {stream.name}
                </h3>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleEdit(stream)} 
                    style={{
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: '6px', color: '#a5b4fc', cursor: 'pointer', padding: '6px',
                      display: 'flex', alignItems: 'center', transition: 'all 0.15s ease'
                    }}
                    title="Edit Side Hustle"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(stream._id)} 
                    style={{
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: '6px', color: '#fca5a5', cursor: 'pointer', padding: '6px',
                      display: 'flex', alignItems: 'center', transition: 'all 0.15s ease'
                    }}
                    title="Delete Side Hustle"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {stream.description ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px', minHeight: '36px' }}>
                  {stream.description}
                </p>
              ) : (
                <p style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', marginBottom: '16px', minHeight: '36px' }}>
                  No description provided.
                </p>
              )}

              {stream.platformUrl && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', alignItems: 'center' }}>
                  <a 
                    href={stream.platformUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                      color: stream.color || '#6366f1', textDecoration: 'none', fontWeight: 700,
                      letterSpacing: '0.02em', background: `${stream.color}12`, padding: '4px 10px',
                      borderRadius: '6px', border: `1px solid ${stream.color}25`
                    }}
                  >
                    <span style={{ fontSize: '10px' }}>🔗</span> Platform Workspace
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomeStreams;
