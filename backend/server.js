const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');

// Initialize app
const app = express();

// Middleware
// CORS — allow frontend origin (Vercel in prod, localhost in dev)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL  // e.g. https://side-hustle-app.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
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
  res.json({ status: 'ok', msg: 'Side Hustle Revenue Dashboard API is running 🚀' });
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
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
