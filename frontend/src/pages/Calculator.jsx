import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { MdTrendingUp, MdSchedule, MdAttachMoney } from 'react-icons/md';

const fmt = (n, currency = 'USD') => formatMoney(n, currency);

const Calculator = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  
  const [activeTab, setActiveTab] = useState('profit'); // 'profit' or 'hourly'
  
  // Profit Calculator States
  const [revenue, setRevenue] = useState('');
  const [expenses, setExpenses] = useState('');
  const [taxRate, setTaxRate] = useState('20');
  const [result, setResult] = useState(null);
  const [profitError, setProfitError] = useState('');

  // Hourly Rate Calculator States
  const [earnings, setEarnings] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyResult, setHourlyResult] = useState(null);
  const [hourlyError, setHourlyError] = useState('');

  const calculateProfit = (e) => {
    e.preventDefault();
    const rev = parseFloat(revenue);
    const exp = parseFloat(expenses);
    const tax = parseFloat(taxRate);
    if (isNaN(rev) || isNaN(exp)) { setProfitError('Please enter valid numbers.'); return; }
    setProfitError('');
    const grossProfit = rev - exp;
    const taxAmount = grossProfit > 0 ? (grossProfit * tax) / 100 : 0;
    const netProfit = grossProfit - taxAmount;
    const margin = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : 0;
    const savingsRate = rev > 0 ? ((grossProfit / rev) * 100).toFixed(1) : 0;
    setResult({ grossProfit, taxAmount, netProfit, margin, savingsRate });
  };

  const calculateHourly = (e) => {
    e.preventDefault();
    const earn = parseFloat(earnings);
    const hrs = parseFloat(hours);
    if (isNaN(earn) || isNaN(hrs) || hrs <= 0) { setHourlyError('Please enter valid income and hours (> 0).'); return; }
    setHourlyError('');
    
    const rate = earn / hrs;
    
    // Benchmark tiers
    let tier = 'Entry / Junior';
    let color = '#f59e0b';
    if (rate >= 150) { tier = 'Elite Expert / Specialist'; color = '#a5b4fc'; }
    else if (rate >= 100) { tier = 'Senior Specialist'; color = '#10b981'; }
    else if (rate >= 50) { tier = 'Mid-Weight Professional'; color = '#6366f1'; }
    
    setHourlyResult({ rate, tier, color, earn, hrs });
  };

  const resetProfit = () => { setRevenue(''); setExpenses(''); setTaxRate('20'); setResult(null); setProfitError(''); };
  const resetHourly = () => { setEarnings(''); setHours(''); setHourlyResult(null); setHourlyError(''); };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Calculators & Planners</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Model business profit margins or check your hourly wage efficiency.</p>
        </div>
        
        <div style={{ display: 'flex', background: 'rgba(30,41,59,0.7)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('profit')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              background: activeTab === 'profit' ? '#6366f1' : 'transparent',
              color: activeTab === 'profit' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <MdAttachMoney size={16} /> Profit Margin
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('hourly')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              background: activeTab === 'hourly' ? '#6366f1' : 'transparent',
              color: activeTab === 'hourly' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <MdSchedule size={16} /> Hourly Rate
          </button>
        </div>
      </div>

      {activeTab === 'profit' ? (
        /* Profit margin calculator */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '840px' }}>
          {/* Inputs */}
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Revenue & Cost Inputs</h2>
            {profitError && <div className="alert alert-error">{profitError}</div>}
            <form onSubmit={calculateProfit}>
              <div className="form-group">
                <label className="form-label">Total Revenue</label>
                <input type="number" min="0" step="0.01" value={revenue} onChange={e => { setRevenue(e.target.value); if (profitError) setProfitError(''); }} className="form-input" placeholder="e.g. 5000" required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Expenses</label>
                <input type="number" min="0" step="0.01" value={expenses} onChange={e => { setExpenses(e.target.value); if (profitError) setProfitError(''); }} className="form-input" placeholder="e.g. 1500" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="form-input" placeholder="20" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  🔢 Calculate Margin
                </button>
                <button type="button" onClick={resetProfit} className="btn btn-secondary">
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Margin Breakdown</h2>
            {!result ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📊</div>
                <p>Enter values and click Calculate</p>
              </div>
            ) : (
              <div>
                {[
                  { label: 'Gross Profit', value: fmt(result.grossProfit, currency), color: result.grossProfit >= 0 ? '#10b981' : '#ef4444' },
                  { label: `Estimated Tax (${taxRate}%)`, value: fmt(result.taxAmount, currency), color: '#f59e0b' },
                  { label: 'Net Profit', value: fmt(result.netProfit, currency), color: result.netProfit >= 0 ? '#6366f1' : '#ef4444', big: true },
                ].map(({ label, value, color, big }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                    <span style={{ fontSize: big ? '15px' : '14px', fontWeight: big ? 800 : 500, color: big ? '#e2e8f0' : '#94a3b8' }}>{label}</span>
                    <span style={{ fontSize: big ? '22px' : '15px', fontWeight: 800, color }}>{value}</span>
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  {[
                    { label: 'Net Profit Margin', value: `${result.margin}%`, good: parseFloat(result.margin) > 20 },
                    { label: 'Savings Index', value: `${result.savingsRate}%`, good: parseFloat(result.savingsRate) > 30 },
                  ].map(({ label, value, good }) => (
                    <div key={label} style={{ padding: '14px', borderRadius: '10px', background: good ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${good ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`, textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: good ? '#10b981' : '#f59e0b' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: result.netProfit > 0 ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${result.netProfit > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                    {result.netProfit > 0 ? `🎉 profitable work structure! High profitability.` : result.netProfit < 0 ? '⚠️ High expense leakages — review margins.' : 'Break-even reached.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Hourly rate calculator */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '840px' }}>
          {/* Inputs */}
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Hourly Inputs</h2>
            {hourlyError && <div className="alert alert-error">{hourlyError}</div>}
            <form onSubmit={calculateHourly}>
              <div className="form-group">
                <label className="form-label">Total Earnings / Project Income</label>
                <input type="number" min="0" step="0.01" value={earnings} onChange={e => { setEarnings(e.target.value); if (hourlyError) setHourlyError(''); }} className="form-input" placeholder="e.g. 1200" required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Time Expended (Hours)</label>
                <input type="number" min="0.1" step="0.1" value={hours} onChange={e => { setHours(e.target.value); if (hourlyError) setHourlyError(''); }} className="form-input" placeholder="e.g. 15" required />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  ⚡ Calculate Hourly Rate
                </button>
                <button type="button" onClick={resetHourly} className="btn btn-secondary">
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Effective Value</h2>
            {!hourlyResult ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">⚡</div>
                <p>Calculate your effective hourly wage to check side-hustle viability.</p>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>EFFECTIVE HOURLY WAGE</div>
                  <div style={{ fontSize: '42px', fontWeight: 800, color: '#6366f1' }}>
                    {fmt(hourlyResult.rate, currency)}/hr
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '12px', margin: '20px 0' }}>
                  {[
                    { label: 'Total Billed Revenue', value: fmt(hourlyResult.earn, currency) },
                    { label: 'Total Hours Contributed', value: `${hourlyResult.hrs} hrs` },
                    { label: 'Professional Tier', value: hourlyResult.tier, badgeColor: hourlyResult.color }
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(99,102,241,0.04)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{row.label}</span>
                      {row.badgeColor ? (
                        <span style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                          background: `${row.badgeColor}18`, color: row.badgeColor
                        }}>
                          {row.value}
                        </span>
                      ) : (
                        <strong style={{ color: '#e2e8f0', fontSize: '14px' }}>{row.value}</strong>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '6px' }}>💡 Pro-Tip Advice</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                    {hourlyResult.rate >= 150 
                      ? 'Incredible! You are operating in the elite specialty tier. Your skills are highly valued. Standardize this package and look for high-value retainers.'
                      : hourlyResult.rate >= 100
                      ? 'Excellent premium rate. Your side hustle provides solid financial security. Aim to delegate minor operational tasks to scale further.'
                      : hourlyResult.rate >= 50
                      ? 'Solid professional rate. To scale this gig, try shifting from hourly pricing to value-based package pricing to double your output.'
                      : 'You are working at a standard entry-level rate. Try focusing on speed and building standard templates to finish the work in less time!'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;