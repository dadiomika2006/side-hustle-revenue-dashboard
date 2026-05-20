import React, { useState, useEffect } from 'react';
import { MdTrendingUp, MdPeople, MdSecurity, MdSwapHoriz, MdAdminPanelSettings } from 'react-icons/md';
import adminApi from '../services/adminApi.js';
import { formatMoney } from '../utils/formatMoney.js';

const AdminOverview = () => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [overviewRes, usersRes] = await Promise.all([
        adminApi.getAdminOverview(),
        adminApi.listUsers()
      ]);
      setOverview(overviewRes.data);
      setUsers(usersRes.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Unable to load admin metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${targetRole.toUpperCase()}?`)) return;
    
    try {
      await adminApi.updateUserRole(userId, targetRole);
      setSuccess(`User role updated to ${targetRole} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      await loadData(); // refresh list
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating user role.');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading admin metrics...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Analytics & Directory</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Platform-wide system usage metrics, revenue metrics, and user permission directory.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Count Metrics Grid */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          {[
            { label: 'Total Platform Users', value: overview.totalUsers, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Total Client Directory', value: overview.totalClients, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
            { label: 'Total Client Invoices', value: overview.totalInvoices, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
            { label: 'Total System Transactions', value: overview.totalTransactions, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Tax Buckets Defined', value: overview.totalTaxBuckets, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Goal Plans Tracked', value: overview.totalGoals, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' }
          ].map((card) => (
            <div key={card.label} className="stat-card" style={{ border: `1px solid ${card.color}22`, background: card.bg }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{card.label}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#e2e8f0' }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* User Directory and Detailed Analytics */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdPeople style={{ color: '#6366f1' }} /> System Registered Users & Engagement
        </h2>
        
        {users.length === 0 ? (
          <div className="empty-state">
            <p>No registered users found.</p>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Business Info</th>
                  <th>Role</th>
                  <th>Gigs</th>
                  <th>Transactions</th>
                  <th>Invoices</th>
                  <th>Lifetime Revenue</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: '#e2e8f0', display: 'block', fontSize: '13px' }}>{u.name}</strong>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>{u.businessName || '—'}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                        background: u.role === 'admin' ? 'rgba(99,102,241,0.18)' : 'rgba(148,163,184,0.1)',
                        color: u.role === 'admin' ? '#a5b4fc' : '#94a3b8',
                        border: u.role === 'admin' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(148,163,184,0.15)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>👥 {u.clientCount}</td>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>💳 {u.transactionCount}</td>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>🧾 {u.invoiceCount}</td>
                    <td style={{ fontWeight: 800, color: '#10b981' }}>
                      {formatMoney(u.totalRevenue || 0, u.currency || 'USD')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => handleRoleToggle(u._id, u.role)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MdAdminPanelSettings size={14} /> 
                        {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Administrative Insights</h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
          As an administrator, you have complete operational visibility over system-wide user growth and total invoices issued. Use the Platform User Directory to manage security roles and oversee transaction volume across standard and premium client accounts. All data aggregates respect encryption models and transaction compliance policies.
        </p>
      </div>
    </div>
  );
};

export default AdminOverview;
