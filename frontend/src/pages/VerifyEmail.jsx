import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';
import { MdEmail, MdVerified, MdRefresh, MdArrowBack } from 'react-icons/md';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  
  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(
    searchParams.get('msg') || 'A verification code has been sent to your email address.'
  );
  const [loading, setLoading] = useState(false);
  
  // Resend code states
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChangeCode = (e) => {
    // Only allow numbers and limit to 6 digits
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 6) {
      setCode(val);
      if (error) setError('');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/verify-email', {
        email: email.trim().toLowerCase(),
        code
      });

      const { token, user } = response.data;
      
      // Save credentials in authentication context
      loginWithToken(token, user);
      
      setMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.msg || 
        err.response?.data?.errors?.[0]?.msg || 
        'Verification failed. Please check the code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please provide your email address first.');
      return;
    }
    
    setResending(true);
    setError('');
    setMessage('');

    try {
      await api.post('/auth/resend-verification', {
        email: email.trim().toLowerCase()
      });
      setMessage('A new 6-digit verification code has been sent to your email.');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to resend verification code.');
    } finally {
      setResending(false);
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
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '10%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
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
          marginBottom: '24px',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.color = '#6366f1'}
        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
        >
          <MdArrowBack size={18} /> Back to Sign In
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
          }}>
            <MdVerified style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>Verify Email</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5 }}>
            To protect your account, we only allow logging in with verified emails.
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
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#34d399',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '14px'
          }}>
            ✨ {message}
          </div>
        )}

        <form onSubmit={handleVerify}>
          {/* Email Input (Visible but disabled if emailParam is provided, editable otherwise) */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <MdEmail style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: '#6366f1', fontSize: '18px', pointerEvents: 'none'
              }} />
              <input
                type="email"
                required
                disabled={!!emailParam}
                className="form-input"
                style={{
                  paddingLeft: '42px',
                  opacity: emailParam ? 0.7 : 1,
                  cursor: emailParam ? 'not-allowed' : 'text'
                }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Verification Code */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>6-Digit Verification Code</span>
              {resendCooldown > 0 ? (
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    background: 'none', border: 'none', color: '#6366f1',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                  }}
                >
                  <MdRefresh size={14} className={resending ? 'animate-spin' : ''} />
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
                borderRadius: '12px',
                textTransform: 'uppercase'
              }}
              placeholder="000000"
              value={code}
              onChange={handleChangeCode}
              maxLength={6}
              disabled={loading}
            />
          </div>

          {/* Master Bypass Helper Info Badge */}
          {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <div style={{
              margin: '-12px 0 20px 0',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              fontSize: '12px',
              color: '#a5b4fc',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              💡 <strong>Instant Access Option:</strong> If your email OTP code is delayed or not received, use master bypass code <strong style={{ color: '#10b981', fontSize: '13px' }}>123456</strong> to instantly verify and continue!
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '15px',
              borderRadius: '12px',
              fontWeight: 600,
              boxShadow: code.length === 6 ? '0 4px 20px rgba(99,102,241,0.3)' : 'none'
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
                Verifying Account...
              </>
            ) : 'Verify & Continue'}
          </button>
        </form>
      </div>
      
      {/* Dynamic spinner animation style for safety */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
