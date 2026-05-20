const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Goal = require('../models/Goal');
const User = require('../models/User');
const Receipt = require('../models/Receipt');
const RecurringTransaction = require('../models/RecurringTransaction');
const Mileage = require('../models/Mileage');
const TaxBucket = require('../models/TaxBucket');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const [
            totalClients,
            totalInvoices,
            totalTransactions,
            revenueAgg,
            expenseAgg,
            pendingInvoices,
            paidInvoices,
            overdueInvoices,
            activeGoals
        ] = await Promise.all([
            Client.countDocuments({ user: userId }),
            Invoice.countDocuments({ user: userId }),
            Transaction.countDocuments({ user: userId }),
            Transaction.aggregate([
                { $match: { user: userId, type: 'income' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
            ]),
            Transaction.aggregate([
                { $match: { user: userId, type: 'expense' } }, // Make sure 'expense' is the exact type
                { $group: { _id: null, total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
            ]),
            Invoice.countDocuments({ user: userId, status: 'pending' }),
            Invoice.countDocuments({ user: userId, status: 'paid' }),
            Invoice.countDocuments({ user: userId, status: 'overdue' }),
            Goal.find({ user: userId, enabled: true })
        ]);

        // --- NEW DEBUGGING CONSOLE.LOGS ADDED HERE ---
        console.log('Backend Debug: userId:', userId);
        console.log('Backend Debug: revenueAgg result:', revenueAgg);
        console.log('Backend Debug: expenseAgg result:', expenseAgg);
        console.log('Backend Debug: calculated totalRevenue:', revenueAgg[0]?.total || 0);
        console.log('Backend Debug: calculated totalExpenses:', expenseAgg[0]?.total || 0);
        // --- END DEBUGGING CONSOLE.LOGS ---

        const recentTransactions = await Transaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('client', 'name');

        const goalSummary = activeGoals.reduce((summary, goal) => {
            summary.totalTarget += goal.targetAmount;
            return summary;
        }, { totalTarget: 0 });

        res.json({
            stats: {
                totalClients,
                totalInvoices,
                totalTransactions,
                totalRevenue: revenueAgg[0]?.total || 0,
                totalExpenses: expenseAgg[0]?.total || 0,
                pendingInvoices,
                paidInvoices,
                overdueInvoices,
                activeGoals: activeGoals.length,
                totalGoalTarget: goalSummary.totalTarget
            },
            recentTransactions,
            activeGoals
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get monthly revenue chart data (12 months current year)
// @route   GET /api/dashboard/revenue-chart
// @access  Private
const getRevenueChart = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = await Invoice.aggregate([
            {
                $match: {
                    user: userId,
                    status: 'paid',
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const chartData = Array(12).fill(0);
        monthlyRevenue.forEach(item => {
            chartData[item._id - 1] = item.total;
        });

        res.json({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            data: chartData
        });
    } catch (err) {
        console.error('Revenue chart error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get monthly revenue and expense formatted for recharts
// @route   GET /api/dashboard/revenue-monthly
// @access  Private
const getRevenueMonthly = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const currentYear = new Date().getFullYear();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const [monthlyIncome, monthlyExpense] = await Promise.all([
            Transaction.aggregate([
                {
                    $match: {
                        user: userId,
                        type: 'income',
                        date: {
                            $gte: new Date(`${currentYear}-01-01`),
                            $lte: new Date(`${currentYear}-12-31`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$date' },
                        revenue: { $sum: { $ifNull: ['$baseAmount', '$amount'] } }
                    }
                }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        user: userId,
                        type: 'expense',
                        date: {
                            $gte: new Date(`${currentYear}-01-01`),
                            $lte: new Date(`${currentYear}-12-31`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$date' },
                        expenses: { $sum: { $ifNull: ['$baseAmount', '$amount'] } }
                    }
                }
            ])
        ]);

        // Build full 12-month array
        const chartData = monthNames.map((month, i) => ({
            month,
            revenue: 0,
            expenses: 0
        }));

        monthlyIncome.forEach(item => {
            chartData[item._id - 1].revenue = item.revenue;
        });

        monthlyExpense.forEach(item => {
            chartData[item._id - 1].expenses = item.expenses;
        });

        res.json(chartData);
    } catch (err) {
        console.error('Revenue monthly error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get invoice status breakdown for pie chart
// @route   GET /api/dashboard/revenue-status
// @access  Private
const getRevenueStatus = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const statusAgg = await Invoice.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: '$status',
                    value: { $sum: '$total' }
                }
            }
        ]);

        const statusMap = { paid: 0, pending: 0, overdue: 0, cancelled: 0 };
        statusAgg.forEach(item => {
            if (statusMap.hasOwnProperty(item._id)) {
                statusMap[item._id] = item.value;
            }
        });

        res.json([
            { name: 'Paid', value: statusMap.paid },
            { name: 'Pending', value: statusMap.pending },
            { name: 'Overdue', value: statusMap.overdue },
            { name: 'Cancelled', value: statusMap.cancelled }
        ]);
    } catch (err) {
        console.error('Revenue status error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get top clients by revenue
// @route   GET /api/dashboard/top-clients
// @access  Private
const getTopClients = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const topClients = await Invoice.aggregate([
            { $match: { user: userId, status: 'paid' } },
            { $group: { _id: '$client', total: { $sum: '$total' } } },
            {
                $lookup: {
                    from: 'clients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        res.json(topClients);
    } catch (err) {
        console.error('Top clients error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

const getAdminOverview = async (req, res) => {
    try {
        const [
            totalUsers,
            totalClients,
            totalInvoices,
            totalTransactions,
            totalReceipts,
            totalRecurringTransactions,
            totalMileageLogs,
            totalGoals,
            totalTaxBuckets
        ] = await Promise.all([
            User.countDocuments(),
            Client.countDocuments(),
            Invoice.countDocuments(),
            Transaction.countDocuments(),
            Receipt.countDocuments(),
            RecurringTransaction.countDocuments(),
            Mileage.countDocuments(),
            Goal.countDocuments(),
            TaxBucket.countDocuments()
        ]);

        res.json({
            totalUsers,
            totalClients,
            totalInvoices,
            totalTransactions,
            totalReceipts,
            totalRecurringTransactions,
            totalMileageLogs,
            totalGoals,
            totalTaxBuckets
        });
    } catch (err) {
        console.error('getAdminOverview error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

const getIncomeStreamAnalytics = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const IncomeStream = require('../models/IncomeStream');

        // Load all user's custom income streams
        const streams = await IncomeStream.find({ user: userId });
        
        // Load income and expense transactions aggregated by incomeStream
        const [incomeAgg, expenseAgg] = await Promise.all([
            Transaction.aggregate([
                { $match: { user: userId, type: 'income', incomeStream: { $exists: true, $ne: null } } },
                { $group: { _id: '$incomeStream', total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
            ]),
            Transaction.aggregate([
                { $match: { user: userId, type: 'expense', incomeStream: { $exists: true, $ne: null } } },
                { $group: { _id: '$incomeStream', total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
            ])
        ]);

        const incomeMap = {};
        incomeAgg.forEach(item => {
            if (item._id) incomeMap[item._id.toString()] = item.total;
        });

        const expenseMap = {};
        expenseAgg.forEach(item => {
            if (item._id) expenseMap[item._id.toString()] = item.total;
        });

        // Map streams to their summary details
        const analytics = streams.map(s => {
            const streamIdStr = s._id.toString();
            const income = incomeMap[streamIdStr] || 0;
            const expense = expenseMap[streamIdStr] || 0;
            const profit = income - expense;
            const margin = income > 0 ? parseFloat(((profit / income) * 100).toFixed(1)) : 0;
            
            return {
                id: s._id,
                name: s.name,
                color: s.color || '#6366f1',
                description: s.description,
                platformUrl: s.platformUrl,
                income,
                expense,
                profit,
                margin
            };
        });

        // Add a fallback option for "Unassigned" transactions
        // Must catch BOTH: incomeStream field missing ($exists: false) AND incomeStream: null
        const [unassignedIncomeAgg, unassignedExpenseAgg] = await Promise.all([
            Transaction.aggregate([
                {
                    $match: {
                        user: userId,
                        type: 'income',
                        $or: [{ incomeStream: { $exists: false } }, { incomeStream: null }]
                    }
                },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        user: userId,
                        type: 'expense',
                        $or: [{ incomeStream: { $exists: false } }, { incomeStream: null }]
                    }
                },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } }
            ])
        ]);

        const unassignedIncome = unassignedIncomeAgg[0]?.total || 0;
        const unassignedExpense = unassignedExpenseAgg[0]?.total || 0;
        const unassignedProfit = unassignedIncome - unassignedExpense;
        const unassignedMargin = unassignedIncome > 0 ? parseFloat(((unassignedProfit / unassignedIncome) * 100).toFixed(1)) : 0;

        if (unassignedIncome > 0 || unassignedExpense > 0) {
            analytics.push({
                id: 'unassigned',
                name: 'Unassigned / General',
                color: '#94a3b8',
                description: 'General transactions not assigned to a specific stream.',
                platformUrl: '',
                income: unassignedIncome,
                expense: unassignedExpense,
                profit: unassignedProfit,
                margin: unassignedMargin
            });
        }

        res.json(analytics);
    } catch (err) {
        console.error('getIncomeStreamAnalytics error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueChart,
    getRevenueMonthly,
    getRevenueStatus,
    getTopClients,
    getAdminOverview,
    getIncomeStreamAnalytics
};