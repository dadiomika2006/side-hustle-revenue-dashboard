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
const Reminder = require('../models/Reminder');
const IncomeStream = require('../models/IncomeStream');

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
            activeGoals,
            isLocalMode: process.env.USE_LOCAL_DB === 'true'
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

const injectMockData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Clear existing data for this user to avoid duplication
        await Promise.all([
            Client.deleteMany({ user: userId }),
            Invoice.deleteMany({ user: userId }),
            Transaction.deleteMany({ user: userId }),
            Goal.deleteMany({ user: userId }),
            Mileage.deleteMany({ user: userId }),
            TaxBucket.deleteMany({ user: userId }),
            Reminder.deleteMany({ user: userId })
        ]);
        
        // 1. Create Tax Bucket
        await TaxBucket.create({
            user: userId,
            name: 'Federal & State Savings',
            percentage: 25,
            balance: 1250,
            targetAmount: 5000,
            enabled: true
        });

        // 2. Create Custom Income Streams
        const streamEtsy = await IncomeStream.create({
            user: userId,
            name: 'Etsy Handcrafted Shop',
            color: '#10b981',
            description: 'Custom ceramic gifts and knitwear',
            platformUrl: 'https://etsy.com'
        });

        const streamFreelance = await IncomeStream.create({
            user: userId,
            name: 'Freelance Copywriting',
            color: '#6366f1',
            description: 'B2B blog writing and SaaS copywriting',
            platformUrl: 'https://upwork.com'
        });

        const streamUber = await IncomeStream.create({
            user: userId,
            name: 'Uber Driving',
            color: '#f59e0b',
            description: 'Gig economy ride sharing and deliveries',
            platformUrl: 'https://uber.com'
        });

        // 3. Create Clients
        const client1 = await Client.create({
            user: userId,
            name: 'Acme SaaS Corp',
            email: 'billing@acme.com',
            phone: '555-0199',
            company: 'Acme Corp'
        });

        const client2 = await Client.create({
            user: userId,
            name: 'Jane Smith Designs',
            email: 'hello@janesmith.design',
            phone: '555-0144',
            company: 'Jane Smith Designs'
        });

        const client3 = await Client.create({
            user: userId,
            name: 'Etsy Buyer John',
            email: 'john@buyer.com',
            phone: '555-9988',
            company: 'Individual'
        });

        // 4. Create Goals
        await Goal.create({
            user: userId,
            title: 'Q2 Side Hustle Milestone',
            targetAmount: 8000,
            currentAmount: 4320,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2026-06-30'),
            enabled: true
        });

        // 5. Create Mileage Logs
        await Mileage.create([
            {
                user: userId,
                date: new Date('2026-05-15'),
                description: 'Friday Night Rideshare Rush',
                milesDriven: 48,
                deductionRate: 0.67,
                calculatedDeduction: 32.16
            },
            {
                user: userId,
                date: new Date('2026-05-20'),
                description: 'Supplies Run to Craft Store',
                milesDriven: 14,
                deductionRate: 0.67,
                calculatedDeduction: 9.38
            }
        ]);

        // 6. Create Reminders
        await Reminder.create([
            {
                user: userId,
                title: 'Sundays Earnings Log Reminder 🗓️',
                description: 'Check Etsy & Uber dashboards and log weekly payouts.',
                dueDate: new Date('2026-05-24T18:00:00Z'),
                completed: false,
                type: 'weekly',
                link: '/transactions'
            },
            {
                user: userId,
                title: 'Review Schedule C Deductions',
                description: 'Verify travel expenses and home office square footage calculations.',
                dueDate: new Date('2026-05-28T09:00:00Z'),
                completed: false,
                type: 'task',
                link: '/reports'
            }
        ]);

        // 7. Create Transactions (Income & Expenses over last 5 months)
        const currentYear = new Date().getFullYear();
        const transactions = [
            // Etsy Sales
            { user: userId, type: 'income', amount: 450, baseAmount: 450, category: 'Sales', date: new Date(`${currentYear}-01-10`), incomeStream: streamEtsy._id, description: 'Etsy payout - ceramic mugs' },
            { user: userId, type: 'income', amount: 520, baseAmount: 520, category: 'Sales', date: new Date(`${currentYear}-02-15`), incomeStream: streamEtsy._id, description: 'Etsy payout - winter scarves' },
            { user: userId, type: 'income', amount: 610, baseAmount: 610, category: 'Sales', date: new Date(`${currentYear}-03-12`), incomeStream: streamEtsy._id, description: 'Etsy payout - Easter decors' },
            { user: userId, type: 'income', amount: 730, baseAmount: 730, category: 'Sales', date: new Date(`${currentYear}-04-18`), incomeStream: streamEtsy._id, description: 'Etsy payout - spring planters' },
            { user: userId, type: 'income', amount: 850, baseAmount: 850, category: 'Sales', date: new Date(`${currentYear}-05-20`), incomeStream: streamEtsy._id, description: 'Etsy payout - customized plates' },
            
            // Etsy Expenses
            { user: userId, type: 'expense', amount: 80, baseAmount: 80, category: 'Materials', date: new Date(`${currentYear}-01-12`), incomeStream: streamEtsy._id, description: 'Clay and glaze materials' },
            { user: userId, type: 'expense', amount: 120, baseAmount: 120, category: 'Materials', date: new Date(`${currentYear}-03-15`), incomeStream: streamEtsy._id, description: 'Premium wool yarn shipment' },
            { user: userId, type: 'expense', amount: 45, baseAmount: 45, category: 'Advertising', date: new Date(`${currentYear}-05-02`), incomeStream: streamEtsy._id, description: 'Etsy Search Promoted Ads' },

            // Freelance Writing
            { user: userId, type: 'income', amount: 1200, baseAmount: 1200, category: 'Services', date: new Date(`${currentYear}-01-20`), incomeStream: streamFreelance._id, description: 'Acme SaaS Q1 Whitepaper Draft', client: client1._id },
            { user: userId, type: 'income', amount: 1200, baseAmount: 1200, category: 'Services', date: new Date(`${currentYear}-02-22`), incomeStream: streamFreelance._id, description: 'Acme SaaS Blog Bundle - 4 posts', client: client1._id },
            { user: userId, type: 'income', amount: 1500, baseAmount: 1500, category: 'Services', date: new Date(`${currentYear}-03-25`), incomeStream: streamFreelance._id, description: 'Acme SaaS Web Copy Redesign', client: client1._id },
            { user: userId, type: 'income', amount: 1800, baseAmount: 1800, category: 'Services', date: new Date(`${currentYear}-04-20`), incomeStream: streamFreelance._id, description: 'Jane Smith landing page copy', client: client2._id },
            { user: userId, type: 'income', amount: 2000, baseAmount: 2000, category: 'Services', date: new Date(`${currentYear}-05-18`), incomeStream: streamFreelance._id, description: 'Acme SaaS Customer Case Studies', client: client1._id },

            // Freelance Expenses
            { user: userId, type: 'expense', amount: 15, baseAmount: 15, category: 'Software', date: new Date(`${currentYear}-01-05`), incomeStream: streamFreelance._id, description: 'Copyscape Plagiarism monthly plan' },
            { user: userId, type: 'expense', amount: 30, baseAmount: 30, category: 'Software', date: new Date(`${currentYear}-02-05`), incomeStream: streamFreelance._id, description: 'Grammarly Premium Subscription' },
            { user: userId, type: 'expense', amount: 50, baseAmount: 50, category: 'Software', date: new Date(`${currentYear}-04-10`), incomeStream: streamFreelance._id, description: 'Adobe Creative Cloud plan' },

            // Uber driving
            { user: userId, type: 'income', amount: 350, baseAmount: 350, category: 'Services', date: new Date(`${currentYear}-01-15`), incomeStream: streamUber._id, description: 'Weekly rideshare driving payout' },
            { user: userId, type: 'income', amount: 480, baseAmount: 480, category: 'Services', date: new Date(`${currentYear}-02-18`), incomeStream: streamUber._id, description: 'Weekly rideshare driving payout' },
            { user: userId, type: 'income', amount: 420, baseAmount: 420, category: 'Services', date: new Date(`${currentYear}-03-22`), incomeStream: streamUber._id, description: 'Weekly rideshare driving payout' },
            { user: userId, type: 'income', amount: 620, baseAmount: 620, category: 'Services', date: new Date(`${currentYear}-04-28`), incomeStream: streamUber._id, description: 'Weekly rideshare driving payout' },
            { user: userId, type: 'income', amount: 550, baseAmount: 550, category: 'Services', date: new Date(`${currentYear}-05-21`), incomeStream: streamUber._id, description: 'Weekly rideshare driving payout' },

            // Uber Expenses
            { user: userId, type: 'expense', amount: 110, baseAmount: 110, category: 'Travel', date: new Date(`${currentYear}-01-16`), incomeStream: streamUber._id, description: 'Gas refill and car wash' },
            { user: userId, type: 'expense', amount: 95, baseAmount: 95, category: 'Travel', date: new Date(`${currentYear}-02-20`), incomeStream: streamUber._id, description: 'Gas refill' },
            { user: userId, type: 'expense', amount: 150, baseAmount: 150, category: 'Travel', date: new Date(`${currentYear}-03-28`), incomeStream: streamUber._id, description: 'Regular oil change and car maintenance' },
            { user: userId, type: 'expense', amount: 120, baseAmount: 120, category: 'Travel', date: new Date(`${currentYear}-04-30`), incomeStream: streamUber._id, description: 'Gas refill' }
        ];

        await Transaction.create(transactions);

        // 8. Create Invoices
        await Invoice.create([
            {
                user: userId,
                client: client1._id,
                invoiceNumber: 'INV-2026-001',
                dueDate: new Date('2026-06-05'),
                items: [
                    { description: 'Saas copywriting consulting - Q2 strategy', quantity: 1, rate: 1500, amount: 1500 }
                ],
                taxRate: 0,
                discount: 0,
                total: 1500,
                status: 'pending',
                notes: 'Thank you for your business!'
            },
            {
                user: userId,
                client: client2._id,
                invoiceNumber: 'INV-2026-002',
                dueDate: new Date('2026-05-30'),
                items: [
                    { description: 'Landing Page visual copy drafting', quantity: 1, rate: 800, amount: 800 }
                ],
                taxRate: 0,
                discount: 0,
                total: 800,
                status: 'pending',
                notes: 'Net 10 payment terms.'
            },
            {
                user: userId,
                client: client1._id,
                invoiceNumber: 'INV-2026-003',
                dueDate: new Date('2026-05-10'),
                items: [
                    { description: 'Client Case Study - Technical Writeup', quantity: 1, rate: 1200, amount: 1200 }
                ],
                taxRate: 0,
                discount: 0,
                total: 1200,
                status: 'paid',
                notes: 'Paid in full. Thank you!'
            }
        ]);

        res.json({ msg: '✓ Beautiful, high-end demo data successfully injected!' });
    } catch (err) {
        console.error('Error injecting mock data:', err);
        res.status(500).json({ msg: 'Failed to inject demo data.' });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueChart,
    getRevenueMonthly,
    getRevenueStatus,
    getTopClients,
    getAdminOverview,
    getIncomeStreamAnalytics,
    injectMockData
};