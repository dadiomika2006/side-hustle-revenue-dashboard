import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MdTrendingUp, MdPeople, MdReceipt, MdSchedule, MdAdd, MdSwapHoriz, MdCalculate, MdCheckCircle, MdRadioButtonUnchecked, MdNotificationsActive, MdArrowUpward, MdArrowDownward, MdRemove, MdAutoGraph, MdWarning, MdErrorOutline, MdStars } from 'react-icons/md';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const Dashboard = () => {
    const { user } = useAuth();
    const currency = user?.currency || 'USD';
    const fmt = (n) => formatMoney(n, currency, 0, 0);

    const [stats, setStats] = useState({ totalRevenue:0, totalExpenses:0, totalClients:0, totalInvoices:0, pendingInvoices:0, paidInvoices:0, overdueInvoices:0, activeGoals:0, totalGoalTarget:0 });
    const [monthlyData, setMonthlyData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [recentTx, setRecentTx] = useState([]);
    const [goalProgress, setGoalProgress] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [newReminderTitle, setNewReminderTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLocalMode, setIsLocalMode] = useState(false);
    const [injecting, setInjecting] = useState(false);
    const [injectSuccess, setInjectSuccess] = useState('');

    const load = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const [statsRes, monthlyRes, pieRes, goalsRes, remindersRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/revenue-monthly'),
                api.get('/dashboard/income-streams-analytics'),
                api.get('/goals/progress'),
                api.get('/reminders')
            ]);

            setStats(statsRes.data.stats || statsRes.data);
            setRecentTx(statsRes.data.recentTransactions || []);
            setIsLocalMode(statsRes.data.isLocalMode || false);
            setMonthlyData(monthlyRes.data);
            
            // Map side hustle analytics to pieData
            const parsedPieData = (pieRes.data || [])
                .map(s => ({
                    name: s.name,
                    value: s.income,
                    color: s.color
                }))
                .filter(d => d.value > 0);

            setPieData(parsedPieData);
            setGoalProgress(goalsRes.data.goals || []);
            setReminders(remindersRes.data || []);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data. Make sure the server is running.');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    const handleInjectDemoData = async () => {
        setInjecting(true);
        setInjectSuccess('');
        setError('');
        try {
            const res = await api.post('/dashboard/inject-mock-data');
            setInjectSuccess(res.data.msg || '✓ Realistic Demo Data Injected Successfully!');
            // Re-load all dashboard data
            await load(false);
            // Hide the success message after 4 seconds
            setTimeout(() => setInjectSuccess(''), 4000);
        } catch (err) {
            console.error('Error injecting mock data:', err);
            setError(err.response?.data?.msg || 'Failed to inject realistic demo data.');
        } finally {
            setInjecting(false);
        }
    };

    useEffect(() => {
        load(true);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                load(false);
            }
        };

        const handleFocus = () => load(false);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        const interval = setInterval(() => load(false), 30000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            clearInterval(interval);
        };
    }, [load]);

    const handleAddReminder = async (e) => {
        e.preventDefault();
        if (!newReminderTitle.trim()) return;
        try {
            const res = await api.post('/reminders', {
                title: newReminderTitle,
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
            });
            setReminders([res.data, ...reminders]);
            setNewReminderTitle('');
        } catch (err) {
            console.error('Error adding reminder:', err);
        }
    };

    const handleToggleReminder = async (id) => {
        try {
            const res = await api.put(`/reminders/${id}`);
            setReminders(reminders.map(r => r._id === id ? res.data : r));
        } catch (err) {
            console.error('Error toggling reminder:', err);
        }
    };

    const handleDeleteReminder = async (id) => {
        try {
            await api.delete(`/reminders/${id}`);
            setReminders(reminders.filter(r => r._id !== id));
        } catch (err) {
            console.error('Error deleting reminder:', err);
        }
    };

    if (loading) return (
        <div className="loading-spinner">
            <div className="spinner" />
            <span>Loading dashboard...</span>
        </div>
    );

    const profitMargin = stats.totalRevenue > 0 ? ((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue * 100).toFixed(1) : 0;
    const netProfit = stats.totalRevenue - stats.totalExpenses;

    const statCards = [
        { label:'Total Revenue', value: fmt(stats.totalRevenue), icon: MdTrendingUp, color:'#6366f1', bg:'rgba(99,102,241,0.12)', link:'/invoices' },
        { label:'Total Expenses', value: fmt(stats.totalExpenses), icon: MdSwapHoriz, color:'#ef4444', bg:'rgba(239,68,68,0.12)', link:'/transactions' },
        { label:'Net Profit', value: fmt(netProfit), icon: MdTrendingUp, color:'#10b981', bg:'rgba(16,185,129,0.12)', link:'/analytics' },
        { label:'Profit Margin', value: `${profitMargin}%`, icon: MdCalculate, color:'#f59e0b', bg:'rgba(245,158,11,0.12)', link:'/analytics' },
        { label:'Total Clients', value: stats.totalClients, icon: MdPeople, color:'#8b5cf6', bg:'rgba(139,92,246,0.12)', link:'/clients' },
        { label:'Total Invoices', value: stats.totalInvoices, icon: MdReceipt, color:'#a78bfa', bg:'rgba(167,139,250,0.12)', link:'/invoices' },
    ];

    const activeReminders = reminders.filter(r => !r.completed);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p style={{ color:'#94a3b8', fontSize:'14px', marginTop:'4px' }}>
                        Welcome back, <strong style={{ color:'#a5b4fc' }}>{user?.name}</strong> 👋
                    </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <button
                        onClick={() => load(false)}
                        style={{
                            padding:'8px 14px', borderRadius:'10px', fontSize:'13px', fontWeight:600,
                            background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
                            color:'#a5b4fc', cursor:'pointer', transition:'all 0.15s ease'
                        }}
                    >
                        🔄 Refresh
                    </button>
                    <Link to="/create-invoices" className="btn btn-primary">
                        <MdAdd size={18}/> New Invoice
                    </Link>
                </div>
            </div>

            {/* Local Offline Sandbox Mode Banner */}
            {isLocalMode && (
                <div className="card-glass animate-slide-down" style={{
                    marginBottom: '28px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-card), 0 0 25px rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', color: '#8b5cf6',
                            border: '1px solid rgba(99, 102, 241, 0.25)'
                        }}>
                            💾
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Local Developer Sandbox Mode
                                <span style={{
                                    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                    background: '#10b981', color: '#ffffff', padding: '3px 8px',
                                    borderRadius: '99px', letterSpacing: '0.05em'
                                }}>
                                    Active
                                </span>
                            </h3>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                App is running offline. Data is securely persisted in your workspace at <code style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: '#a5b4fc', fontSize: '12px' }}>backend/local_db.json</code>.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {injectSuccess ? (
                            <span style={{
                                fontSize: '13px', fontWeight: 700, color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)',
                                padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px',
                                animation: 'pulse 2s infinite'
                            }}>
                                {injectSuccess}
                            </span>
                        ) : (
                            <button
                                type="button"
                                disabled={injecting}
                                onClick={handleInjectDemoData}
                                className="btn btn-primary"
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    border: 'none',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    padding: '10px 18px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {injecting ? (
                                    <>⏳ Seeding Sandbox...</>
                                ) : (
                                    <>⚡ Inject Realistic Demo Data</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            {/* In-App Reminders and Action Items Banner */}
            {activeReminders.length > 0 && (
                <div className="card animate-slide-down" style={{
                    marginBottom: '28px',
                    background: 'rgba(245,158,11,0.04)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: '16px'
                }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdNotificationsActive /> Active Reminders & Action Items ({activeReminders.length})
                    </h2>
                    
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {activeReminders.map(rem => (
                            <div key={rem._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px', borderRadius: '10px',
                                background: 'rgba(26,26,46,0.9)',
                                border: '1px solid rgba(245,158,11,0.12)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => handleToggleReminder(rem._id)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f59e0b', display: 'flex', padding: 0 }}
                                    >
                                        <MdRadioButtonUnchecked size={20} />
                                    </button>
                                    <div>
                                        <span style={{ fontWeight: 700, color: '#e2e8f0', display: 'block', fontSize: '14px' }}>{rem.title}</span>
                                        {rem.description && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{rem.description}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                        {rem.type}
                                    </span>
                                    {rem.link && (
                                        <Link to={rem.link} style={{ fontSize: '12px', color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>
                                            Resolve →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Add Custom Task */}
                    <form onSubmit={handleAddReminder} style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid rgba(245,158,11,0.1)', paddingTop: '16px' }}>
                        <input 
                            type="text" 
                            value={newReminderTitle} 
                            onChange={e => setNewReminderTitle(e.target.value)} 
                            placeholder="Add a quick custom task/reminder... (e.g. Follow up with Jane Doe)"
                            className="form-input" 
                            style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }} 
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', background: '#f59e0b', borderColor: '#f59e0b', fontSize: '13px' }}>
                            + Add Task
                        </button>
                    </form>
                </div>
            )}

            {/* Stat Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px', marginBottom:'28px' }}>
                {statCards.map(({ label, value, icon:Icon, color, bg, link }) => (
                    <Link to={link} key={label} style={{ textDecoration:'none' }}>
                        <div className="stat-card">
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
                                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Icon style={{ fontSize:'22px', color }} />
                                </div>
                            </div>
                            <div style={{ fontSize:'13px', color:'#94a3b8', fontWeight:600, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                            <div style={{ fontSize:'28px', fontWeight:800, color:'#e2e8f0' }}>{value}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Revenue Status Section ─────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MdAutoGraph style={{ color: '#6366f1', fontSize: '22px' }} />
                            Revenue Status
                        </h2>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>Live health indicators for your income streams</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '5px 12px', borderRadius: '99px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Live</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {/* Card 1 – Total Revenue Status */}
                    <div style={{
                        borderRadius: '16px',
                        padding: '22px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.04) 100%)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue Health</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <MdStars size={14} /> Excellent
                            </span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginBottom: '6px' }}>{fmt(stats.totalRevenue)}</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>Total revenue earned this period</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MdArrowUpward size={16} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Revenue is growing — keep it up!</span>
                        </div>
                        <div style={{ marginTop: '14px', height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: stats.totalRevenue > 0 ? `${Math.min(100, (stats.totalRevenue / (stats.totalRevenue + stats.totalExpenses + 1)) * 100).toFixed(0)}%` : '0%', height: '100%', background: 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                        </div>
                    </div>

                    {/* Card 2 – Expense Status */}
                    <div style={{
                        borderRadius: '16px',
                        padding: '22px',
                        background: stats.totalExpenses > stats.totalRevenue * 0.7
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.04) 100%)'
                            : 'linear-gradient(135deg, rgba(245,158,11,0.13) 0%, rgba(245,158,11,0.04) 100%)',
                        border: stats.totalExpenses > stats.totalRevenue * 0.7
                            ? '1px solid rgba(239,68,68,0.3)'
                            : '1px solid rgba(245,158,11,0.28)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: stats.totalExpenses > stats.totalRevenue * 0.7 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: stats.totalExpenses > stats.totalRevenue * 0.7 ? '#ef4444' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expense Status</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700,
                                color: stats.totalExpenses > stats.totalRevenue * 0.7 ? '#ef4444' : '#f59e0b',
                                background: stats.totalExpenses > stats.totalRevenue * 0.7 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                padding: '4px 10px', borderRadius: '99px',
                                border: stats.totalExpenses > stats.totalRevenue * 0.7 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(245,158,11,0.25)'
                            }}>
                                {stats.totalExpenses > stats.totalRevenue * 0.7
                                    ? <><MdErrorOutline size={14} /> At Risk</>
                                    : <><MdWarning size={14} /> Moderate</>
                                }
                            </span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: stats.totalExpenses > stats.totalRevenue * 0.7 ? '#ef4444' : '#f59e0b', marginBottom: '6px' }}>{fmt(stats.totalExpenses)}</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>Total expenses this period</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MdArrowDownward size={16} style={{ color: stats.totalExpenses > stats.totalRevenue * 0.7 ? '#ef4444' : '#f59e0b' }} />
                            <span style={{ fontSize: '13px', color: stats.totalExpenses > stats.totalRevenue * 0.7 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                {stats.totalExpenses > stats.totalRevenue * 0.7 ? 'High expense ratio — review costs' : 'Expenses within healthy range'}
                            </span>
                        </div>
                        <div style={{ marginTop: '14px', height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: stats.totalRevenue > 0 ? `${Math.min(100, (stats.totalExpenses / stats.totalRevenue) * 100).toFixed(0)}%` : '0%', height: '100%', background: stats.totalExpenses > stats.totalRevenue * 0.7 ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                        </div>
                    </div>

                    {/* Card 3 – Net Profit Status */}
                    <div style={{
                        borderRadius: '16px',
                        padding: '22px',
                        background: netProfit >= 0
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.04) 100%)'
                            : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.04) 100%)',
                        border: netProfit >= 0 ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(239,68,68,0.3)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: netProfit >= 0 ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: netProfit >= 0 ? '#a5b4fc' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Profit</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700,
                                color: netProfit >= 0 ? '#a5b4fc' : '#ef4444',
                                background: netProfit >= 0 ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                                padding: '4px 10px', borderRadius: '99px',
                                border: netProfit >= 0 ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(239,68,68,0.25)'
                            }}>
                                {netProfit >= 0 ? <><MdArrowUpward size={14} /> On Track</> : <><MdArrowDownward size={14} /> Needs Attention</>}
                            </span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: netProfit >= 0 ? '#a5b4fc' : '#ef4444', marginBottom: '6px' }}>{fmt(netProfit)}</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>Revenue minus all expenses</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {netProfit >= 0
                                ? <MdArrowUpward size={16} style={{ color: '#a5b4fc' }} />
                                : <MdArrowDownward size={16} style={{ color: '#ef4444' }} />
                            }
                            <span style={{ fontSize: '13px', color: netProfit >= 0 ? '#a5b4fc' : '#ef4444', fontWeight: 600 }}>
                                {netProfit >= 0 ? `${profitMargin}% profit margin achieved` : 'Operating at a loss — cut expenses'}
                            </span>
                        </div>
                        <div style={{ marginTop: '14px', height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(0, Math.min(100, parseFloat(profitMargin)))}%`, height: '100%', background: netProfit >= 0 ? 'linear-gradient(90deg,#6366f1,#a5b4fc)' : 'linear-gradient(90deg,#ef4444,#f87171)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                        </div>
                    </div>

                    {/* Card 4 – Invoice Status */}
                    <div style={{
                        borderRadius: '16px',
                        padding: '22px',
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(168,85,247,0.04) 100%)',
                        border: '1px solid rgba(168,85,247,0.28)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(168,85,247,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invoice Status</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#c084fc', background: 'rgba(168,85,247,0.15)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(168,85,247,0.25)' }}>
                                <MdReceipt size={14} /> {stats.pendingInvoices > 0 ? 'Pending' : 'All Clear'}
                            </span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#c084fc', marginBottom: '6px' }}>{stats.totalInvoices}</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>Total invoices issued</div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(16,185,129,0.2)' }}>✓ {stats.paidInvoices ?? 0} Paid</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(245,158,11,0.2)' }}>⏳ {stats.pendingInvoices ?? 0} Pending</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(239,68,68,0.2)' }}>⚠ {stats.overdueInvoices ?? 0} Overdue</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'28px' }}>
                {/* Line Chart */}
                <div className="card">
                    <h2 style={{ fontSize:'16px', fontWeight:700, marginBottom:'20px' }}>Monthly Revenue</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                            <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill:'#94a3b8', fontSize:12 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                            <Tooltip contentStyle={{ background:'#1e2a45', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'8px', color:'#e2e8f0' }} formatter={(v, name) => [fmt(v), name.charAt(0).toUpperCase() + name.slice(1)]} />
                            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:'#94a3b8', fontSize:12 }}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>} />
                            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill:'#6366f1', r:4 }} activeDot={{ r:6 }} name="revenue" />
                            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ fill:'#ef4444', r:4 }} activeDot={{ r:6 }} name="expenses" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="card">
                    <h2 style={{ fontSize:'16px', fontWeight:700, marginBottom:'20px' }}>Revenue by Side Hustle</h2>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background:'#1e2a45', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'8px', color:'#e2e8f0' }} formatter={v => [fmt(v)]} />
                                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:'#94a3b8', fontSize:12 }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state" style={{ height:220 }}>
                            <div className="empty-state-icon">🥧</div>
                            <p>No side hustle revenue tracked yet. Link your transactions to custom income streams to view the breakdown!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Goal Progress */}
            <div className="card" style={{ marginBottom:'28px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <h2 style={{ fontSize:'16px', fontWeight:700 }}>Goal Progress</h2>
                    <Link to="/goals" style={{ fontSize:'13px', color:'#6366f1', fontWeight:600 }}>Manage goals →</Link>
                </div>
                {goalProgress.length > 0 ? (
                    goalProgress.map(goal => (
                        <div key={goal.id} style={{ marginBottom:'18px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                                <div>
                                    <div style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0' }}>{goal.name}</div>
                                    <div style={{ fontSize:'12px', color:'#94a3b8' }}>{goal.periodLabel} · {goal.frequency}</div>
                                </div>
                                <div style={{ fontSize:'13px', fontWeight:700, color:'#10b981' }}>{fmt(goal.achievedAmount)} / {fmt(goal.targetAmount)}</div>
                            </div>
                            <div style={{ height:'10px', background:'rgba(148,163,184,0.16)', borderRadius:'999px', overflow:'hidden' }}>
                                <div style={{ width:`${goal.progress}%`, minHeight:'10px', background:'#6366f1' }} />
                            </div>
                            <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'6px' }}>{goal.progress.toFixed(0)}% achieved</div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state" style={{ padding:'24px 0' }}>
                        <div className="empty-state-icon">🎯</div>
                        <p>No active goals yet. Create one in the goals page.</p>
                    </div>
                )}
            </div>

            {/* Recent Transactions + Quick Actions */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'20px' }}>
                {/* Recent Transactions */}
                <div className="card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                        <h2 style={{ fontSize:'16px', fontWeight:700 }}>Recent Transactions</h2>
                        <Link to="/transactions" style={{ fontSize:'13px', color:'#6366f1', fontWeight:600 }}>View all →</Link>
                    </div>
                    {recentTx.length > 0 ? (
                        <div>
                            {recentTx.map(tx => (
                                <div key={tx._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(99,102,241,0.07)' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background: tx.type==='income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
                                            {tx.type === 'income' ? '📈' : '📉'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize:'14px', fontWeight:600, color:'#e2e8f0' }}>{tx.description || tx.category || 'Transaction'}</div>
                                            <div style={{ fontSize:'12px', color:'#94a3b8' }}>{tx.client?.name || 'No client'}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize:'15px', fontWeight:700, color: tx.type==='income' ? '#10b981' : '#ef4444' }}>
                                        {tx.type==='income' ? '+' : '-'}{fmt(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">💳</div>
                            <p>No transactions yet</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div style={{ display:'flex', flexDirection:'column', gap:'12px', minWidth:'180px' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>Quick Actions</div>
                    {[
                        { to:'/create-invoices', icon:'🧾', label:'New Invoice', color:'#6366f1' },
                        { to:'/transactions', icon:'💳', label:'Add Transaction', color:'#10b981' },
                        { to:'/clients', icon:'👥', label:'Add Client', color:'#f59e0b' },
                        { to:'/calculator', icon:'🔢', label:'Calculator', color:'#a855f7' },
                    ].map(({ to, icon, label, color }) => (
                        <Link key={to} to={to} style={{
                            display:'flex', alignItems:'center', gap:'12px',
                            padding:'14px 16px', borderRadius:'12px',
                            background:'rgba(26,26,46,0.8)',
                            border:`1px solid rgba(99,102,241,0.12)`,
                            textDecoration:'none', transition:'all 0.15s ease',
                            fontSize:'14px', fontWeight:600, color:'#e2e8f0'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}15`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'; e.currentTarget.style.background = 'rgba(26,26,46,0.8)'; }}
                        >
                            <span style={{ fontSize:'20px' }}>{icon}</span>
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
