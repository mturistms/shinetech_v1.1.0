import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ClipboardList, Wrench, Calendar, CheckCircle, RefreshCw, X, User, MapPin, Shield, Activity, FileWarning, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
            padding: '1rem',
            borderRadius: '1rem',
            backgroundColor: `${color}20`,
            color: color
        }}>
            <Icon size={24} />
        </div>
        <div>
            <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.875rem' }}>{title}</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        todayIncome: 0,
        todayExpense: 0,
        activeJobs: 0,
        underServicing: 0,
        nextDayDelivery: 0,
        upcomingDelivery: 0,
        readyForCollection: 0,
        paymentProcessing: 0,
        partiallyPaid: 0,
        completedService: 0,
        reminders: {
            service: 0,
            insurance: 0,
            pollution: 0,
            registration: 0,
            duePayment: 0
        },
        chartData: []
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalJobs, setModalJobs] = useState([]);
    const [loadingModal, setLoadingModal] = useState(false);
    const [modalSearch, setModalSearch] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/dashboard/stats');
            setStats({
                todayIncome: res.data.todayIncome,
                todayExpense: res.data.todayExpense,
                activeJobs: res.data.activeJobs,
                underServicing: res.data.underServicing || 0,
                nextDayDelivery: res.data.nextDayDelivery || 0,
                upcomingDelivery: res.data.upcomingDelivery || 0,
                readyForCollection: res.data.readyForCollection || 0,
                paymentProcessing: res.data.paymentProcessing || 0,
                partiallyPaid: res.data.partiallyPaid || 0,
                completedService: res.data.completedService || 0,
                monthJobs: res.data.monthJobs || 0,
                reminders: res.data.reminders || { service: 0, insurance: 0, pollution: 0, registration: 0, duePayment: 0 },
                chartData: res.data.chartData || []
            });
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const handleCardClick = async (title, statusParam) => {
        setModalTitle(title);
        setIsModalOpen(true);
        setLoadingModal(true);
        setModalJobs([]);
        setModalSearch('');

        try {
            const res = await axios.get('/api/jobs');
            const allJobs = res.data;
            let filtered = [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (statusParam === 'under_servicing') {
                filtered = allJobs.filter(j => j.status === 'pending' || j.status === 'in_progress');
            } else if (statusParam === 'ready') {
                filtered = allJobs.filter(j => j.status === 'completed');
            } else if (statusParam === 'delivered') {
                filtered = allJobs.filter(j => j.status === 'delivered');
            } else if (statusParam === 'next_day') {
                filtered = allJobs.filter(j => {
                    if (!j.expected_delivery || j.status === 'delivered') return false;
                    const exp = new Date(j.expected_delivery);
                    const diffTime = exp - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 2;
                });
            } else if (statusParam === 'upcoming') {
                filtered = allJobs.filter(j => {
                    if (!j.expected_delivery || j.status === 'delivered') return false;
                    const exp = new Date(j.expected_delivery);
                    const diffTime = exp - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays > 10;
                });
            } else if (statusParam === 'partially_paid') {
                filtered = allJobs.filter(j => {
                    const paid = parseFloat(j.paid_amount) || 0;
                    const total = parseFloat(j.total_amount) || 0;
                    return paid > 0 && paid < total && j.status !== 'delivered';
                });
            } else if (statusParam === 'service_reminder') {
                filtered = allJobs.filter(j => j.status === 'delivered' && j.next_service_date && new Date(j.next_service_date) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
            } else if (statusParam === 'insurance_reminder') {
                filtered = allJobs.filter(j => j.insurance_expiry && new Date(j.insurance_expiry) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
            } else if (statusParam === 'pollution_reminder') {
                filtered = allJobs.filter(j => j.pollution_expiry && new Date(j.pollution_expiry) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
            } else if (statusParam === 'reg_reminder') {
                filtered = allJobs.filter(j => j.registration_expiry && new Date(j.registration_expiry) <= new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000));
            } else if (statusParam === 'due_payment') {
                filtered = allJobs.filter(j => j.paid_amount < j.total_amount && j.due_reminder_date && new Date(j.due_reminder_date) <= today);
            }

            setModalJobs(filtered);
            setLoadingModal(false);
        } catch (err) {
            console.error(err);
            setLoadingModal(false);
        }
    };

    // Filtered modal jobs for search
    const filteredModalJobs = modalJobs.filter(job => {
        const search = modalSearch.toLowerCase();
        return (
            (job.plate_number || '').toLowerCase().includes(search) ||
            (job.customer_mobile || '').toLowerCase().includes(search) ||
            (job.customer_name || '').toLowerCase().includes(search)
        );
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Dashboard</h1>
                <button className="btn" onClick={fetchStats} title="Refresh Stats">
                    <RefreshCw size={20} />
                </button>
            </div>

            <style>{`
                .minicard {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 140px;
                }
                .minicard:hover {
                    border-color: var(--primary);
                    transform: translateY(-3px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .minicard-label {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--secondary);
                    line-height: 1.3;
                }
                .minicard-value {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: var(--text);
                }
                .clickable-row {
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .clickable-row:hover {
                    background-color: var(--primary)05 !important;
                }
                @media (max-width: 600px) {
                    .minicard {
                        padding: 1rem;
                    }
                    .minicard-value {
                        font-size: 1.5rem;
                    }
                    .minicard-label {
                        font-size: 0.75rem;
                    }
                }
            `}</style>

            {/* Cards and existing content... (unchanged) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="minicard" style={{ borderLeft: '4px solid #3b82f6' }} onClick={() => handleCardClick('Under Servicing', 'under_servicing')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#3b82f6' }}><Wrench size={24} /></div>
                        <div className="minicard-label">Under<br />Servicing</div>
                    </div>
                    <div className="minicard-value">{stats.underServicing || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #f97316' }} onClick={() => handleCardClick('Next Day Delivery', 'next_day')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#f97316' }}><Calendar size={24} /></div>
                        <div className="minicard-label">Next Day<br />Delivery</div>
                    </div>
                    <div className="minicard-value">{stats.nextDayDelivery || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #8b5cf6' }} onClick={() => handleCardClick('Upcoming Delivery', 'upcoming')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#8b5cf6' }}><ClipboardList size={24} /></div>
                        <div className="minicard-label">Upcoming<br />Delivery</div>
                    </div>
                    <div className="minicard-value">{stats.upcomingDelivery || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #22c55e' }} onClick={() => handleCardClick('Ready for Delivery', 'ready')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#22c55e' }}><CheckCircle size={24} /></div>
                        <div className="minicard-label">Ready for<br />Delivery</div>
                    </div>
                    <div className="minicard-value">{stats.readyForCollection || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #eab308' }} onClick={() => handleCardClick('Payment Processing', 'ready')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#eab308' }}><DollarSign size={24} /></div>
                        <div className="minicard-label">Payment<br />Processing</div>
                    </div>
                    <div className="minicard-value">{stats.paymentProcessing || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #f97316' }} onClick={() => handleCardClick('Partially Paid', 'partially_paid')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#f97316' }}><DollarSign size={24} /></div>
                        <div className="minicard-label">Partially<br />Paid</div>
                    </div>
                    <div className="minicard-value">{stats.partiallyPaid || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #64748b' }} onClick={() => handleCardClick('Completed Service', 'delivered')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#64748b' }}><ClipboardList size={24} /></div>
                        <div className="minicard-label">Completed<br />Service</div>
                    </div>
                    <div className="minicard-value">{stats.completedService || 0}</div>
                </div>
            </div>

            {/* Reminders Section */}
            <h3 style={{ marginBottom: '1.25rem', color: 'var(--text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--primary)" />
                Vehicle Compliance & Reminders
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="minicard" style={{ borderLeft: '4px solid #ef4444', backgroundColor: stats.reminders?.service > 0 ? '#fee2e240' : 'transparent' }} onClick={() => handleCardClick('Service Reminders', 'service_reminder')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#ef4444' }}><Wrench size={20} /></div>
                        <div className="minicard-label">Next Service<br />Reminders</div>
                    </div>
                    <div className="minicard-value" style={{ color: '#ef4444' }}>{stats.reminders?.service || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #f97316' }} onClick={() => handleCardClick('Insurance Reminders', 'insurance_reminder')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#f97316' }}><Shield size={20} /></div>
                        <div className="minicard-label">Insurance<br />Expiring</div>
                    </div>
                    <div className="minicard-value" style={{ color: '#f97316' }}>{stats.reminders?.insurance || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #3b82f6' }} onClick={() => handleCardClick('Pollution Reminders', 'pollution_reminder')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#3b82f6' }}><Activity size={20} /></div>
                        <div className="minicard-label">Pollution<br />Expiring</div>
                    </div>
                    <div className="minicard-value" style={{ color: '#3b82f6' }}>{stats.reminders?.pollution || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #8b5cf6' }} onClick={() => handleCardClick('Reg. Reminders', 'reg_reminder')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#8b5cf6' }}><FileWarning size={20} /></div>
                        <div className="minicard-label">Registration<br />Expiring</div>
                    </div>
                    <div className="minicard-value" style={{ color: '#8b5cf6' }}>{stats.reminders?.registration || 0}</div>
                </div>

                <div className="minicard" style={{ borderLeft: '4px solid #dc2626', backgroundColor: stats.reminders?.duePayment > 0 ? '#fcc' : 'transparent' }} onClick={() => handleCardClick('Due Payment Reminders', 'due_payment')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#dc2626' }}><AlertTriangle size={20} /></div>
                        <div className="minicard-label">Due Payment<br />Reminders</div>
                    </div>
                    <div className="minicard-value" style={{ color: '#dc2626' }}>{stats.reminders?.duePayment || 0}</div>
                </div>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setIsModalOpen(false)}>
                    <div style={{
                        width: '850px', maxWidth: '95%', maxHeight: '90vh',
                        backgroundColor: 'var(--bg)', borderRadius: '1rem',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border)',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', whiteSpace: 'nowrap' }}>{modalTitle}</h2>
                                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                    <input
                                        type="text"
                                        placeholder="Search Ph / Vehicle..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.85rem',
                                            width: '100%',
                                            height: '38px'
                                        }}
                                    />
                                </div>
                            </div>
                            <button className="btn" onClick={() => setIsModalOpen(false)} style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '0', overflowY: 'auto' }}>
                            {loadingModal ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', opacity: 0.5 }} />
                                    <p style={{ marginTop: '1rem', color: 'var(--secondary)' }}>Fetching data...</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg)', zIndex: 1 }}>
                                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--secondary)' }}>
                                                <th style={{ padding: '1rem' }}>Job ID</th>
                                                <th style={{ padding: '1rem' }}>Customer</th>
                                                <th style={{ padding: '1rem' }}>Vehicle</th>
                                                <th style={{ padding: '1rem' }}>Model</th>
                                                <th style={{ padding: '1rem' }}>Status</th>
                                                <th style={{ padding: '1rem' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredModalJobs.map(job => (
                                                <tr
                                                    key={job.id}
                                                    className="clickable-row"
                                                    style={{ borderBottom: '1px solid var(--border)' }}
                                                    onClick={() => navigate(`/jobs/${job.id}/estimation`)}
                                                >
                                                    <td style={{ padding: '1rem' }}>#{job.id}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div>{job.customer_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{job.customer_mobile}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{job.plate_number}</td>
                                                    <td style={{ padding: '1rem' }}>{job.model_name}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '0.4rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            backgroundColor: job.status === 'completed' ? '#22c55e20' :
                                                                job.status === 'delivered' ? '#3b82f620' : '#eab30820',
                                                            color: job.status === 'completed' ? '#22c55e' :
                                                                job.status === 'delivered' ? '#3b82f6' : '#eab308'
                                                        }}>
                                                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{job.total_amount || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredModalJobs.length === 0 && (
                                        <div style={{ textAlign: 'center', color: 'var(--secondary)', padding: '3rem' }}>
                                            No jobs found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Income & Expenses (Last 7 Days)</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData || []}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: 'var(--text)' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
