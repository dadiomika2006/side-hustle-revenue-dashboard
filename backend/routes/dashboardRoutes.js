const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getDashboardStats,
  getRevenueChart,
  getRevenueMonthly,
  getRevenueStatus,
  getTopClients,
  getAdminOverview,
  getIncomeStreamAnalytics,
  injectMockData
} = require('../controllers/dashboardController');
const requireAdmin = require('../middleware/admin');

// All dashboard routes are protected
router.use(auth);

// @route   POST /api/dashboard/inject-mock-data
// @desc    Inject high-end mock data for developer demo and charts visualization
router.post('/inject-mock-data', injectMockData);

// @route   GET /api/dashboard/stats
// @desc    Get overall dashboard statistics
router.get('/stats', getDashboardStats);

// @route   GET /api/dashboard/revenue-chart
// @desc    Get monthly revenue data (labels + data arrays)
router.get('/revenue-chart', getRevenueChart);

// @route   GET /api/dashboard/revenue-monthly
// @desc    Get monthly revenue for recharts LineChart [{month, revenue}]
router.get('/revenue-monthly', getRevenueMonthly);

// @route   GET /api/dashboard/revenue-status
// @desc    Get invoice revenue breakdown by status for PieChart
router.get('/revenue-status', getRevenueStatus);

// @route   GET /api/dashboard/top-clients
// @desc    Get top 5 clients by revenue
router.get('/top-clients', getTopClients);

// @route   GET /api/dashboard/income-streams-analytics
// @desc    Get custom income stream analytics (revenue, expenses, margin)
router.get('/income-streams-analytics', getIncomeStreamAnalytics);

// @route   GET /api/dashboard/admin-overview
// @desc    Get admin overview metrics across the platform
router.get('/admin-overview', requireAdmin, getAdminOverview);

// @route   GET /api/dashboard/revenue
// @desc    Get revenue dashboard page
router.get('/revenue', requireAdmin, (req, res) => {
  res.render('dashboard/revenue');
});

module.exports = router;