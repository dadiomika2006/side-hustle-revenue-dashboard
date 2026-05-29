import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import Calculator from './pages/Calculator.jsx';
import Clients from './pages/Clients.jsx';
import Mileage from './pages/Mileage.jsx';
import CreateInvoice from './pages/CreateInvoice.jsx';
import Products from './pages/Products.jsx';
import Analytics from './pages/Analytics.jsx';
import Goals from './pages/Goals.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Invoices from './pages/Invoices.jsx';
import Reports from './pages/Reports.jsx';
import ExportPage from './pages/Export.jsx';
import Receipts from './pages/Receipts.jsx';
import AdminOverview from './pages/AdminOverview.jsx';
import TaxBuckets from './pages/TaxBuckets.jsx';
import RevenueDashboard from './pages/Dashboard.jsx';
import IncomeStreams from './pages/IncomeStreams.jsx';
import Reminders from './pages/Reminders.jsx';
import Navbar from './components/Navbar.jsx';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  const [showWarmupMsg, setShowWarmupMsg] = React.useState(false);

  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowWarmupMsg(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setShowWarmupMsg(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        {/* Sleek Gradient Spinner */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTop: '3px solid #6366f1',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#e2e8f0' }}>
          Loading your SideHustle Space...
        </span>

        {showWarmupMsg && (
          <div style={{
            maxWidth: '400px',
            marginTop: '24px',
            padding: '24px',
            borderRadius: '16px',
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
            animation: 'fadeIn 0.6s ease-out',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>☁️</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Waking Up Cloud Server</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Our secure MERN database server is currently spinning up from power-saving sleep mode. This first launch takes about 30–50 seconds.
            </p>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#a5b4fc',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'inline-block',
              border: '1px solid rgba(99, 102, 241, 0.1)'
            }}>
              💡 PRO-TIP: Keep this tab open; once loaded, it stays hot!
            </div>
          </div>
        )}
      </div>
    );
  }
  return token ? (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><AddTransaction /></PrivateRoute>} />
      <Route path="/income-streams" element={<PrivateRoute><IncomeStreams /></PrivateRoute>} />
      <Route path="/calculator" element={<PrivateRoute><Calculator /></PrivateRoute>} />
      <Route path="/mileage" element={<PrivateRoute><Mileage /></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
      <Route path="/create-invoices" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
      <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
      <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
      <Route path="/tax-buckets" element={<PrivateRoute><TaxBuckets /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/export" element={<PrivateRoute><ExportPage /></PrivateRoute>} />
      <Route path="/receipts" element={<PrivateRoute><Receipts /></PrivateRoute>} />
      <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminOverview /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/dashboard/revenue" element={<PrivateRoute><RevenueDashboard /></PrivateRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;