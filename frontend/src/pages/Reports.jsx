import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import moment from 'moment';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';

const fmt = (n, currency = 'USD') => formatMoney(n || 0, currency, 0, 0);

const Reports = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [reportType, setReportType] = useState('revenue');
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, savingsRate: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [monthlyRes, summaryRes, txRes] = await Promise.all([
          api.get('/dashboard/revenue-monthly'),
          api.get('/transactions/summary'),
          api.get('/transactions', { params: { limit: 10 } })
        ]);
        setData(monthlyRes.data);
        setSummary(summaryRes.data);
        setTransactions(txRes.data?.transactions || txRes.data || []);
      } catch (err) {
        setError('Failed to load report data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /><span>Loading reports...</span></div>;

  const summaryCards = [
    { label: 'Total Revenue', value: fmt(summary.income, currency), color: '#10b981' },
    { label: 'Total Expenses', value: fmt(summary.expense, currency), color: '#ef4444' },
    { label: 'Net Profit', value: fmt(summary.balance, currency), color: summary.balance >= 0 ? '#6366f1' : '#f59e0b' },
    { label: 'Savings Rate', value: `${summary.savingsRate}%`, color: '#f59e0b' },
  ];

  const tooltipStyle = { contentStyle: { background: '#1e2a45', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', color: '#e2e8f0' } };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['revenue', 'breakdown'].map(t => (
            <button key={t} onClick={() => setReportType(t)}
              className={reportType === t ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '13px' }}>
              {t === 'revenue' ? '📈 Revenue' : '📊 Breakdown'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
          {reportType === 'revenue' ? 'Monthly Revenue (This Year)' : 'Monthly Breakdown'}
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          {reportType === 'revenue' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, currency)} />
              <Tooltip {...tooltipStyle} formatter={v => [fmt(v, currency), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <BarChart data={data} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, currency)} />
              <Tooltip {...tooltipStyle} formatter={(v, name) => [fmt(v, currency), name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="expenses" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><p>No transactions yet</p></div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Client</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td style={{ color: '#94a3b8', fontSize: '13px' }}>{moment(tx.date).format('MMM D, YYYY')}</td>
                    <td style={{ color: '#e2e8f0' }}>{tx.description || tx.category || '—'}</td>
                    <td><span className="badge badge-info">{tx.category || '—'}</span></td>
                    <td style={{ color: '#94a3b8', fontSize: '13px' }}>{tx.client?.name || '—'}</td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-danger'}`}>{tx.type}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;