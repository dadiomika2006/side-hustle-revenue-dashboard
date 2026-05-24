const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Hijack require for mongoose if running in local database fallback mode
const Module = require('module');
const originalRequire = Module.prototype.require;
const path = require('path');
Module.prototype.require = function (id) {
  if (id === 'mongoose' && process.env.USE_LOCAL_DB === 'true') {
    return originalRequire.call(this, path.join(__dirname, 'utils', 'mockMongoose'));
  }
  return originalRequire.apply(this, arguments);
};

const mongoose = require('mongoose');


// Initialize app
const app = express();

// Middleware
// CORS — allow frontend origin (Vercel in prod, localhost in dev)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://side-hustle-revenue-dashboard.vercel.app',
  process.env.FRONTEND_URL  // e.g. https://side-hustle-app.vercel.app
].filter(Boolean).map(url => url.replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    
    // Check if origin is localhost or Vercel
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    const isVercel = origin.endsWith('.vercel.app');
    const isAllowed = allowedOrigins.includes(origin) || isLocalhost || isVercel;
    
    if (isAllowed) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const mileageRoutes = require('./routes/mileageRoutes');
const exportRoutes = require('./routes/exportRoutes');
const goalRoutes = require('./routes/goalRoutes');
const taxBucketRoutes = require('./routes/taxBucketRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const incomeStreamRoutes = require('./routes/incomeStreamRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/mileage', mileageRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/tax-buckets', taxBucketRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/income-streams', incomeStreamRoutes);

// start scheduled jobs
require('./scheduler/recurringJob');

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    msg: 'Side Hustle Revenue Dashboard API is running 🚀',
    version: '1.0.4',
    deployedAt: '2026-05-24T13:22:00Z',
    databaseMode: process.env.USE_LOCAL_DB === 'true' ? 'Local File' : 'MongoDB Atlas'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({ msg: err.message || 'Internal server error' });
});

// Diagnostic listeners to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
  // In production, you might want to restart the process
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

if (process.env.USE_LOCAL_DB === 'true') {
  mongoose.connect()
    .then(() => {
      console.log('==================================================');
      console.log('🚀 SIDE HUSTLE REVENUE DASHBOARD — OFFLINE LOCAL MODE');
      console.log('📂 Database: Local File System (backend/local_db.json)');
      console.log('🔐 Email OTP: Mock console logger enabled');
      console.log('==================================================');
      
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in Local Mode 🚀`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use. Please kill the other process or use a different port.`);
        } else {
          console.error('Server error:', err);
        }
        process.exit(1);
      });
    });
} else {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected ✅');
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} 🚀`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use. Please kill the other process or use a different port.`);
        } else {
          console.error('Server error:', err);
        }
        process.exit(1);
      });
    })
    .catch(err => {
      console.error('==================================================');
      console.error('❌ MONGODB CONNECTION ERROR:', err.message);
      console.error('💡 TIP: To run the server in Offline/Local Mode without a running MongoDB,');
      console.error('   please set USE_LOCAL_DB=true in your backend .env file.');
      console.error('==================================================');
      process.exit(1);
    });
}
