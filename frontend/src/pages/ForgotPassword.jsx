import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';
import { MdEmail, MdLock, MdVerified, MdArrowBack, MdVisibility, MdVisibilityOff, MdVpnKey, MdRefresh } from 'react-icons/md';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  
  // Tab Selection: 'reset' or 'otp_login'
  const [activeTab, setActiveTab] = useState('reset');
  
  // Common states
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verification step: 1 = Enter Email, 2 = Verify OTP & Action
  const [step, setStep] = useState(1);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Clean state when changing tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStep(1);
    setCode('');
    setNewPassword('');
    setError('');
    setMessage('');
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const endpoint = activeTab === 'reset' ? '/auth/forgot-password' : '/auth/otp-login-request';
      const res = await api.post(endpoint, { email: email.trim().toLowerCase() });
      
      setMessage(res.data?.msg || 'Verification code sent to your email.');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(
        err.response?.data?.msg || 
        'Could not send code. Please ensure your email is correct and registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    if (activeTab === 'reset' && newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (activeTab === 'reset') {
        const res = await api.post('/auth/reset-password', {
          email: email.trim().toLowerCase(),
          code,
          newPassword
        });
        setMessage(res.data?.msg || 'Password updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // OTP Login verification
        const res = await api.post('/auth/otp-login-verify', {
          email: email.trim().toLowerCase(),
          code
        });
        const { token, user } = res.data;
        loginWithToken(token, user);
        setMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      }
    } catch (err) {
      setError(
        err.response?.data?.msg || 
        'Verification failed. Please check the code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(26,26,46,0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        
        {/* Back Link */}
        <Link to="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '28px',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.color = '#6366f1'}
        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
        >
          <MdArrowBack size={18} /> Back to Sign In
        </Link>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(15,15,26,0.5)',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '32px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <button
            type="button"
            onClick={() => handleTabChange('reset')}
            disabled={step === 2} // Prevent switching mid-recovery for safety
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'reset' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'none',
              color: activeTab === 'reset' ? '#fff' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: step === 2 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: step === 2 && activeTab !== 'reset' ? 0.5 : 1
            }}
          >
            Reset Password
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('otp_login')}
            disabled={step === 2}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'otp_login' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'none',
              color: activeTab === 'otp_login' ? '#fff' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: step === 2 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: step === 2 && activeTab !== 'otp_login' ? 0.5 : 1
            }}
          >
            Secure OTP Login
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: activeTab === 'reset' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', marginBottom: '16px',
            boxShadow: activeTab === 'reset' ? '0 8px 24px rgba(239,68,68,0.3)' : '0 8px 24px rgba(16,185,129,0.3)'
          }}>
            {activeTab === 'reset' ? <MdVpnKey style={{ color: '#fff' }} /> : <MdVerified style={{ color: '#fff' }} />}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>
            {activeTab === 'reset' ? 'Reset Password' : 'Secure OTP Login'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5 }}>
            {activeTab === 'reset' 
              ? 'Receive a secure 6-digit recovery code to set a new password.' 
              : 'Log in securely without your password via a one-time email code.'
            }
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success" style={{
            marginBottom: '20px',
            background: activeTab === 'reset' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            border: activeTab === 'reset' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
            color: activeTab === 'reset' ? '#f87171' : '#34d399',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '14px'
          }}>
            ✨ {message}
          </div>
        )}

        {/* STEP 1: ENTER EMAIL TO RECEIVE CODE */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <MdEmail style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#6366f1', fontSize: '18px', pointerEvents: 'none'
                }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '15px',
                borderRadius: '12px',
                fontWeight: 600,
                background: activeTab === 'reset' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                boxShadow: 'none'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginRight: '8px'
                  }} />
                  Sending Code...
                </>
              ) : 'Send 6-Digit Code'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY CODE & RUN ACTION */}
        {step === 2 && (
          <form onSubmit={handleAction}>
            {/* Email Label (Informational) */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: '13px',
              color: '#94a3b8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Sending code to: <strong>{email}</strong></span>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontWeight:600, padding:0 }}
              >
                Change
              </button>
            </div>

            {/* OTP Code */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>6-Digit Recovery Code</span>
                {resendCooldown > 0 ? (
                  <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    style={{
                      background: 'none', border: 'none', color: '#6366f1',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                    }}
                  >
                    <MdRefresh size={14} />
                    Resend code
                  </button>
                )}
              </label>
              
              <input
                type="text"
                required
                className="form-input"
                style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  letterSpacing: '8px',
                  padding: '12px',
                  borderRadius: '12px'
                }}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 6) setCode(val);
                }}
                maxLength={6}
                disabled={loading}
              />
            </div>

            {/* New Password (Only shown for Reset Password tab) */}
            {activeTab === 'reset' && (
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <MdLock style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: '#6366f1', fontSize: '18px', pointerEvents: 'none'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input"
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
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
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6 || (activeTab === 'reset' && newPassword.length < 6)}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '15px',
                borderRadius: '12px',
                fontWeight: 600,
                background: activeTab === 'reset' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                boxShadow: code.length === 6 ? '0 4px 20px rgba(99,102,241,0.2)' : 'none'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginRight: '8px'
                  }} />
                  Processing...
                </>
              ) : activeTab === 'reset' ? 'Reset Password' : 'Verify & Sign In'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
