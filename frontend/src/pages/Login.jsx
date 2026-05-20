import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdPhone, MdArrowBack, MdPerson } from 'react-icons/md';
import { sendOtp, verifyOtp } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithToken } = useAuth(); // ← added loginWithToken
  const [formData, setFormData] = useState({ email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');

  // ── OTP state ─────────────────────────────────────────────────────────────
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [otpTarget, setOtpTarget] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  // ─────────────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleLoginMethodChange = (method) => {
    setLoginMethod(method);
    setFormData({
      ...formData,
      email: method === 'email' ? formData.email : '',
      phone: method === 'phone' ? formData.phone : ''
    });
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
    if (err.request) {
      return 'Unable to connect to the server. Please make sure the backend is running.';
    }
    return err.message || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const credentials = loginMethod === 'email'
        ? { email: formData.email, password: formData.password }
        : { phone: formData.phone, password: formData.password };
      await login(credentials);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers ──────────────────────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!otpTarget.trim()) {
      setOtpError('Please enter your email or phone number.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await sendOtp(otpTarget.trim());
      setOtpSent(true);
      setOtpSuccess(res.data.msg);
      startCountdown();
    } catch (err) {
      setOtpError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  // ── FIXED: now uses loginWithToken to update AuthContext ─────────────────
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setOtpError('Please enter the OTP.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await verifyOtp(otpTarget.trim(), otpCode.trim());
      const { token, user } = res.data;
      loginWithToken(token, user); // ← properly updates AuthContext
      navigate('/dashboard');
    } catch (err) {
      setOtpError(getErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleBackToLogin = () => {
    setShowOtpFlow(false);
    setOtpTarget('');
    setOtpCode('');
    setOtpSent(false);
    setOtpError('');
    setOtpSuccess('');
    setCountdown(0);
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

          {/* ── NORMAL LOGIN FORM ─────────────────────────────────── */}
          {!showOtpFlow && (
            <>
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
                {/* Login Method Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => handleLoginMethodChange('email')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px',
                      border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                      background: loginMethod === 'email' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      color: loginMethod === 'email' ? '#6366f1' : '#94a3b8',
                      border: loginMethod === 'email' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    📧 Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoginMethodChange('phone')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px',
                      border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                      background: loginMethod === 'phone' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      color: loginMethod === 'phone' ? '#6366f1' : '#94a3b8',
                      border: loginMethod === 'phone' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    📱 Phone
                  </button>
                </div>

                {/* Email or Phone Input */}
                {loginMethod === 'email' ? (
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
                ) : (
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <MdPhone style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                        color: '#6366f1', fontSize: '18px', pointerEvents: 'none'
                      }} />
                      <input
                        id="phone" name="phone" type="tel"
                        autoComplete="tel" required
                        className="form-input" style={{ paddingLeft: '42px' }}
                        placeholder="+1234567890"
                        value={formData.phone} onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

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

              {/* Forgot Password / OTP */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowOtpFlow(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6366f1', fontSize: '14px', fontWeight: 600,
                    textDecoration: 'underline', padding: '4px'
                  }}
                >
                  Forgot Password? (Use OTP)
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Don't have an account? </span>
                <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, fontSize: '14px' }}>
                  Create one
                </Link>
              </div>
            </>
          )}

          {/* ── OTP FLOW ──────────────────────────────────────────── */}
          {showOtpFlow && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <button
                  type="button" onClick={handleBackToLogin}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', display: 'flex', alignItems: 'center',
                    gap: '6px', fontSize: '14px', padding: '0', marginBottom: '20px'
                  }}
                >
                  <MdArrowBack size={18} /> Back to Login
                </button>
                <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>
                  Forgot Password?
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Enter your email or phone number to receive a one-time OTP
                </p>
              </div>

              {otpError && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                  ⚠️ {otpError}
                </div>
              )}
              {otpSuccess && (
                <div style={{
                  marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981', fontSize: '14px'
                }}>
                  ✅ {otpSuccess}
                </div>
              )}

              {/* Step 1 — Enter email or phone */}
              {!otpSent && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Email or Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <MdPhone style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                        color: '#6366f1', fontSize: '18px', pointerEvents: 'none'
                      }} />
                      <input
                        type="text" className="form-input"
                        style={{ paddingLeft: '42px' }}
                        placeholder="you@example.com or +91XXXXXXXXXX"
                        value={otpTarget}
                        onChange={(e) => { setOtpTarget(e.target.value); if (otpError) setOtpError(''); }}
                      />
                    </div>
                  </div>
                  <button
                    type="button" onClick={handleSendOtp} disabled={otpLoading}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', marginTop: '8px' }}
                  >
                    {otpLoading ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Sending OTP...
                      </>
                    ) : 'Send OTP'}
                  </button>
                </div>
              )}

              {/* Step 2 — Enter OTP */}
              {otpSent && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Enter OTP</label>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px' }}>
                      OTP sent to <strong style={{ color: '#e2e8f0' }}>{otpTarget}</strong>
                    </p>
                    <input
                      type="text" className="form-input"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6} value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); if (otpError) setOtpError(''); }}
                      style={{ letterSpacing: '6px', fontSize: '22px', textAlign: 'center', fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    {countdown > 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                        OTP expires in{' '}
                        <span style={{ color: countdown <= 10 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                          {countdown}s
                        </span>
                      </p>
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                        OTP expired.{' '}
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpCode(''); setOtpError(''); setOtpSuccess(''); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#6366f1', fontWeight: 600, fontSize: '13px',
                            textDecoration: 'underline', padding: '0'
                          }}
                        >
                          Resend OTP
                        </button>
                      </p>
                    )}
                  </div>

                  <button
                    type="button" onClick={handleVerifyOtp}
                    disabled={otpLoading || countdown === 0 || otpCode.length !== 6}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px' }}
                  >
                    {otpLoading ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Verifying...
                      </>
                    ) : 'Verify & Sign In'}
                  </button>
                </div>
              )}
            </div>
          )}
          {/* ──────────────────────────────────────────────────────── */}

        </div>
      </div>
    </div>
  );
};

export default Login;