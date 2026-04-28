import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    User, MapPin, Wrench, X, RefreshCw, Search, FileText,
    Calendar, AlertCircle, CheckCircle2, Phone, DollarSign, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';

const Customers = () => {
    const [activeTab, setActiveTab] = useState('All Customers');
    const [customerVehicles, setCustomerVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);

    // CRM State
    const [reminders, setReminders] = useState([]);
    const [dues, setDues] = useState([]);
    const [crmFilters, setCrmFilters] = useState({ status: '', search: '' });

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        mobile: '',
        alternate_number: '',
        address: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'All Customers') fetchCustomerVehicles();
        if (activeTab === 'Service Reminders') fetchReminders();
        if (activeTab === 'Outstanding Dues') fetchDues();
    }, [activeTab, crmFilters]);

    const fetchCustomerVehicles = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/vehicles');
            setCustomerVehicles(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/customers/crm/reminders', { params: crmFilters });
            setReminders(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchDues = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/customers/crm/dues');
            setDues(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const updateReminderStatus = async (jobId, status) => {
        try {
            await axios.patch(`/api/customers/crm/reminders/${jobId}`, { status });
            fetchReminders();
        } catch (err) { console.error(err); }
    };

    // Group vehicles for "All Customers" tab
    const groupedCustomers = Object.values(customerVehicles.reduce((acc, v) => {
        if (!acc[v.customer_id]) {
            acc[v.customer_id] = {
                id: v.customer_id,
                name: v.customer_name,
                mobile: v.customer_mobile,
                alternate_number: v.customer_alternate_number,
                address: v.customer_address,
                vehicle_count: 0,
                vehicles: []
            };
        }
        acc[v.customer_id].vehicle_count++;
        acc[v.customer_id].vehicles.push(v);
        return acc;
    }, {}));

    const filteredCustomers = groupedCustomers.filter(c => {
        const s = (searchTerm || '').toLowerCase();
        return (c.name || '').toLowerCase().includes(s) ||
            (c.mobile || '').toString().includes(s) ||
            c.vehicles.some(v => (v.plate_number || '').toLowerCase().includes(s));
    });

    const handleCustomerClick = (customerData) => {
        setSelectedCustomer(customerData);
        setEditData({
            name: customerData.name || '',
            mobile: customerData.mobile || '',
            alternate_number: customerData.alternate_number || '',
            address: customerData.address || ''
        });
        setIsEditing(false);
        setIsModalOpen(true);
        if (customerData.vehicles?.length > 0) handleVehicleSelect(customerData.vehicles[0].id);
    };

    const handleUpdateCustomer = async () => {
        try {
            await axios.put(`/api/customers/${selectedCustomer.id}`, editData);
            setIsEditing(false);
            fetchCustomerVehicles();
            // Update selected customer state to reflect changes in modal immediately
            setSelectedCustomer({
                ...selectedCustomer,
                name: editData.name,
                mobile: editData.mobile,
                alternate_number: editData.alternate_number,
                address: editData.address
            });
            alert('Customer updated successfully!');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to update customer');
        }
    };

    const handleVehicleSelect = async (vehicleId) => {
        setSelectedVehicleId(vehicleId);
        setLoadingHistory(true);
        try {
            const res = await axios.get(`/api/jobs?vehicleId=${vehicleId}`);
            setHistory(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingHistory(false); }
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>CRM & Customers</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="search-wrapper" style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search customer, mobile, plate..."
                            style={{ paddingLeft: '2.5rem', width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn" onClick={() => { fetchCustomerVehicles(); fetchReminders(); fetchDues(); }}>
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* CRM Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ backgroundColor: 'var(--primary)10', color: 'var(--primary)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                        <User size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Customers</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{groupedCustomers.length}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger)', cursor: 'pointer' }} onClick={() => setActiveTab('Outstanding Dues')}>
                    <div style={{ backgroundColor: 'var(--danger)10', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Outstanding Dues</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{dues.reduce((sum, d) => sum + parseFloat(d.total_due), 0).toLocaleString()}</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)', cursor: 'pointer' }} onClick={() => setActiveTab('Service Reminders')}>
                    <div style={{ backgroundColor: 'var(--warning)10', color: 'var(--warning)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Service Reminders</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{reminders.length}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                {['All Customers', 'Outstanding Dues', 'Service Reminders'].map(tab => (
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
                        {tab === 'Outstanding Dues' && dues.length > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', backgroundColor: 'var(--danger)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>{dues.length}</span>}
                        {tab === 'Service Reminders' && reminders.length > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>{reminders.length}</span>}
                    </button>
                ))}
            </div>

            {activeTab === 'All Customers' && (
                <div className="customer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredCustomers.map(c => (
                        <div key={c.id} className="card" onClick={() => handleCustomerClick(c)} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{c.name}</h4>
                                    <div style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                        {c.mobile}
                                        {c.alternate_number && <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>| {c.alternate_number}</span>}
                                    </div>
                                </div>
                                <div style={{ backgroundColor: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                    {c.vehicle_count}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {c.vehicles.map(v => (
                                    <span key={v.id} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg)', borderRadius: '0.4rem', border: '1px solid var(--border)' }}>
                                        {v.plate_number}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'Outstanding Dues' && (
                <div className="card" style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Mobile</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Job Cards</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Total Due</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dues.map(due => (
                                <tr key={due.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{due.name}</td>
                                    <td style={{ padding: '1rem' }}>{due.mobile}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{due.pending_jobs}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>₹{parseFloat(due.total_due).toLocaleString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <button className="btn" onClick={() => {
                                            setSearchTerm(due.mobile);
                                            setActiveTab('All Customers');
                                        }}>View History</button>
                                    </td>
                                </tr>
                            ))}
                            {dues.length === 0 && <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>No outstanding dues found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Service Reminders' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Filter size={18} color="var(--secondary)" />
                        <select value={crmFilters.status} onChange={e => setCrmFilters({ ...crmFilters, status: e.target.value })} style={{ minWidth: '150px' }}>
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="reminded">Reminded</option>
                            <option value="booked">Booked</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            placeholder="Filter by plate or name..."
                            value={crmFilters.search}
                            onChange={e => setCrmFilters({ ...crmFilters, search: e.target.value })}
                            style={{ flex: 1 }}
                        />
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Next Service</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Customer & Vehicle</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Days Left</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reminders.map(rem => {
                                    const daysLeft = differenceInDays(new Date(rem.next_service_date), new Date());
                                    return (
                                        <tr key={rem.job_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 700 }}>{format(new Date(rem.next_service_date), 'dd MMM yyyy')}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Based on Job #{rem.job_id}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{rem.customer_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{rem.plate_number} • {rem.brand_name} {rem.model_name}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <select
                                                    value={rem.service_reminder_status}
                                                    onChange={e => updateReminderStatus(rem.job_id, e.target.value)}
                                                    style={{
                                                        padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.8rem',
                                                        backgroundColor: rem.service_reminder_status === 'booked' ? 'var(--success)20' : 'var(--bg)',
                                                        color: rem.service_reminder_status === 'booked' ? 'var(--success)' : 'inherit'
                                                    }}
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="reminded">Reminded</option>
                                                    <option value="booked">Booked</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: daysLeft <= 3 ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--success)'
                                                }}>
                                                    {daysLeft === 0 ? 'Today' : daysLeft < 0 ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <a href={`tel:${rem.customer_mobile}`} className="btn" style={{ padding: '0.4rem' }}>
                                                        <Phone size={16} />
                                                    </a>
                                                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => updateReminderStatus(rem.job_id, 'reminded')}>
                                                        Mark Reminded
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {reminders.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>No upcoming services scheduled.</div>}
                    </div>
                </div>
            )}

            {/* Modal remains similar but simplified */}
            {isModalOpen && selectedCustomer && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)}>
                    <div style={{ width: '700px', maxWidth: '95%', maxHeight: '90vh', backgroundColor: 'var(--bg)', borderRadius: '1rem', padding: '2rem', position: 'relative', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
                                <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--primary)10', color: 'var(--primary)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={40} />
                                </div>
                                {isEditing ? (
                                    <div style={{ display: 'grid', gap: '0.5rem', flex: 1 }}>
                                        <input
                                            value={editData.name}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            placeholder="Customer Name"
                                            style={{ fontSize: '1.25rem', fontWeight: 700, width: '100%' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                value={editData.mobile}
                                                onChange={e => setEditData({ ...editData, mobile: e.target.value })}
                                                placeholder="Mobile Number"
                                                maxLength={10}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                value={editData.alternate_number}
                                                onChange={e => setEditData({ ...editData, alternate_number: e.target.value })}
                                                placeholder="Alt Number"
                                                maxLength={10}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                        <textarea
                                            value={editData.address}
                                            onChange={e => setEditData({ ...editData, address: e.target.value })}
                                            placeholder="Address"
                                            rows={2}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h2 style={{ margin: 0 }}>{selectedCustomer.name}</h2>
                                        <p style={{ color: 'var(--primary)', fontWeight: 600, margin: '0.2rem 0' }}>
                                            {selectedCustomer.mobile}
                                            {selectedCustomer.alternate_number && <span style={{ color: 'var(--secondary)', fontWeight: 400, marginLeft: '0.5rem' }}>| Alt: {selectedCustomer.alternate_number}</span>}
                                        </p>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{selectedCustomer.address || 'No address provided'}</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                {isEditing ? (
                                    <>
                                        <button className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button className="btn btn-primary" onClick={handleUpdateCustomer}>Save</button>
                                    </>
                                ) : (
                                    <button className="btn" onClick={() => setIsEditing(true)}>Edit Details</button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
                            {selectedCustomer.vehicles.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleVehicleSelect(v.id)}
                                    style={{
                                        padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)',
                                        backgroundColor: selectedVehicleId === v.id ? 'var(--primary)10' : 'var(--bg)',
                                        borderColor: selectedVehicleId === v.id ? 'var(--primary)' : 'var(--border)',
                                        minWidth: '150px', textAlign: 'left', cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ fontWeight: 700, color: selectedVehicleId === v.id ? 'var(--primary)' : 'inherit' }}>{v.plate_number}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{v.model_name}</div>
                                </button>
                            ))}
                        </div>

                        <div className="card" style={{ padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: 'var(--bg)' }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Job #</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Paid</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Due</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(job => (
                                        <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem' }}>{format(new Date(job.job_date), 'dd MMM yy')}</td>
                                            <td style={{ padding: '0.75rem' }}>#{job.id}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{job.total_amount}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--success)' }}>₹{job.paid_amount}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: job.total_amount - job.paid_amount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                                ₹{job.total_amount - job.paid_amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
