import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';
import {
    TrendingUp, TrendingDown, Plus, Edit2, Trash2,
    ArrowUpRight, ArrowDownRight, X, Save
} from 'lucide-react';

const Finance = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [salaryReport, setSalaryReport] = useState([]);
    const [pnLData, setPnLData] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [invoiceReport, setInvoiceReport] = useState([]);
    const [consumptionReport, setConsumptionReport] = useState([]);

    const [isAllTimeSalary, setIsAllTimeSalary] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    const [transType, setTransType] = useState('income');
    const [formData, setFormData] = useState({ id: null, category: '', amount: '', description: '', payment_method: 'cash', date: format(new Date(), 'yyyy-MM-dd') });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'Overview') await fetchSummary();
                else if (activeTab === 'Daybook') await fetchTransactions();
                else if (activeTab === 'Salaries') await fetchSalaries();
                else if (activeTab === 'PnL') await fetchPnL();
                else if (activeTab === 'Revenue') await fetchRevenue();
                else if (activeTab === 'Invoices') await fetchInvoices();
                else if (activeTab === 'Consumption') await fetchConsumption();
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [activeTab, dateRange, isAllTimeSalary]);

    const fetchSummary = async () => {
        const res = await axios.get('/api/finance/summary');
        const dataMap = {};
        res.data.forEach(item => { dataMap[format(new Date(item.report_date), 'yyyy-MM-dd')] = item; });
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = subDays(new Date(), i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const entry = dataMap[dateStr] || { total_income: 0, total_expenses: 0 };
            last7Days.push({ date: format(d, 'd MMM'), income: parseFloat(entry.total_income || 0), expense: parseFloat(entry.total_expenses || 0) });
        }
        setChartData(last7Days);
    };

    const fetchTransactions = async () => {
        const res = await axios.get('/api/finance/transactions', { params: dateRange });
        setTransactions(res.data);
    };

    const fetchSalaries = async () => {
        const res = await axios.get('/api/finance/reports/salary', {
            params: { ...dateRange, allTime: isAllTimeSalary }
        });
        setSalaryReport(res.data);
    };

    const fetchPnL = async () => {
        const res = await axios.get('/api/finance/reports/profit-loss', { params: dateRange });
        setPnLData(res.data);
    };

    const fetchRevenue = async () => {
        const res = await axios.get('/api/finance/reports/revenue-breakdown', { params: dateRange });
        setRevenueData(res.data);
    };

    const fetchInvoices = async () => {
        const res = await axios.get('/api/finance/reports/invoices', { params: dateRange });
        setInvoiceReport(res.data);
    };

    const fetchConsumption = async () => {
        const res = await axios.get('/api/finance/reports/spares-consumption', { params: dateRange });
        setConsumptionReport(res.data);
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await axios.put(`/api/finance/transactions/${transType}/${formData.id}`, formData);
            else await axios.post(`/api/finance/${transType}`, formData);
            setIsTransModalOpen(false);
            fetchTransactions();
        } catch (err) { alert('Error saving transaction'); }
    };

    const handleDeleteTransaction = async (type, id) => {
        if (!window.confirm('Delete this record?')) return;
        await axios.delete(`/api/finance/transactions/${type}/${id}`);
        fetchTransactions();
    };

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Finance & Reports</h2>
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--card)', padding: '0.4rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <input type="date" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} style={{ border: 'none', background: 'none', color: 'var(--text)', fontSize: '0.85rem' }} />
                    <span style={{ color: 'var(--secondary)' }}>to</span>
                    <input type="date" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} style={{ border: 'none', background: 'none', color: 'var(--text)', fontSize: '0.85rem' }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                {['Overview', 'Daybook', 'Salaries', 'PnL', 'Revenue', 'Invoices', 'Consumption'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none',
                            backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--secondary)',
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Report...</div> : (
                <>
                    {activeTab === 'Overview' && (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem', color: 'var(--success)' }}><TrendingUp size={24} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>Weekly Income</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{chartData.reduce((s, d) => s + d.income, 0).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.75rem', color: 'var(--danger)' }}><TrendingDown size={24} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>Weekly Expenses</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{chartData.reduce((s, d) => s + d.expense, 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <h3>Financial Trends</h3>
                                <div style={{ height: '350px', width: '100%', marginTop: '1.5rem' }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--secondary)', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--secondary)', fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                                            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                                            <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" />
                                            <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Daybook' && (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn" onClick={() => { setTransType('income'); setFormData({ category: '', amount: '', description: '', payment_method: 'cash', date: format(new Date(), 'yyyy-MM-dd'), id: null }); setIsTransModalOpen(true); }} style={{ backgroundColor: 'var(--success)', color: 'white' }}><Plus size={18} /> Add Income</button>
                                <button className="btn" onClick={() => { setTransType('expense'); setFormData({ category: '', amount: '', description: '', payment_method: 'cash', date: format(new Date(), 'yyyy-MM-dd'), id: null }); setIsTransModalOpen(true); }} style={{ backgroundColor: 'var(--danger)', color: 'white' }}><Plus size={18} /> Add Expense</button>
                            </div>
                            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                        <tr><th style={{ padding: '1rem', textAlign: 'left' }}>Date</th><th style={{ padding: '1rem', textAlign: 'left' }}>Type</th><th style={{ padding: '1rem', textAlign: 'left' }}>Category</th><th style={{ padding: '1rem', textAlign: 'left' }}>Description</th><th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th><th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => (
                                            <tr key={`${t.type}-${t.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>{format(new Date(t.date), 'dd MMM yyyy')}</td>
                                                <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>{t.type.toUpperCase()}</span></td>
                                                <td style={{ padding: '1rem' }}>{t.category}</td>
                                                <td style={{ padding: '1rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>{t.description || '-'}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>{t.type === 'income' ? '+' : '-'} ₹{parseFloat(t.amount).toLocaleString()}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}><div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}><button className="btn-icon" onClick={() => { setTransType(t.type); setFormData({ ...t, date: format(new Date(t.date), 'yyyy-MM-dd') }); setIsTransModalOpen(true); }} color="var(--primary)"><Edit2 size={16} /></button><button className="btn-icon" onClick={() => handleDeleteTransaction(t.type, t.id)} color="var(--danger)"><Trash2 size={16} /></button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Salaries' && (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Mechanic Name Cards</h3>
                                <div
                                    onClick={() => setIsAllTimeSalary(!isAllTimeSalary)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        backgroundColor: 'var(--bg)',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '2rem',
                                        border: '1px solid var(--border)',
                                        userSelect: 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '18px',
                                        backgroundColor: isAllTimeSalary ? 'var(--success)' : 'var(--secondary)',
                                        borderRadius: '1rem',
                                        position: 'relative',
                                        transition: '0.3s'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: isAllTimeSalary ? '16px' : '2px',
                                            top: '2px',
                                            width: '14px',
                                            height: '14px',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            transition: '0.3s'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Show All-Time Earnings</span>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {salaryReport.map(staff => (
                                    <div
                                        key={staff.id}
                                        className="card"
                                        onClick={async () => {
                                            const res = await axios.get(`/api/finance/reports/salary/${staff.id}`, {
                                                params: { ...dateRange, allTime: isAllTimeSalary }
                                            });
                                            setFormData({ ...staff, history: res.data });
                                            setIsTransModalOpen(true);
                                            setTransType('salary_detail');
                                        }}
                                        style={{
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--card)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                                                    {staff.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{staff.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{staff.tasks.reduce((sum, t) => sum + t.count, 0)} Tasks Completed</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Earnings</div>
                                                <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.25rem' }}>₹{staff.grand_total.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                            {staff.tasks.slice(0, 3).map(task => (
                                                <div key={task.category} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                                    <span style={{ textTransform: 'capitalize', color: 'var(--secondary)' }}>{task.category.replace('_', ' ')}</span>
                                                    <span style={{ fontWeight: 600 }}>₹{parseFloat(task.value).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {staff.tasks.length > 3 && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', textAlign: 'center', marginTop: '0.5rem' }}>+ {staff.tasks.length - 3} more categories</div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                            Click to view history →
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {salaryReport.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>No salary data found for the selected range.</div>}
                        </div>
                    )}

                    {activeTab === 'PnL' && pnLData && (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                <div className="card">
                                    <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ArrowUpRight size={18} /> Incomes</h3>
                                    {pnLData.income.map(i => <div key={i.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}><span>{i.category}</span><span style={{ fontWeight: 700 }}>₹{parseFloat(i.total).toLocaleString()}</span></div>)}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 800 }}><span>Total Revenue</span><span>₹{pnLData.total_income.toLocaleString()}</span></div>
                                </div>
                                <div className="card">
                                    <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ArrowDownRight size={18} /> Expenses</h3>
                                    {pnLData.expenses.map(e => <div key={e.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}><span>{e.category}</span><span style={{ fontWeight: 700 }}>₹{parseFloat(e.total).toLocaleString()}</span></div>)}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 800 }}><span>Total Expenses</span><span>₹{pnLData.total_expenses.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--secondary)' }}>Net Profit / Loss</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: pnLData.total_income - pnLData.total_expenses >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {pnLData.total_income - pnLData.total_expenses >= 0 ? '+' : '-'} ₹{Math.abs(pnLData.total_income - pnLData.total_expenses).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Revenue' && (
                        <div className="card">
                            <h3>Revenue Breakdown</h3>
                            <div style={{ height: '350px', marginTop: '1.5rem' }}>
                                <ResponsiveContainer><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="category" tickFormatter={v => v.replace('_', ' ')} /><YAxis tickFormatter={v => `₹${v}`} /><Tooltip /><Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Invoices' && (
                        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                    <tr><th>Inv #</th><th>Date</th><th>Customer</th><th>Vehicle</th><th style={{ textAlign: 'right' }}>Spares</th><th style={{ textAlign: 'right' }}>Services</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                                </thead>
                                <tbody>
                                    {invoiceReport.map(inv => (
                                        <tr key={inv.id}>
                                            <td style={{ padding: '1rem' }}>#{inv.id}</td>
                                            <td style={{ padding: '1rem' }}>{format(new Date(inv.job_date), 'dd MMM yy')}</td>
                                            <td style={{ padding: '1rem' }}>{inv.customer_name}</td>
                                            <td style={{ padding: '1rem' }}>{inv.plate_number}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>₹{parseFloat(inv.spares_total || 0).toLocaleString()}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>₹{parseFloat(inv.service_total || 0).toLocaleString()}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'Consumption' && (
                        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                    <tr><th>Spare Part</th><th>Category</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Value</th></tr>
                                </thead>
                                <tbody>
                                    {consumptionReport.map((c, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{c.item_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{c.part_number !== 'N/A' ? c.part_number : ''}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{c.category}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{c.total_qty}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>₹{parseFloat(c.total_value).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {isTransModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card" style={{ width: transType === 'salary_detail' ? '800px' : '400px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>
                                {transType === 'salary_detail' ? `Salary History: ${formData.name}` : `${formData.id ? 'Edit' : 'Add'} ${transType}`}
                            </h3>
                            <button className="btn-icon" onClick={() => setIsTransModalOpen(false)}><X size={20} /></button>
                        </div>

                        {transType === 'salary_detail' ? (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                    <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Total Earnings</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>₹{formData.grand_total.toLocaleString()}</div>
                                    </div>
                                    <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Tasks Done</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formData.history?.length || 0}</div>
                                    </div>
                                    <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Avg. per Task</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{(formData.history?.length ? Math.round(formData.grand_total / formData.history.length) : 0).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>Date</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>Job ID</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>Vehicle</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>Task Details</th>
                                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem' }}>Earned</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.history?.map(row => (
                                                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem' }}>{format(new Date(row.job_date), 'dd MMM yyyy')}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>#{row.job_id}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{row.plate_number}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.item_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'capitalize' }}>{row.category}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                                                        ₹{parseFloat(row.amount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!formData.history || formData.history.length === 0) && (
                                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>No history found for this period.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button className="btn btn-primary" onClick={() => setIsTransModalOpen(false)}>Close Review</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveTransaction}>
                                <div className="input-group"><label>Date</label><input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required /></div>
                                <div className="input-group"><label>Category</label><input list="cats" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required /><datalist id="cats"><option value="Sales" /><option value="Service" /><option value="Rent" /><option value="Salary" /><option value="Electricity" /></datalist></div>
                                <div className="input-group"><label>Amount</label><input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required /></div>
                                <div className="input-group"><label>Payment Mode</label><select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}><option value="cash">Cash</option><option value="online">Online</option><option value="card">Card</option></select></div>
                                <div className="input-group"><label>Description</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}><Save size={18} /> Save</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
