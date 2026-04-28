import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Search, Filter, Printer, Trash2, RotateCcw,
    FileText, Calendar, Box, Users, UserCheck, Shield
} from 'lucide-react';

const Workshop = () => {
    const [activeTab, setActiveTab] = useState('Service History');
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [deletedRecords, setDeletedRecords] = useState({});

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        search: ''
    });

    useEffect(() => {
        if (activeTab === 'Service History') fetchHistory();
        if (activeTab === 'Deleted Records') fetchDeleted();
    }, [activeTab, filters]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/workshop/service-history', { params: filters });
            setHistory(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchDeleted = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/workshop/deleted-records');
            setDeletedRecords(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRestore = async (type, id) => {
        if (!window.confirm('Are you sure you want to restore this record?')) return;
        try {
            await axios.post(`/api/workshop/restore/${type}/${id}`);
            fetchDeleted();
            alert('Record restored successfully!');
        } catch (err) { console.error(err); }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <style>
                {`
                @media print {
                    @page { margin: 1cm; size: landscape; }
                    body { visibility: hidden; background: white !important; }
                    .print-section { 
                        visibility: visible; 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        color: black !important;
                    }
                    .no-print { display: none !important; }
                    .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
                    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                    th, td { border: 1px solid #ddd !important; padding: 8px !important; font-size: 10pt !important; text-align: left !important; color: black !important; }
                    th { backgroundColor: #f2f2f2 !important; font-weight: bold !important; }
                    .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .report-header h1 { margin: 0; font-size: 18pt; }
                    .report-header p { margin: 5px 0; font-size: 10pt; }
                }
                `}
            </style>

            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Workshop Management</h2>
                {activeTab === 'Service History' && (
                    <button className="btn" onClick={handlePrint} style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                        <Printer size={18} /> Print Official Report
                    </button>
                )}
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                {['Service History', 'Deleted Records'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: 'none',
                            backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--secondary)',
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Service History' && (
                <div className="print-section">
                    <div className="report-header" style={{ display: 'none' }}>
                        <h1>SHINE TECH BIKEZ - WORKSHOP REPORT</h1>
                        <p>Date Range: {filters.startDate || 'All Time'} to {filters.endDate || 'Present'}</p>
                        <p>Generated on: {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
                    </div>
                    {/* Native print engine will show this block only */}
                    <style>{`@media print { .report-header { display: block !important; } }`}</style>

                    <div className="no-print" style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.4rem' }}>Search</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                    <input type="text" placeholder="Plate, Name, Mobile..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} style={{ paddingLeft: '2.5rem', width: '100%' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.4rem' }}>Status</label>
                                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.4rem' }}>From</label>
                                <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'block', marginBottom: '0.4rem' }}>To</label>
                                <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Job #</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Vehicle</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(job => (
                                    <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 700 }}>#{job.id}</td>
                                        <td style={{ padding: '1rem' }}>{format(new Date(job.job_date), 'dd MMM yyyy')}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{job.customer_mobile}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{job.plate_number}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{job.brand_name} {job.model_name}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700,
                                                backgroundColor: job.status === 'delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                                                color: job.status === 'delivered' ? 'var(--success)' : 'var(--primary)',
                                                textTransform: 'capitalize'
                                            }}>{job.status}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(job.total_amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'Deleted Records' && (
                <div className="no-print" style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--danger)' }}>
                        <Shield size={20} />
                        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>System Audit: These records were deleted and can be restored if needed.</p>
                    </div>
                    {Object.keys(deletedRecords).map(table => (
                        deletedRecords[table]?.length > 0 && (
                            <div key={table} className="card" style={{ padding: 0 }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg)' }}>
                                    <h4 style={{ textTransform: 'capitalize' }}>{table.replace('_', ' ')}</h4>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {deletedRecords[table].map(record => (
                                            <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem', width: '60px' }}>
                                                    {table === 'job_cards' && <FileText size={18} color="var(--secondary)" />}
                                                    {table === 'inventory_items' && <Box size={18} color="var(--secondary)" />}
                                                    {table === 'customers' && <Users size={18} color="var(--secondary)" />}
                                                    {table === 'staff' && <UserCheck size={18} color="var(--secondary)" />}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{record.name || record.item_name || record.plate_number || `Record #${record.id}`}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{record.created_at ? `Created: ${format(new Date(record.created_at), 'dd MMM yy')}` : ''}</div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button className="btn" onClick={() => handleRestore(table, record.id)} style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                        <RotateCcw size={14} style={{ marginRight: '0.4rem' }} /> Restore
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};

export default Workshop;
