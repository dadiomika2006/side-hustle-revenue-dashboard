import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MdPerson, MdEmail, MdLock, MdBusiness, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    businessName: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await register(formData);
      const emailVal = res?.email || formData.email;
      const msgVal = res?.msg || 'Registration successful. Please verify your email.';
      navigate(`/verify-email?email=${encodeURIComponent(emailVal)}&msg=${encodeURIComponent(msgVal)}`);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%)', padding:'40px 20px' }}>
      <div style={{ width:'100%', maxWidth:'420px', background:'rgba(26,26,46,0.9)', backdropFilter:'blur(20px)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'20px', padding:'40px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'26px', marginBottom:'12px', boxShadow:'0 8px 24px rgba(99,102,241,0.4)' }}>💰</div>
          <h1 style={{ fontSize:'24px', fontWeight:800, marginBottom:'4px' }}>Create Account</h1>
          <p style={{ color:'#94a3b8', fontSize:'14px' }}>Start tracking your side hustle</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position:'relative' }}>
              <MdPerson style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'#6366f1', fontSize:'18px', pointerEvents:'none' }} />
              <input 
                id="name" 
                name="name" 
                type="text" 
                required 
                className="form-input" 
                style={{ paddingLeft:'42px' }} 
                placeholder="John Doe" 
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position:'relative' }}>
              <MdEmail style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'#6366f1', fontSize:'18px', pointerEvents:'none' }} />
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="form-input" 
                style={{ paddingLeft:'42px' }} 
                placeholder="you@example.com" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Business Name */}
          <div className="form-group">
            <label className="form-label">Business Name (optional)</label>
            <div style={{ position:'relative' }}>
              <MdBusiness style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'#6366f1', fontSize:'18px', pointerEvents:'none' }} />
              <input 
                id="businessName" 
                name="businessName" 
                type="text" 
                className="form-input" 
                style={{ paddingLeft:'42px' }} 
                placeholder="My Freelance Studio" 
                value={formData.businessName} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:'relative' }}>
              <MdLock style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'#6366f1', fontSize:'18px', pointerEvents:'none' }} />
              <input 
                id="password" 
                name="password" 
                type={showPassword?'text':'password'} 
                required 
                className="form-input" 
                style={{ paddingLeft:'42px', paddingRight:'42px' }} 
                placeholder="Min. 6 characters" 
                value={formData.password} 
                onChange={handleChange} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px', display:'flex' }}
              >
                {showPassword ? <MdVisibilityOff size={18}/> : <MdVisibility size={18}/>}
              </button>
            </div>
          </div>

          <button 
            id="register-btn" 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary" 
            style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:'15px', marginTop:'4px' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'20px' }}>
          <span style={{ color:'#94a3b8', fontSize:'14px' }}>Already have an account? </span>
          <Link to="/login" style={{ color:'#6366f1', fontWeight:600, fontSize:'14px' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;