import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  MdDashboard, MdSwapHoriz, MdPeople, MdReceipt, MdAddBox,
  MdBarChart, MdAssessment, MdSettings, MdLogout, MdCalculate,
  MdTrendingUp, MdInventory, MdShield
} from 'react-icons/md';

const baseNavItems = [
  { to: '/dashboard',       label: 'Dashboard',     icon: MdDashboard },
  { to: '/transactions',    label: 'Transactions',  icon: MdSwapHoriz },
  { to: '/income-streams',  label: 'Side Hustles',  icon: MdTrendingUp },
  { to: '/mileage',         label: 'Mileage',       icon: MdCalculate },
  { to: '/clients',         label: 'Clients',       icon: MdPeople },
  { to: '/invoices',        label: 'Invoices',      icon: MdReceipt },
  { to: '/create-invoices', label: 'New Invoice',   icon: MdAddBox },
  { to: '/goals',           label: 'Goals',         icon: MdTrendingUp },
  { to: '/tax-buckets',     label: 'Tax Buckets',   icon: MdAssessment },
  { to: '/reports',         label: 'Reports',       icon: MdAssessment },
  { to: '/export',          label: 'Exports',       icon: MdBarChart },
  { to: '/receipts',        label: 'Receipts',      icon: MdInventory },
  { to: '/calculator',      label: 'Calculator',    icon: MdCalculate },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: '260px',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      borderRight: '1px solid rgba(99,102,241,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: '4px 0 24px rgba(0,0,0,0.3)'
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
          }}>💰</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#e2e8f0', lineHeight: 1.2 }}>SideHustle</div>
            <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, letterSpacing: '0.05em' }}>REVENUE DASHBOARD</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px',
            background: 'rgba(99,102,241,0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(99,102,241,0.15)'
          }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, #6366f1, #10b981)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px 4px' }}>
          Main Menu
        </div>
        {[
          ...baseNavItems,
          ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: MdShield }] : [])
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 12px',
              borderRadius: '10px',
              marginBottom: '2px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 500,
              transition: 'all 0.15s ease',
              background: isActive
                ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.15))'
                : 'transparent',
              color: isActive ? '#a5b4fc' : '#94a3b8',
              borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
            })}
          >
            <Icon style={{ fontSize: '18px', flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 12px 20px', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 12px', borderRadius: '10px', marginBottom: '4px',
            textDecoration: 'none', fontSize: '14px',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? '#a5b4fc' : '#94a3b8',
            background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
          })}
        >
          <MdSettings style={{ fontSize: '18px' }} />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 12px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', width: '100%', transition: 'all 0.15s ease',
            fontFamily: 'inherit'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
        >
          <MdLogout style={{ fontSize: '18px' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Navbar;