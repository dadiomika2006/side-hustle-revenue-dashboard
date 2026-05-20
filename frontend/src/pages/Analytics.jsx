import React, { useState, useEffect } from 'react';
import { MdAutoGraph, MdStars, MdTrendingUp, MdTrendingDown, MdRemoveCircleOutline } from 'react-icons/md';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';

const Analytics = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, savingsRate: 0 });
  const [streamAnalytics, setStreamAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const fmt = (n) => formatMoney(n, currency, 0, 0);

  useEffect(() => {
    const load = async () => {
      try {
        const [monthly, sum, streamsRes] = await Promise.all([
          api.get('/dashboard/revenue-monthly'),
          api.get('/transactions/summary'),
          api.get('/dashboard/income-streams-analytics')
        ]);
        setMonthlyData(monthly.data);
        setSummary(sum.data);
        setStreamAnalytics(streamsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Loading analytics...</span></div>;

  const summaryCards = [
    { label: 'Total Income', value: fmt(summary.income), color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Expenses', value: fmt(summary.expense), color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Net Balance', value: fmt(summary.balance), color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Savings Rate', value: `${summary.savingsRate}%`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Your financial performance at a glance</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {summaryCards.map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip contentStyle={{ background: '#1e2a45', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', color: '#e2e8f0' }} formatter={v => [fmt(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Monthly Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip contentStyle={{ background: '#1e2a45', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', color: '#e2e8f0' }} formatter={v => [fmt(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Margin Tracker */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdAutoGraph style={{ color: '#6366f1', fontSize: '22px' }} />
            Revenue Status — Side Hustle Breakdown
          </h2>
          {/* Status Legend */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: '🌟 Excellent', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
              { label: '📈 Profitable', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
              { label: '⚡ Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
              { label: '🔴 Loss', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
            ].map(l => (
              <span key={l.label} style={{ fontSize: '11px', fontWeight: 700, color: l.color, background: l.bg, border: `1px solid ${l.border}`, padding: '3px 10px', borderRadius: '99px' }}>{l.label}</span>
            ))}
          </div>
        </div>

        {streamAnalytics.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>No side hustle analytics available. Make sure to define your side hustles and link transactions to them.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Side Hustle</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Net Profit</th>
                  <th>Profit Margin</th>
                  <th>Revenue Status</th>
                </tr>
              </thead>
              <tbody>
                {streamAnalytics.map(s => {
                  const isPositive = s.profit >= 0;
                  // Determine status tier
                  const tier = s.margin >= 60
                    ? { label: 'Excellent', emoji: '🌟', color: '#10b981', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.28)', barColor: 'linear-gradient(90deg,#10b981,#34d399)' }
                    : s.margin >= 30
                    ? { label: 'Profitable', emoji: '📈', color: '#6366f1', bg: 'rgba(99,102,241,0.13)', border: 'rgba(99,102,241,0.28)', barColor: 'linear-gradient(90deg,#6366f1,#a5b4fc)' }
                    : s.margin >= 10
                    ? { label: 'Moderate', emoji: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', barColor: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }
                    : { label: 'At a Loss', emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.13)', border: 'rgba(239,68,68,0.28)', barColor: 'linear-gradient(90deg,#ef4444,#f87171)' };
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color || '#6366f1', display: 'inline-block', boxShadow: `0 0 6px ${s.color || '#6366f1'}66` }} />
                          <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>{fmt(s.income)}</span>
                      </td>
                      <td>
                        <span style={{ color: '#ef4444', fontWeight: 800, background: 'rgba(239,68,68,0.08)', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>{fmt(s.expense)}</span>
                      </td>
                      <td>
                        <span style={{ color: isPositive ? '#a5b4fc' : '#ef4444', fontWeight: 900, background: isPositive ? 'rgba(99,102,241,0.08)' : 'rgba(239,68,68,0.08)', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
                          {isPositive ? '+' : ''}{fmt(s.profit)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 900, fontSize: '15px', color: tier.color, minWidth: '40px' }}>{s.margin}%</span>
                          <div style={{ flex: 1, minWidth: '70px', height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(0, Math.min(100, s.margin))}%`, height: '100%', background: tier.barColor, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '5px 12px', borderRadius: '99px',
                          fontSize: '12px', fontWeight: 700,
                          background: tier.bg,
                          color: tier.color,
                          border: `1px solid ${tier.border}`,
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap'
                        }}>
                          {tier.emoji} {tier.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;