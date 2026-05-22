import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const getErrorMessage = (err) => {
    if (err.response) {
      const data = err.response.data;
      if (data?.msg) return data.msg;
      if (Array.isArray(data?.errors)) return data.errors[0]?.msg || JSON.stringify(data.errors);
      if (err.response.status === 401) return 'Invalid credentials. Please try again.';
      if (err.response.status >= 500) return 'Server error. Please try again later.';
      return err.response.statusText || 'Invalid credentials. Please try again.';
    }
    if (err.request) return 'Unable to connect to the server. Please make sure the backend is running.';
    return err.message || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.isVerified === false) {
        const emailVal = err.response.data.email || formData.email;
        const msgVal = err.response.data.msg || '';
        navigate(`/verify-email?email=${encodeURIComponent(emailVal)}&msg=${encodeURIComponent(msgVal)}`);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Left branding panel */}
      <div style={{
        flex: '1', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px', display: window.innerWidth < 768 ? 'none' : 'flex'
      }}>
        <div style={{ maxWidth: '420px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)'
          }}>💰</div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>
            Track your<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              side hustle
            </span><br />
            revenue
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.7 }}>
            Manage clients, invoices, and transactions in one professional dashboard built for freelancers.
          </p>
          <div style={{ display: 'flex', gap: '24px', marginTop: '40px' }}>
            {[['💼', 'Clients'], ['🧾', 'Invoices'], ['📊', 'Analytics']].map(([icon, label]) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '16px', borderRadius: '12px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
                minWidth: '80px'
              }}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{
        width: '100%', maxWidth: '460px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
        borderLeft: '1px solid rgba(99,102,241,0.1)'
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Welcome back</h2>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>Sign in to your dashboard</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '24px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <MdEmail style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#6366f1', fontSize: '18px', pointerEvents: 'none'
                }} />
                <input
                  id="email" name="email" type="email"
                  autoComplete="email" required
                  className="form-input" style={{ paddingLeft: '42px' }}
                  placeholder="you@example.com"
                  value={formData.email} onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <MdLock style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#6366f1', fontSize: '18px', pointerEvents: 'none'
                }} />
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" required
                  className="form-input"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  placeholder="••••••••"
                  value={formData.password} onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: '4px', display: 'flex'
                  }}
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', marginBottom: '16px' }}>
              <Link to="/forgot-password" style={{ color: '#6366f1', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = '#818cf8'}
                onMouseLeave={(e) => e.target.style.color = '#6366f1'}
              >
                Forgot Password or Secure OTP Login?
              </Link>
            </div>

            <button
              id="login-btn" type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, fontSize: '14px' }}>
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;