import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { MdPerson, MdEmail, MdBusiness, MdLock } from 'react-icons/md';

const Settings = () => {
  const { user, logout, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    businessName: user?.businessName || '',
    currency: user?.currency || 'USD',
    themeMode: user?.themeMode || 'dark',
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        businessName: user.businessName || '',
        currency: user.currency || 'USD',
        themeMode: user.themeMode || 'dark'
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const updateData = {
      name: formData.name,
      email: formData.email,
      businessName: formData.businessName,
      currency: formData.currency,
      themeMode: formData.themeMode
    };

    if (formData.password) {
      updateData.password = formData.password;
    }

    try {
      await updateProfile(updateData);
      setSuccess('✓ Profile updated! Changes applied immediately.');
      setError('');
      setFormData({
        ...formData,
        password: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile.');
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', icon: MdPerson, placeholder: 'Your name' },
    { name: 'email', label: 'Email Address', type: 'email', icon: MdEmail, placeholder: 'your@email.com' },
    { name: 'businessName', label: 'Business Name', type: 'text', icon: MdBusiness, placeholder: 'My Freelance Studio' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px' }}>
        {/* Profile Card */}
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile</h2>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.12)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#e2e8f0' }}>{user?.name}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{user?.email}</div>
              {user?.businessName && <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '2px', fontWeight: 600 }}>{user.businessName}</div>}
            </div>
          </div>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {fields.map(({ name, label, type, icon: Icon, placeholder }) => (
              <div className="form-group" key={name}>
                <label className="form-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', fontSize: '18px', pointerEvents: 'none' }} />
                  <input name={name} type={type} value={formData[name]} onChange={handleChange} className="form-input" style={{ paddingLeft: '42px' }} placeholder={placeholder} />
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Preferences</div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} className="form-input" style={{ paddingLeft: '14px' }}>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
                <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '6px', fontWeight: 600 }}>Selected: {formData.currency}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Theme Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {['dark', 'light'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, themeMode: mode })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formData.themeMode === mode ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.2)',
                        background: formData.themeMode === mode ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: '#e2e8f0',
                        fontWeight: formData.themeMode === mode ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontSize: '13px'
                      }}
                    >
                      {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <MdLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', fontSize: '18px', pointerEvents: 'none' }} />
                  <input name="password" type="password" value={formData.password} onChange={handleChange} className="form-input" style={{ paddingLeft: '42px' }} placeholder="Leave blank to keep current" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <MdLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', fontSize: '18px', pointerEvents: 'none' }} />
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="form-input" style={{ paddingLeft: '42px' }} placeholder="Confirm new password" />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Save Changes
            </button>
          </form>
        </div>

        {/* App Info + Danger Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App Info</h2>
            {[['Version', '1.0.0'], ['Backend', 'Express + MongoDB'], ['Frontend', 'React + Vite']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>{k}</span>
                <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Danger Zone</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Once you sign out, you'll need your credentials to log back in.</p>
            <button onClick={logout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
              Sign Out of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;