import React from 'react';
import { User, Phone, Settings, MapPin, Receipt, FileText, CreditCard, Clock, Wrench, CheckCircle, ClipboardCheck, Edit2, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './JobCardItem.css';

const JobCardItem = ({ job, onRefresh }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        name: '',
        mobile: '',
        address: ''
    });

    // Payment Modal State
    const [paymentAmount, setPaymentAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('gpay');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    const [upiId, setUpiId] = React.useState('9446569314-1@okbizaxis'); // Store your UPI ID here

    // Mechanic Edit State
    const [isMechanicModalOpen, setIsMechanicModalOpen] = React.useState(false);
    const [mechanics, setMechanics] = React.useState([]);
    const [selectedMechanicId, setSelectedMechanicId] = React.useState('');
    const [loadingMechanics, setLoadingMechanics] = React.useState(false);

    // Gate Pass Modal State
    const [isGatePassModalOpen, setIsGatePassModalOpen] = React.useState(false);
    const [gatePassFormData, setGatePassFormData] = React.useState({
        next_service_months: '3',
        next_service_custom: '',
        insurance_expiry: '',
        pollution_expiry: '',
        registration_expiry: '',
        due_reminder_date: ''
    });

    const handleEditClick = (e) => {
        e.stopPropagation(); // Prevent bubbling if needed

        // Block editing if job is completed or delivered
        if (['completed', 'delivered'].includes(job.status)) {
            alert("⚠️ READ-ONLY\n\nThis job is already completed or delivered. Customer details cannot be edited unless the job is remitted.");
            return;
        }

        // Assuming job object has customer_id. The route job/:id usually joins tables.
        // We need customer id. In jobs.js GET /:id, we select c.name, mobile, address.
        // We do not strictly have c.id in the response of GET /api/jobs list unless we added it.
        // Check filtering/GET list items in jobs.js: `SELECT j.*, v.plate_number, v.model_name, c.name as customer_name`.
        // We need customer_id in the Join.
        // Wait, 'j' has vehicle_id. 'v' has customer_id.
        // The list query `SELECT j.*` includes `j` fields.
        // We need to ensure we have customer id from vehicle.

        // Let's assume we might need to fetch it or it's there.
        // Actually, looking at jobs.js list query: `SELECT j.*, v.plate_number...`
        // It does NOT select v.customer_id explicitly unless j.* has it? No, j has vehicle_id. v has customer_id.

        // We need to patch jobs.js to return customer_id in the list response, OR fetch it here.
        // Let's proceed assuming we will fix jobs.js to return customer_id as well.

        setEditForm({
            name: job.customer_name || '',
            mobile: job.customer_mobile || '',
            // jobs.js list query: `SELECT j.*, v.plate_number, v.model_name, c.name as customer_name` 
            // It MISSES mobile and address in the list view!
            // Address is used in code `job.customer_address`. 
            // If `job.customer_address` works, then it must be in the query or I missed it.
            // Let's check the code I read earlier.
            // ... `SELECT j.*, v.plate_number, v.model_name, c.name as customer_name` -> NO ADDRESS/MOBILE in list!

            // So currently `job.customer_address` in the component is likely undefined/null!
            // I should fix the query in jobs.js first to return all customer details.
            address: job.customer_address || ''
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // We need customer ID.
            if (!job.customer_id) {
                alert("Missing Customer ID to update");
                return;
            }
            await axios.put(`/api/customers/${job.customer_id}`, editForm);
            setIsEditing(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert("Error updating customer");
        }
    };

    const handlePayClick = () => {
        const dueAmount = (job.total_amount - job.paid_amount) || 0;
        setPaymentAmount(dueAmount.toString());
        setIsPaymentModalOpen(true);
    };

    const handleGooglePayClick = () => {
        const amount = parseFloat(paymentAmount) || 0;
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        // Replace with your actual UPI ID
        const merchantUPI = upiId || '9446569314-1@okbizaxis'; // Change this to your UPI ID
        const merchantName = 'Shine Tech Bikez';
        const transactionNote = `Job #${job.id} - ${job.plate_number}`;

        // Generate UPI payment link
        const upiLink = `upi://pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

        // Open UPI link (will open Google Pay or other UPI apps)
        window.location.href = upiLink;

        // Show confirmation message
        setTimeout(() => {
            if (window.confirm('Have you completed the payment? Click OK to record this payment.')) {
                handleRecordPayment(amount, 'gpay');
            }
        }, 3000);
    };

    const handleRecordPayment = async (amount, method) => {
        try {
            const payAmount = parseFloat(amount) || 0;
            if (payAmount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            await axios.post(`/api/jobs/${job.id}/pay`, {
                amount: payAmount,
                payment_method: method
            });

            alert('Payment recorded successfully!');
            setIsPaymentModalOpen(false);
            setPaymentAmount('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert('Error recording payment: ' + (err.response?.data?.msg || 'Unknown error'));
        }
    };

    const handleInvoiceClick = async () => {
        if (!['completed', 'delivered'].includes(job.status)) {
            alert("Invoice can only be generated after service completion (Finish).");
            return;
        }
        try {
            await axios.post(`/api/jobs/${job.id}/generate-invoice`);
            navigate(`/print/invoice/${job.id}`);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            navigate(`/print/invoice/${job.id}`);
        }
    };

    const handleGatePassClick = () => {
        // STRICT VALIDATION 1: Check if Invoice is generated
        if (!job.is_invoice_generated) {
            alert('⚠️ GATE PASS BLOCKED\n\nInvoice must be generated first!\n\n✗ Invoice not generated\n\nPlease generate the invoice before creating a gate pass.');
            return;
        }

        const dueAmount = (job.total_amount || 0) - (job.paid_amount || 0);
        if (dueAmount > 0) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setGatePassFormData(prev => ({
                ...prev,
                due_reminder_date: nextWeek.toISOString().split('T')[0]
            }));
        }

        setIsGatePassModalOpen(true);
    };

    const submitGatePass = async (e) => {
        e.preventDefault();

        let nextServiceDate = null;
        if (gatePassFormData.next_service_months === 'custom') {
            nextServiceDate = gatePassFormData.next_service_custom;
        } else {
            const date = new Date();
            date.setMonth(date.getMonth() + parseInt(gatePassFormData.next_service_months));
            nextServiceDate = date.toISOString().split('T')[0];
        }

        try {
            await axios.post(`/api/jobs/${job.id}/generate-gate-pass`, {
                next_service_date: nextServiceDate,
                insurance_expiry: gatePassFormData.insurance_expiry,
                pollution_expiry: gatePassFormData.pollution_expiry,
                registration_expiry: gatePassFormData.registration_expiry,
                due_reminder_date: gatePassFormData.due_reminder_date
            });
            alert("✓ Vehicle Released Successfully!");
            setIsGatePassModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleMechanicEditClick = async (e) => {
        e.stopPropagation();
        setLoadingMechanics(true);
        try {
            // Fetch active mechanics from staff (following staff management workflow)
            const res = await axios.get('/api/staff');
            // Filter for active staff excluding managers (case-insensitive)
            const activeEmployees = res.data.filter(m =>
                m.status && m.status.toLowerCase() === 'active' &&
                m.designation && m.designation.toLowerCase() !== 'manager'
            );
            console.log('All staff:', res.data);
            console.log('Filtered mechanics:', activeEmployees);
            setMechanics(activeEmployees);
            setSelectedMechanicId(job.mechanic_id || '');
            setIsMechanicModalOpen(true);
        } catch (err) {
            console.error(err);
            alert("Error loading mechanics. Please try again.");
        } finally {
            setLoadingMechanics(false);
        }
    };

    const handleMechanicSave = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/jobs/${job.id}`, { mechanic_id: selectedMechanicId || null });
            setIsMechanicModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert("Error updating mechanic assignment");
        }
    };

    const handleReceivePayment = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid payment amount.");
            return;
        }

        try {
            await axios.post(`/api/jobs/${job.id}/pay`, {
                amount: amount,
                payment_method: paymentMethod
            });
            alert("✓ Payment Received!");
            setIsPaymentModalOpen(false);
            setPaymentAmount('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert("Error recording payment: " + (err.response?.data?.message || err.message));
        }
    };


    return (
        <div className="job-card-item">
            {/* Header: Vehicle Info */}
            <div className="jc-header">
                <div className="vehicle-info">
                    <div style={{ backgroundColor: '#22c55e20', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <Wrench size={20} color="#22c55e" />
                    </div>
                    {/* Clickable Area for Edit */}
                    <div
                        onClick={handleEditClick}
                        style={{
                            cursor: ['completed', 'delivered'].includes(job.status) ? 'not-allowed' : 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            opacity: ['completed', 'delivered'].includes(job.status) ? 0.8 : 1
                        }}
                        title={['completed', 'delivered'].includes(job.status) ? "Completed Jobs are Read-Only" : "Click to Edit Customer"}
                    >
                        <div className="plate-number">{job.plate_number} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--secondary)' }}>({job.customer_address || 'N/A'})</span></div>
                        <div className="model-name">{job.model_name}</div>
                    </div>
                </div>
                <div className="km-info">
                    <Clock size={16} />
                    <span>Job #{job.id}</span>
                </div>
            </div>

            {/* Edit Modal (Inline Simple) */}
            {isEditing && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%', animation: 'none' }}>
                        <h3>Edit Customer</h3>
                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label className="input-label">Name</label>
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Mobile</label>
                                <input
                                    value={editForm.mobile}
                                    onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <input
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Body: Customer Details & Quick Actions */}
            <div className="jc-body">
                {/* Customer Details */}
                <div className="customer-grid">
                    <div className="info-box">
                        <div className="info-icon"><User size={16} /></div>
                        <div className="info-text">
                            <small>Customer Name</small>
                            <div>{job.customer_name}</div>
                        </div>
                    </div>
                    <div className="info-box">
                        <div className="info-icon"><Phone size={16} /></div>
                        <div className="info-text">
                            <small>Phone Number</small>
                            <div>{job.customer_mobile || 'N/A'}</div>
                            {job.customer_alt_mobile && <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{job.customer_alt_mobile}</div>}
                        </div>
                    </div>
                    <div className="info-box">
                        <div className="info-icon"><Settings size={16} /></div>
                        <div className="info-text">
                            <small>Mechanic</small>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                                <span>{job.mechanic_name || 'Unassigned'}</span>
                                {!['completed', 'delivered'].includes(job.status) && (
                                    <button
                                        onClick={handleMechanicEditClick}
                                        disabled={loadingMechanics}
                                        style={{
                                            padding: '4px 8px',
                                            border: 'none',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            borderRadius: '6px',
                                            cursor: loadingMechanics ? 'wait' : 'pointer',
                                            color: '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s ease',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!loadingMechanics) {
                                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        title="Edit mechanic assignment"
                                    >
                                        <Edit2 size={12} />
                                        <span>Edit</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="info-box">
                        <div className="info-icon"><MapPin size={16} /></div>
                        <div className="info-text">
                            <small>Location</small>
                            <div>{job.customer_address || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Icons) */}
                <div className="actions-grid">
                    <button className="action-btn" onClick={() => navigate(`/jobs/${job.id}/estimation`)}>
                        <div className="action-icon"><FileText size={20} /></div>
                        <span className="action-label">Service</span>
                    </button>
                    <button className="action-btn" onClick={() => navigate(`/print/jobcard/${job.id}`)}>
                        <div className="action-icon"><ClipboardCheck size={20} /></div>
                        <span className="action-label">Job Card</span>
                    </button>
                    <button className="action-btn" onClick={handlePayClick}>
                        <div className="action-icon"><CreditCard size={20} /></div>
                        <span className="action-label">Pay</span>
                    </button>
                    <button
                        className="action-btn"
                        onClick={handleInvoiceClick}
                        style={{
                            opacity: ['completed', 'delivered'].includes(job.status) ? 1 : 0.4,
                            cursor: ['completed', 'delivered'].includes(job.status) ? 'pointer' : 'not-allowed'
                        }}
                        title={!['completed', 'delivered'].includes(job.status) ? "Finish service first to generate invoice" : ""}
                    >
                        <div className="action-icon"><Receipt size={20} /></div>
                        <span className="action-label">Invoice</span>
                    </button>
                    {['completed', 'delivered'].includes(job.status) && (
                        <button className="action-btn" onClick={handleGatePassClick}>
                            <div className="action-icon" style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}>
                                <CheckCircle size={20} />
                            </div>
                            <span className="action-label">Gate Pass</span>
                        </button>
                    )}
                    {(job.status === 'pending' || job.status === 'in_progress') && (
                        <button className="action-btn" onClick={async (e) => {
                            e.stopPropagation();

                            // STRICT VALIDATION: Check if Tech is assigned
                            if (!job.mechanic_id) {
                                alert('⚠️ CANNOT FINISH\n\nTechnician must be assigned first!\n\n✗ No mechanic assigned\n\nPlease assign a mechanic before marking as finished.');
                                return;
                            }

                            // STRICT VALIDATION: Check if Parts are allocated
                            const itemCount = parseInt(job.item_count) || 0;
                            if (itemCount === 0) {
                                alert('⚠️ CANNOT FINISH\n\nSpare parts must be allocated first!\n\n✗ No items/parts added\n\nPlease add spare parts or services in the Job Estimation page before marking as finished.');
                                return;
                            }

                            if (!window.confirm('Mark this job as Finished / Ready to Deliver?')) return;
                            try {
                                await axios.put(`/api/jobs/${job.id}`, { status: 'completed' }); // Using 'completed' as "finished/ready"
                                if (onRefresh) onRefresh();
                            } catch (err) {
                                console.error(err);
                                alert('Failed to update status');
                            }
                        }}>
                            <div className="action-icon" style={{ backgroundColor: '#eab30820', color: '#eab308' }}>
                                <CheckCircle size={20} />
                            </div>
                            <span className="action-label">Finish</span>
                        </button>
                    )}
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); window.open(`/print/proforma/${job.id}`, '_blank'); }}>
                        <div className="action-icon" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                            <FileText size={20} />
                        </div>
                        <span className="action-label">Statement</span>
                    </button>
                </div>
            </div>

            {/* Footer: Progress Timeline & Financials */}
            <div className="jc-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem' }}>
                {/* Progress Timeline */}
                <div className="jc-timeline">
                    <div className="timeline-track">
                        {/* DOA */}
                        <div className="timeline-step completed">
                            <div className="step-dot" style={{
                                fontSize: '0.5rem',
                                backgroundColor: (() => {
                                    if (job.status === 'delivered' || !job.expected_delivery) return '#22c55e';
                                    const diff = new Date(job.expected_delivery) - new Date();
                                    return diff > 0 && diff < 5 * 60 * 60 * 1000 ? '#ef4444' : '#22c55e';
                                })(),
                                color: 'white'
                            }}>DOA</div>
                            <div className="step-label" style={{ color: 'var(--secondary)' }}>
                                {job.job_date ? new Date(job.job_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : 'N/A'}
                            </div>
                        </div>

                        {/* JC - Job Card Created */}
                        <div className="timeline-step completed">
                            <div className="step-dot">JC</div>
                            <div className="step-label">Created</div>
                        </div>

                        {/* TA - Technician Allocated */}
                        <div className={`timeline-step ${job.mechanic_id ? 'completed' : 'active'}`}>
                            <div className="step-dot">TA</div>
                            <div className="step-label">Tech</div>
                        </div>

                        {/* SP - Spare Parts Allocated */}
                        <div className={`timeline-step ${job.item_count > 0 ? 'completed' : (job.mechanic_id ? 'active' : '')}`}>
                            <div className="step-dot">SP</div>
                            <div className="step-label">Parts</div>
                        </div>

                        {/* SC - Service Completed */}
                        <div className={`timeline-step ${['completed', 'delivered'].includes(job.status) ? 'completed' : (job.item_count > 0 ? 'active' : '')}`}>
                            <div className="step-dot">SC</div>
                            <div className="step-label">Finish</div>
                        </div>

                        {/* IG - Invoice Generated */}
                        <div className={`timeline-step ${job.is_invoice_generated ? 'completed' : (['completed', 'delivered'].includes(job.status) ? 'active' : '')}`}>
                            <div className="step-dot">IG</div>
                            <div className="step-label">Invoice</div>
                        </div>

                        {/* PC - Payment Captured (ONLY when FULLY PAID) */}
                        <div className={`timeline-step ${(job.paid_amount >= job.total_amount && job.total_amount > 0) ? 'completed' : (job.is_invoice_generated ? 'active' : '')}`}>
                            <div className="step-dot">PC</div>
                            <div className="step-label">Paid</div>
                        </div>

                        {/* GP - Gate Pass Generated (ONLY after FULL payment) */}
                        <div className={`timeline-step ${job.is_gate_pass_generated ? 'completed' : ((job.paid_amount >= job.total_amount && job.total_amount > 0) ? 'active' : '')}`}>
                            <div className="step-dot">GP</div>
                            <div className="step-label">Gate</div>
                        </div>

                        {/* DOE */}
                        <div className={`timeline-step ${job.status === 'delivered' ? 'completed' : ''}`}>
                            <div className="step-dot" style={{
                                fontSize: '0.5rem',
                                backgroundColor: (() => {
                                    if (job.status === 'delivered' || !job.expected_delivery) return '#22c55e';
                                    const diff = new Date(job.expected_delivery) - new Date();
                                    return diff > 0 && diff < 5 * 60 * 60 * 1000 ? '#ef4444' : '#22c55e';
                                })(),
                                color: 'white'
                            }}>DOE</div>
                            <div className="step-label" style={{ color: 'var(--secondary)' }}>
                                {(job.exit_date || job.expected_delivery)
                                    ? new Date(job.exit_date || job.expected_delivery).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
                                    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="footer-stats">
                        <div className="stat-box">
                            <div className="stat-value" style={{ color: '#22c55e' }}>₹{job.total_amount || 0}</div>
                            <div className="stat-label">Total Bill</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value" style={{ color: '#3b82f6' }}>₹{job.paid_amount || 0}</div>
                            <div className="stat-label">Paid</div>
                            {job.advance_amount > 0 && (
                                <div style={{ fontSize: '0.6rem', color: '#3b82f6' }}>(Inc. ₹{job.advance_amount} Adv)</div>
                            )}
                        </div>
                        <div className="stat-box">
                            <div className="stat-value" style={{ color: (job.total_amount - job.paid_amount) > 0 ? '#ef4444' : '#22c55e' }}>
                                ₹{Math.max(0, job.total_amount - job.paid_amount)}
                            </div>
                            <div className="stat-label">Due</div>
                        </div>
                        {(job.total_amount - job.paid_amount) > 0 && (
                            <button
                                className="btn"
                                onClick={(e) => { e.stopPropagation(); setPaymentAmount(job.total_amount - job.paid_amount); setIsPaymentModalOpen(true); }}
                                style={{
                                    padding: '0.4rem 1rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    borderRadius: '2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <CreditCard size={14} /> Pay Net
                            </button>
                        )}
                    </div>

                    <div className="dates-info" style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: '0.4rem' }}>
                            <strong>EST. Amount:</strong> <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: '1.1rem', marginLeft: '0.5rem' }}>₹{job.estimated_amount || 0}</span>
                        </div>
                        {job.advance_amount > 0 && (
                            <div style={{ marginBottom: '0.4rem' }}>
                                <strong>Advance:</strong> <span style={{ color: '#22c55e', fontWeight: 800, fontSize: '1.1rem', marginLeft: '0.5rem' }}>₹{job.advance_amount}</span>
                            </div>
                        )}
                        <div>
                            <strong>Current Status:</strong> <span style={{
                                textTransform: 'capitalize',
                                color: job.status === 'delivered' ? '#22c55e' : (job.status === 'completed' ? '#3b82f6' : '#eab308'),
                                fontWeight: 700,
                                marginLeft: '0.5rem'
                            }}>{job.status}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mechanic Assignment Modal */}
            {isMechanicModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setIsMechanicModalOpen(false)}>
                    <div className="card" style={{ width: '450px', maxWidth: '90%', animation: 'slideUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings size={24} color="var(--primary)" />
                                Assign Mechanic
                            </h3>
                            <button
                                onClick={() => setIsMechanicModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--secondary)',
                                    lineHeight: 1
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{
                            backgroundColor: 'var(--bg)',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1.5rem',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong>Job #{job.id}</strong> - {job.plate_number}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                {job.model_name}
                            </div>
                        </div>

                        <form onSubmit={handleMechanicSave}>
                            <div className="input-group">
                                <label className="input-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                    Select Mechanic / Technician
                                </label>
                                <select
                                    value={selectedMechanicId}
                                    onChange={e => setSelectedMechanicId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {mechanics.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} {m.phone ? `(${m.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <small style={{ color: 'var(--secondary)', marginTop: '0.5rem', display: 'block' }}>
                                    {mechanics.length === 0 ? 'No active mechanics available. Add mechanics from Staff Management.' : `${mechanics.length} active mechanic(s) available`}
                                </small>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsMechanicModalOpen(false)}
                                    style={{ flex: 1, backgroundColor: 'var(--border)', color: 'var(--text)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'none' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={24} color="var(--primary)" />
                            Payment for Job #{job.id}
                        </h3>

                        {/* Payment Summary */}
                        <div style={{
                            backgroundColor: 'var(--bg)',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1.5rem',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--secondary)' }}>Total Amount:</span>
                                <strong style={{ fontSize: '1.1rem' }}>₹{job.total_amount || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--secondary)' }}>Paid Amount:</span>
                                <strong style={{ color: '#22c55e' }}>₹{job.paid_amount || 0}</strong>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid var(--border)'
                            }}>
                                <span style={{ fontWeight: 600 }}>Due Amount:</span>
                                <strong style={{ fontSize: '1.25rem', color: '#ef4444' }}>
                                    ₹{(job.total_amount - job.paid_amount) || 0}
                                </strong>
                            </div>
                        </div>

                        {/* Payment Amount */}
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label" style={{ fontWeight: 700 }}>Payment Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="Enter amount"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                style={{ fontSize: '1.5rem', fontWeight: 800, padding: '0.75rem', textAlign: 'center' }}
                                min="0"
                            />
                        </div>

                        {/* Payment Method Selection */}
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label">Payment Method</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                {[
                                    { id: 'gpay', label: 'GPAY / UPI' },
                                    { id: 'cash', label: 'Cash' },
                                    { id: 'card', label: 'Card' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(m.id)}
                                        style={{
                                            padding: '0.75rem 0.5rem',
                                            borderRadius: '0.5rem',
                                            border: `2px solid ${paymentMethod === m.id ? 'var(--primary)' : 'var(--border)'}`,
                                            backgroundColor: paymentMethod === m.id ? 'var(--primary)10' : 'var(--card)',
                                            color: paymentMethod === m.id ? 'var(--primary)' : 'var(--secondary)',
                                            fontWeight: 800,
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'gpay' && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1.5rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '1rem',
                                border: '2px solid #e2e8f0',
                                marginBottom: '1.5rem'
                            }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=9446569314-1@okbizaxis&pn=ShineTechBikez&am=${paymentAmount}&cu=INR&tn=Job_${job?.id}`)}`}
                                    alt="UPI QR Code"
                                    style={{ width: '150px', height: '150px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scan to pay with any UPI app</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>9446569314-1@okbizaxis</div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn" style={{ flex: 1 }} onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, backgroundColor: '#22c55e', fontWeight: 700 }}
                                onClick={() => handleRecordPayment(paymentAmount, paymentMethod)}
                            >
                                {paymentMethod === 'gpay' ? 'Payment Confirmed' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Gate Pass / Release Modal */}
            {isGatePassModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setIsGatePassModalOpen(false)}>
                    <div className="card" style={{ width: '500px', maxWidth: '95%', animation: 'slideUp 0.3s ease' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                                <ClipboardCheck size={26} />
                                Release Vehicle & Gate Pass
                            </h3>
                            <button onClick={() => setIsGatePassModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--secondary)' }}>×</button>
                        </div>

                        <form onSubmit={submitGatePass}>
                            {/* Due Amount Section */}
                            {(job.total_amount - job.paid_amount) > 0 && (
                                <div style={{
                                    backgroundColor: '#fff7ed',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #ffedd5',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c', fontWeight: 800, marginBottom: '0.5rem' }}>
                                        <AlertTriangle size={18} />
                                        <span>OUTSTANDING BALANCE: ₹{job.total_amount - job.paid_amount}</span>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="input-label">Remind me to collect due amount on:</label>
                                        <input
                                            type="date"
                                            required
                                            value={gatePassFormData.due_reminder_date}
                                            onChange={e => setGatePassFormData({ ...gatePassFormData, due_reminder_date: e.target.value })}
                                            style={{ borderColor: '#fdba74' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Scheduling Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Next Service Schedule</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                        {['3', '4', '9', 'custom'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setGatePassFormData({ ...gatePassFormData, next_service_months: m })}
                                                style={{
                                                    padding: '0.6rem',
                                                    borderRadius: '0.5rem',
                                                    border: `2px solid ${gatePassFormData.next_service_months === m ? 'var(--primary)' : 'var(--border)'}`,
                                                    backgroundColor: gatePassFormData.next_service_months === m ? 'var(--primary)10' : 'var(--card)',
                                                    color: gatePassFormData.next_service_months === m ? 'var(--primary)' : 'var(--secondary)',
                                                    fontWeight: 800,
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {m === 'custom' ? 'Custom' : `${m} Months`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {gatePassFormData.next_service_months === 'custom' && (
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="input-label">Custom Service Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={gatePassFormData.next_service_custom}
                                            onChange={e => setGatePassFormData({ ...gatePassFormData, next_service_custom: e.target.value })}
                                        />
                                    </div>
                                )}

                                {/* Expiry Dates */}
                                <div className="input-group">
                                    <label className="input-label">Insurance Expiry</label>
                                    <input
                                        type="date"
                                        value={gatePassFormData.insurance_expiry}
                                        onChange={e => setGatePassFormData({ ...gatePassFormData, insurance_expiry: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Pollution Expiry</label>
                                    <input
                                        type="date"
                                        value={gatePassFormData.pollution_expiry}
                                        onChange={e => setGatePassFormData({ ...gatePassFormData, pollution_expiry: e.target.value })}
                                    />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Registration Validity</label>
                                    <input
                                        type="date"
                                        value={gatePassFormData.registration_expiry}
                                        onChange={e => setGatePassFormData({ ...gatePassFormData, registration_expiry: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={20} />
                                Generate Gate Pass & Release
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobCardItem;
