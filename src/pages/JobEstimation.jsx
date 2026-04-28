import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Save, Plus, X, MoreVertical, ChevronRight,
    CheckCircle, Printer, Tag, CreditCard, Shield,
    History, Archive, Users, ShieldCheck, Package,
    Wrench, Briefcase, RefreshCw, Calendar, User, Clock
} from 'lucide-react';
import ManageInventoryModal from '../components/ManageInventoryModal';
import AutocompleteInput from '../components/AutocompleteInput';

const JobEstimation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const lastComplaintRef = useRef(null);

    const [job, setJob] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Complaints');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarType, setSidebarType] = useState('manage'); // 'dots' or 'manage'

    const [mechanics, setMechanics] = useState([]);
    const [isManageTechOpen, setIsManageTechOpen] = useState(false);
    const [selectedMechanicId, setSelectedMechanicId] = useState('');
    const [activeMasterModal, setActiveMasterModal] = useState(null);
    const [inventoryMasters, setInventoryMasters] = useState([]);
    const [serviceMasters, setServiceMasters] = useState([]);
    const [allMasters, setAllMasters] = useState([]);
    const [categories, setCategories] = useState([]);

    // New Mechanic Add State
    const [isAddMechModalOpen, setIsAddMechModalOpen] = useState(false);
    const [newMechDetails, setNewMechDetails] = useState({ name: '', mobile: '' });

    // Vehicle History State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [vehicleHistory, setVehicleHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [nextServiceDate, setNextServiceDate] = useState('');
    const [estimatedAmount, setEstimatedAmount] = useState(0);
    const [advanceAmount, setAdvanceAmount] = useState(0);

    // Read-only mode for completed jobs
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('gpay');
    const [upiId, setUpiId] = useState('9446569314-1@okbizaxis');


    const [isDirty, setIsDirty] = useState(false);
    const [newItems, setNewItems] = useState({
        unified_spare: { item_name: '', qty: 1, rate: '', discount: '', category: 'spare', inventory_id: '' },
        unified_service: { item_name: '', qty: 1, rate: '', discount: '', category: 'Mechanical service', mechanic_id: '', inventory_id: '' }
    });
    const [complaints, setComplaints] = useState([
        { id: Date.now(), complaint: '', finding: '', action: 'REPAIR NOW', selected: false, rate: '' }
    ]);

    useEffect(() => {
        fetchData();
        fetchMasters();
        fetchMechanics();


        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [id, isDirty]);

    useEffect(() => {
        if (job && job.notes && typeof job.notes === 'string' && (!complaints[0] || !complaints[0].complaint)) {
            // Split notes by newline to separate multiple complaints
            const initialComplaints = job.notes.split('\n').filter(line => line.trim()).map(line => {
                const parts = line.split(' | ');
                return {
                    id: Date.now() + Math.random(),
                    complaint: parts[0] || '',
                    finding: parts[1] || '',
                    action: parts[2] || 'REPAIR NOW',
                    rate: parts[3] || '',
                    selected: false
                };
            });

            if (initialComplaints.length > 0) {
                setComplaints(initialComplaints);
            }
        }
    }, [job]);

    const fetchData = async () => {
        try {
            const [jobRes, itemsRes] = await Promise.all([
                axios.get(`/api/jobs/${id}`),
                axios.get(`/api/jobs/${id}/items`)
            ]);
            setJob(jobRes.data);
            setItems(itemsRes.data);
            if (jobRes.data.next_service_date) {
                setNextServiceDate(new Date(jobRes.data.next_service_date).toISOString().split('T')[0]);
            }
            setEstimatedAmount(jobRes.data.estimated_amount || 0);
            setAdvanceAmount(jobRes.data.advance_amount || 0);

            // Set read-only mode if job is paid (after invoicing), gate pass generated, or delivered
            const isSettled = jobRes.data.is_invoice_generated && jobRes.data.paid_amount >= jobRes.data.total_amount && jobRes.data.total_amount > 0;
            const isGP = jobRes.data.is_gate_pass_generated;

            if (isSettled || isGP || jobRes.data.status === 'delivered') {
                setIsReadOnly(true);
            }

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [itemRes, catRes] = await Promise.all([
                axios.get('/api/inventory/items'),
                axios.get('/api/inventory/categories')
            ]);
            setAllMasters(itemRes.data);
            setCategories(catRes.data);

            // Maintain filtered lists for specific autocompletest
            setInventoryMasters(itemRes.data.filter(i => i.item_type === 'spare' || i.item_type === 'both'));
            setServiceMasters(itemRes.data.filter(i => i.item_type === 'service' || i.item_type === 'both'));
        } catch (err) {
            console.error('Failed to fetch masters', err);
        }
    };

    const fetchMechanics = async () => {
        try {
            const res = await axios.get('/api/mechanics');
            setMechanics(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateMechanic = async () => {
        try {
            await axios.put(`/api/jobs/${id}`, { mechanic_id: selectedMechanicId });
            // Refresh job details
            const jobRes = await axios.get(`/api/jobs/${id}`);
            setJob(jobRes.data);
            setIsManageTechOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update mechanic');
        }
    };

    const handleAddMechanic = async () => {
        if (!newMechDetails.name.trim()) return;
        try {
            const res = await axios.post('/api/mechanics', newMechDetails);
            setMechanics([...mechanics, res.data]);
            setSelectedMechanicId(res.data.id);
            setIsAddMechModalOpen(false);
            setNewMechDetails({ name: '', mobile: '' });
        } catch (err) {
            console.error(err);
            alert('Error adding mechanic');
        }
    };

    const fetchVehicleHistory = async () => {
        if (!job || !job.vehicle_id) return;
        setLoadingHistory(true);
        setIsHistoryOpen(true);
        try {
            const res = await axios.get(`/api/vehicles/${job.vehicle_id}/history`);
            setVehicleHistory(res.data);
            setLoadingHistory(false);
        } catch (err) {
            console.error(err);
            setLoadingHistory(false);
            alert('Failed to fetch vehicle history');
        }
    };


    const getTotals = () => {
        // Distinguish based on inventory_id matching master lists type
        const findMaster = (item) => allMasters.find(m => m.id === item.inventory_id);

        const sparesTotal = items.filter(i => {
            const master = findMaster(i);
            if (master) return master.item_type === 'spare' || master.item_type === 'both';
            return ['oil', 'accessories', 'spare', 'others'].includes(i.category);
        }).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        const servicesTotal = items.filter(i => {
            const master = findMaster(i);
            if (master) return master.item_type === 'service';
            const technicalCats = ['Mechanical service', 'Wiring', 'Washing', 'Painting', 'Dending', 'Detailing', 'Leyth', 'Scanning'];
            return technicalCats.includes(i.category);
        }).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        const complaintsTotal = complaints.reduce((sum, c) => sum + (parseFloat(c.rate) || 0), 0);

        return {
            spares: sparesTotal,
            services: servicesTotal,
            complaints: complaintsTotal,
            grand: sparesTotal + servicesTotal + complaintsTotal - (parseFloat(job?.discount) || 0)
        };
    };

    const calculateLiveTotal = () => getTotals().grand;

    const handleAddItem = async (category) => {
        const item = newItems[category];
        if (!item.item_name || !item.rate) return;

        // Validation: Only allow items from master list for spares and services
        const isUnifiedSpare = category === 'unified_spare';
        const isUnifiedService = category === 'unified_service';

        if ((isUnifiedSpare || isUnifiedService) && !item.inventory_id) {
            alert(`Please select an existing item from the ${isUnifiedSpare ? 'Inventory' : 'Service'} list.`);
            return;
        }

        try {
            // Determine the final category string
            let finalCategory = category;
            if (isUnifiedSpare || isUnifiedService) {
                finalCategory = item.category;
            }

            const res = await axios.post(`/api/jobs/${id}/items`, {
                item_name: item.item_name,
                qty: item.qty,
                rate: item.rate,
                discount: item.discount || 0, // Include discount
                category: finalCategory,
                mechanic_id: item.mechanic_id,
                inventory_id: item.inventory_id
            });
            setItems([...items, res.data]);
            setNewItems(prev => ({
                ...prev,
                [category]: (isUnifiedSpare || isUnifiedService)
                    ? { ...prev[category], item_name: '', qty: 1, rate: '', discount: '', inventory_id: '' }
                    : { item_name: '', qty: 1, rate: '', discount: '', mechanic_id: '', inventory_id: '' }
            }));
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error adding item. ' + (err.response?.data?.message || 'Please check your input.'));
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`/api/jobs/items/${itemId}`);
            setItems(items.filter(i => i.id !== itemId));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const addComplaintRow = () => {
        const newId = Date.now() + Math.random();
        setComplaints([...complaints, { id: newId, complaint: '', finding: '', action: 'REPAIR NOW', rate: '', selected: false }]);
        // Focus the new row's input after render
        setTimeout(() => {
            if (lastComplaintRef.current) {
                lastComplaintRef.current.focus();
            }
        }, 0);
    };

    const updateComplaint = (id, field, value) => {
        setComplaints(complaints.map(c => c.id === id ? { ...c, [field]: value } : c));
        setIsDirty(true);
    };

    const handleSaveComplaints = async () => {
        try {
            const notesString = complaints
                .filter(c => c.complaint && c.complaint.trim() !== '')
                .map(c => `${c.complaint.trim()} | ${c.finding ? c.finding.trim() : ''} | ${c.action} | ${c.rate || ''}`)
                .join('\n');

            await axios.put(`/api/jobs/${id}`, {
                notes: notesString,
                next_service_date: nextServiceDate || null,
                estimated_amount: estimatedAmount || 0,
                advance_amount: advanceAmount || 0
            });
            alert('Job Card saved successfully');
            setIsDirty(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to save job card');
        }
    };

    const handleTabChange = (newTab) => {
        if (isDirty) {
            const choice = window.confirm("You have unsaved changes in Complaints. 'OK' to Discard, 'Cancel' to Stay and Save.");
            if (!choice) return;
        }
        setIsDirty(false);
        setActiveTab(newTab);
    };

    const handleFinishJob = async () => {
        // STRICT VALIDATION: Check if Tech is assigned
        if (!job.mechanic_id) {
            alert('⚠️ CANNOT FINISH\n\nTechnician must be assigned first!\n\n✗ No mechanic assigned\n\nPlease assign a mechanic before marking as finished.');
            return;
        }

        // STRICT VALIDATION: Check if Parts are allocated
        if (items.length === 0) {
            alert('⚠️ CANNOT FINISH\n\nSpare parts must be allocated first!\n\n✗ No items/parts added\n\nPlease add spare parts or services before marking as finished.');
            return;
        }

        if (!window.confirm('Mark this vehicle as READY/FINISHED? This will notify the customer.')) return;

        try {
            await axios.put(`/api/jobs/${id}`, { status: 'completed' }); // 'completed' means Finished/Ready
            alert("✓ Vehicle marked as READY! Notifications have been sent to the customer.");
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error finishing job");
        }
    };

    const handleCloseJob = async () => {
        if (!window.confirm('Are you sure you want to close this job card? This action indicates the vehicle has been handed over.')) return;

        try {
            // Update status to completed and set current time as exit date
            await axios.put(`/api/jobs/${id}`, {
                status: 'delivered', // Change to delivered when closed (handed over)
                exit_date: new Date().toISOString()
            });
            alert('Job Card Closed Successfully');
            navigate('/jobs');
        } catch (err) {
            console.error(err);
            alert('Failed to close job card');
        }
    };

    const handleGenerateInvoice = async () => {
        if (!['completed', 'delivered'].includes(job.status)) {
            alert("Please mark the vehicle as Ready (Finish) before generating an invoice.");
            return;
        }
        try {
            await axios.post(`/api/jobs/${id}/generate-invoice`);
            navigate(`/print/invoice/${id}`);
        } catch (err) {
            console.error(err);
            navigate(`/print/invoice/${id}`);
        }
    };

    const handleGenerateProforma = () => {
        window.open(`/print/proforma/${id}`, '_blank');
    };

    const handleGenerateGatePass = async () => {
        // STRICT VALIDATION 1: Check if Invoice is generated
        if (!job.is_invoice_generated) {
            alert('⚠️ GATE PASS BLOCKED\n\nInvoice must be generated first!\n\n✗ Invoice not generated\n\nPlease generate the invoice before creating a gate pass.');
            return;
        }

        // STRICT VALIDATION 2: Check if FULL payment is received
        const paidAmount = parseFloat(job.paid_amount) || 0;
        const totalAmount = parseFloat(job.total_amount) || 0;

        if (paidAmount < totalAmount) {
            const dueAmount = totalAmount - paidAmount;
            alert(`⚠️ GATE PASS BLOCKED\n\nFull payment is required before generating Gate Pass.\n\nTotal: ₹${totalAmount}\nPaid: ₹${paidAmount}\nDue: ₹${dueAmount}\n\n✗ Payment incomplete\n\nPlease collect the remaining amount first to prevent fraud.`);
            return;
        }

        try {
            await axios.post(`/api/jobs/${id}/generate-gate-pass`);
            alert("Gate Pass generated successfully! Message sent to customer to collect vehicle.");
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error generating gate pass");
        }
    };

    const handleDiscountClick = () => {
        const disc = window.prompt("Enter Invoice Level Discount Amount (optional):", job.discount || 0);
        if (disc !== null) {
            const amount = parseFloat(disc) || 0;
            axios.put(`/api/jobs/${id}`, { discount: amount })
                .then(() => {
                    alert("✓ Invoice discount updated!");
                    fetchData();
                })
                .catch(err => alert("Error updating discount"));
        }
    };

    const handleReopenForEdit = () => {
        if (!window.confirm('⚠️ SECURITY WARNING\n\nYou are about to UNLOCK a completed job for editing.\n\nThis is DANGEROUS and should only be done by authorized personnel.\n\nReason: Modifying completed jobs can affect invoices, payments, and records.\n\nDo you want to proceed?')) {
            return;
        }
        setIsReadOnly(false);
        alert('✓ Job unlocked for editing\n\nPlease make your changes carefully and re-complete the job when done.');
    };

    const handlePaymentClick = () => {
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

        const merchantUPI = upiId || '9446569314-1@okbizaxis';
        const merchantName = 'Shine Tech Bikez';
        const transactionNote = `Job #${job.id} - ${job.plate_number}`;

        const upiLink = `upi://pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
        window.location.href = upiLink;

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
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error recording payment: ' + (err.response?.data?.msg || 'Unknown error'));
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (!job) return <div style={{ padding: '2rem', textAlign: 'center' }}>Job Not Found</div>;

    const toggleSidebar = (type) => {
        setSidebarType(type);
        setIsSidebarOpen(true);
    };

    return (
        <div className="job-card-details">
            {isReadOnly && (
                <div style={{
                    backgroundColor: '#fef3c7',
                    border: '2px solid #f59e0b',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <ShieldCheck size={20} color="#f59e0b" />
                            <strong style={{ color: '#92400e', fontSize: '1.1rem' }}>READ-ONLY MODE</strong>
                        </div>
                        <p style={{ margin: 0, color: '#78350f', fontSize: '0.9rem' }}>
                            This job is officially PAID / GATE-PASSED and locked from editing to ensure financial integrity.
                            All fields are disabled. Only authorized personnel can remit/unlock for corrections.
                        </p>
                    </div>
                    <button
                        onClick={handleReopenForEdit}
                        className="btn"
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderColor: '#dc2626',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        🔓 Remit / Unlock for Edit
                    </button>
                </div>
            )}

            <button onClick={() => {
                if (isDirty) {
                    if (!window.confirm("Unsaved changes! Leave anyway?")) return;
                }
                navigate('/jobs');
            }} className="btn" style={{ marginBottom: '1rem', padding: 0 }}>
                <ArrowLeft size={18} /> Back to Jobs
            </button>

            {/* Strict Workflow Timeline */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 1rem' }}>
                    {/* Background line */}
                    <div style={{ position: 'absolute', top: '12px', left: '2rem', right: '2rem', height: '2px', backgroundColor: 'var(--border)', zIndex: 1 }}></div>

                    {[
                        { id: 'JC', label: 'Created', completed: true },
                        { id: 'TA', label: 'Tech', completed: !!job.mechanic_id },
                        { id: 'SP', label: 'Parts', completed: items.length > 0 },
                        { id: 'SC', label: 'Finish', completed: ['completed', 'delivered'].includes(job.status), active: items.length > 0 && !['completed', 'delivered'].includes(job.status) },
                        { id: 'IG', label: 'Invoice', completed: job.is_invoice_generated, active: ['completed', 'delivered'].includes(job.status) && !job.is_invoice_generated },
                        { id: 'PC', label: 'Paid', completed: job.paid_amount >= job.total_amount && job.total_amount > 0, active: job.is_invoice_generated && job.paid_amount < job.total_amount },
                        { id: 'GP', label: 'Gate', completed: job.is_gate_pass_generated, active: job.paid_amount >= job.total_amount && job.total_amount > 0 && !job.is_gate_pass_generated }
                    ].map((step, idx) => (
                        <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%', zIndex: 2,
                                backgroundColor: step.completed ? 'var(--primary)' : 'var(--card)',
                                border: `2px solid ${step.completed || step.active ? 'var(--primary)' : 'var(--border)'}`,
                                color: step.completed ? 'white' : (step.active ? 'var(--primary)' : 'var(--secondary)'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 800, transition: 'all 0.3s',
                                boxShadow: step.completed ? '0 0 10px var(--primary)40' : 'none'
                            }}>
                                {step.id}
                            </div>
                            <span style={{
                                fontSize: '0.65rem', fontWeight: 700,
                                color: step.completed ? 'var(--primary)' : (step.active ? 'var(--text)' : 'var(--secondary)'),
                                textTransform: 'uppercase'
                            }}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== Top Info Cards ===== */}
            <div className="job-summary-grid">
                <div className="summary-card">
                    <span className="label">Job Id</span>
                    <span className="value">#{job.id}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Customer Name</span>
                    <span className="value">{job.customer_name}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Vehicle Details</span>
                    <span className="value">Reg No: {job.plate_number}</span>
                    <div style={{ marginTop: '0.4rem', color: '#22c55e', fontWeight: 800 }}>ESTIMATED TOTAL: ₹{calculateLiveTotal()}</div>
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>TOTAL BILL: ₹{calculateLiveTotal()}</div>
                </div>
                <div className="summary-card">
                    <span className="label">Vehicle Name</span>
                    <span className="value">{job.brand_name || ''} {job.model_name}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Other Details</span>
                    <span className="value">Date: {job.job_date ? new Date(job.job_date).toLocaleDateString() : 'N/A'}</span>
                    <span className="sub-value">Status: {job.status.toUpperCase()}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Contact Details</span>
                    <span className="value">Ph: {job.customer_mobile}</span>
                    <div style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>Items: {items.length} | Complaints: {complaints.filter(c => c.complaint).length}</div>
                </div>
                <div className="summary-card">
                    <span className="label">Assigned Mechanic</span>
                    <span className="value" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        {job.mechanic_name || 'Not Assigned'}
                    </span>
                    <span className="sub-value" style={{
                        fontSize: '0.8rem',
                        cursor: isReadOnly ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                        opacity: isReadOnly ? 0.5 : 1
                    }} onClick={() => !isReadOnly && toggleSidebar('manage')}>
                        Change / Manage
                    </span>
                </div>
            </div>

            {/* ===== Tabs & Actions ===== */}
            <div className="job-tabs-header">
                <div className="tabs">
                    <button className={`tab ${activeTab === 'Complaints' ? 'active' : ''}`} onClick={() => handleTabChange('Complaints')}>Complaints</button>
                    <button className={`tab ${activeTab === 'Spares' ? 'active' : ''}`} onClick={() => handleTabChange('Spares')}>Spares</button>
                    <button className={`tab ${activeTab === 'Services' ? 'active' : ''}`} onClick={() => handleTabChange('Services')}>Services</button>
                    <button className={`tab danger ${activeTab === 'Rejected' ? 'active' : ''}`} onClick={() => handleTabChange('Rejected')}>Rejected</button>
                </div>

                <div className="tab-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => !isReadOnly && toggleSidebar('manage')}
                        style={{ opacity: isReadOnly ? 0.5 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                        disabled={isReadOnly}
                    >Manage</button>
                    <button className="btn icon" onClick={() => toggleSidebar('dots')}><MoreVertical size={18} /></button>
                </div>
            </div>

            {/* ===== Dynamic Content Based on Tabs ===== */}
            {activeTab === 'Complaints' && (
                <div className="complaints-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Customer's Complaints</h3>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                                Spares: ₹{getTotals().spares} | Services: ₹{getTotals().services} | Complaints: ₹{getTotals().complaints} {job?.discount > 0 && `| Discount: -₹${job.discount}`}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>
                                TOTAL BILL: ₹{getTotals().grand}
                            </div>
                        </div>
                    </div>
                    <div className="complaints-table" style={{ marginTop: '1rem' }}>
                        <div className="table-header">
                            <span>Customer Complaints</span>
                            <span>Workshop Finding</span>
                            <span>Action</span>
                            <span>Rate</span>
                            <span>Select</span>
                        </div>

                        {complaints.map((c, index) => (
                            <div className="table-row" key={c.id}>
                                <input
                                    ref={index === complaints.length - 1 ? lastComplaintRef : null}
                                    type="text"
                                    className="input"
                                    value={c.complaint}
                                    onChange={(e) => updateComplaint(c.id, 'complaint', e.target.value)}
                                    placeholder="Enter complaint..."
                                    disabled={isReadOnly}
                                />
                                <input
                                    type="text"
                                    className="input"
                                    value={c.finding}
                                    onChange={(e) => updateComplaint(c.id, 'finding', e.target.value)}
                                    placeholder="Workshop finding"
                                    disabled={isReadOnly}
                                />
                                <select
                                    className="select"
                                    value={c.action}
                                    onChange={(e) => updateComplaint(c.id, 'action', e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option>REPAIR NOW</option>
                                    <option>REPAIR LATER</option>
                                    <option>NOT REQUIRED</option>
                                </select>
                                <input
                                    type="number"
                                    className="input"
                                    value={c.rate}
                                    onChange={(e) => updateComplaint(c.id, 'rate', e.target.value)}
                                    placeholder="Rate"
                                    disabled={isReadOnly}
                                />
                                <div style={{ textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={c.selected}
                                        onChange={(e) => updateComplaint(c.id, 'selected', e.target.checked)}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                        <div className="card" style={{ border: '1px solid var(--primary)30', backgroundColor: 'var(--primary)05' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.6rem', borderRadius: '0.6rem shadow-sm' }}>
                                    <Calendar size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Next Service</label>
                                    <input
                                        type="date"
                                        value={nextServiceDate}
                                        onChange={e => { setNextServiceDate(e.target.value); setIsDirty(true); }}
                                        style={{ border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: 600, padding: 0, width: '100%', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ border: '1px solid #3b82f630', backgroundColor: '#3b82f605' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.6rem', borderRadius: '0.6rem shadow-sm' }}>
                                    <Tag size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Estimation</label>
                                    <input
                                        type="number"
                                        value={estimatedAmount}
                                        onChange={e => { setEstimatedAmount(e.target.value); setIsDirty(true); }}
                                        style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', fontWeight: 800, padding: 0, width: '100%', color: '#3b82f6', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                        placeholder="0.00"
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ border: '1px solid #22c55e30', backgroundColor: '#22c55e05' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ backgroundColor: '#22c55e', color: 'white', padding: '0.6rem', borderRadius: '0.6rem shadow-sm' }}>
                                    <CreditCard size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Advance Amount</label>
                                    <input
                                        type="number"
                                        value={advanceAmount}
                                        onChange={e => { setAdvanceAmount(e.target.value); setIsDirty(true); }}
                                        style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', fontWeight: 800, padding: 0, width: '100%', color: '#22c55e', cursor: isReadOnly ? 'not-allowed' : 'text' }}
                                        placeholder="0.00"
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="complaints-actions" style={{ marginTop: '1.5rem' }}>
                        {!isReadOnly && <button className="btn btn-primary" onClick={addComplaintRow}>+ Add To List</button>}
                        {!isReadOnly && <button className="btn" onClick={handleSaveComplaints} style={{ backgroundColor: '#22c55e', color: 'white' }}>Save & Finish</button>}
                        <button className="btn btn-danger" onClick={() => {
                            if (isDirty && !window.confirm("Discard changes and close?")) return;
                            navigate('/jobs');
                        }}>Close</button>
                    </div>
                </div>
            )}

            {activeTab === 'Spares' && (
                <div className="complaints-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Spares - Inventory Allocation</h3>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>
                            Total Spares: ₹{getTotals().spares} {job?.discount > 0 && <span style={{ fontSize: '0.9rem', color: '#ef4444', marginLeft: '10px' }}> (Less Discount: -₹{job.discount})</span>} (Grand: ₹{getTotals().grand})
                        </div>
                    </div>

                    <div className="complaints-table">
                        <div className="table-header" style={{ gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 0.5fr' }}>
                            <span>Part name</span>
                            <span>Category</span>
                            <span>Qty</span>
                            <span>Price</span>
                            <span>Amount</span>
                            <span>Action</span>
                        </div>
                        {items.filter(item => {
                            const master = allMasters.find(m => m.id === item.inventory_id);
                            if (master) return master.item_type === 'spare' || master.item_type === 'both';
                            return ['oil', 'accessories', 'spare', 'others'].includes(item.category || 'spare');
                        }).map(item => (
                            <div className="table-row" key={item.id} style={{ gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 0.5fr' }}>
                                <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                                <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: 'var(--secondary)' }}>{item.category}</span>
                                <span>{item.qty}</span>
                                <span>₹{item.rate}</span>
                                <span style={{ color: '#ef4444' }}>-₹{item.discount || 0}</span>
                                <span style={{ fontWeight: 600 }}>₹{item.amount}</span>
                                <button className="btn" onClick={() => handleDeleteItem(item.id)} style={{ color: '#ef4444', padding: 0 }} disabled={isReadOnly}>
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                        <div className="table-row" style={{ gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 0.5fr', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                            <AutocompleteInput
                                options={allMasters.filter(i => i.item_type === 'spare' || i.item_type === 'both')}
                                value={newItems.unified_spare.item_name}
                                placeholder={`Search Spares...`}
                                disabled={isReadOnly}
                                onChange={val => setNewItems(prev => ({
                                    ...prev,
                                    unified_spare: { ...prev.unified_spare, item_name: val }
                                }))}
                                onSelect={item => {
                                    setNewItems(prev => ({
                                        ...prev,
                                        unified_spare: {
                                            ...prev.unified_spare,
                                            item_name: item.name,
                                            rate: item.sale_price,
                                            category: item.category_name || item.category,
                                            inventory_id: item.id
                                        }
                                    }));
                                }}
                                onClear={() => setNewItems(prev => ({
                                    ...prev,
                                    unified_spare: { ...prev.unified_spare, item_name: '', inventory_id: '' }
                                }))}
                                className=""
                            />
                            <select
                                value={newItems.unified_spare.category}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_spare: { ...prev.unified_spare, category: e.target.value } }))}
                                style={{ padding: '0.4rem', border: 'none', background: 'transparent', fontSize: '0.85rem' }}
                            >
                                <option value="">Select Category</option>
                                {categories.filter(c => c.type === 'spare' || c.type === 'both').map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Qty"
                                value={newItems.unified_spare.qty}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_spare: { ...prev.unified_spare, qty: e.target.value } }))}
                                disabled={isReadOnly}
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={newItems.unified_spare.rate}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_spare: { ...prev.unified_spare, rate: e.target.value } }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddItem('unified_spare')}
                                disabled={isReadOnly}
                            />
                            <input
                                type="number"
                                placeholder="Disc"
                                value={newItems.unified_spare.discount}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_spare: { ...prev.unified_spare, discount: e.target.value } }))}
                                style={{ color: '#ef4444' }}
                                disabled={isReadOnly}
                            />
                            <span style={{ fontWeight: 600 }}>₹{(Number(newItems.unified_spare.qty) * Number(newItems.unified_spare.rate) - Number(newItems.unified_spare.discount)) || 0}</span>
                            {!isReadOnly && (
                                <button className="btn btn-primary" onClick={() => handleAddItem('unified_spare')} style={{ padding: '0.5rem' }}>
                                    <Plus size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="complaints-actions" style={{ marginTop: '2rem' }}>
                            <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
                                <Save size={18} /> Save & Finish
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'Services' && (
                <div className="complaints-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Services - Labour & External</h3>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>
                            Total Services: ₹{getTotals().services} (Grand: ₹{getTotals().grand})
                        </div>
                    </div>

                    <div className="complaints-table">
                        <div className="table-header" style={{ gridTemplateColumns: '3fr 2fr 0.8fr 1fr 1fr 1.5fr 0.5fr' }}>
                            <span>Service name</span>
                            <span>Categorie</span>
                            <span>Qty</span>
                            <span>Cost</span>
                            <span>Amount</span>
                            <span>Mechanic</span>
                            <span>Action</span>
                        </div>
                        {items.filter(item => {
                            const master = allMasters.find(m => m.id === item.inventory_id);
                            if (master) return master.item_type === 'service';
                            return ['Mechanical service', 'Wiring', 'Washing', 'Painting', 'Dending', 'Detailing', 'Leyth', 'Scanning'].includes(item.category);
                        }).map(item => (
                            <div className="table-row" key={item.id} style={{ gridTemplateColumns: '3fr 2fr 0.8fr 1fr 1fr 1.5fr 0.5fr' }}>
                                <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{item.category}</span>
                                <span>{item.qty}</span>
                                <span>₹{item.rate}</span>
                                <span style={{ fontWeight: 600 }}>₹{item.amount}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                                    {item.mechanic_name ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {item.mechanic_name}</span> : '-'}
                                </span>
                                <button className="btn" onClick={() => handleDeleteItem(item.id)} style={{ color: '#ef4444', padding: 0 }} disabled={isReadOnly}>
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                        <div className="table-row" style={{ gridTemplateColumns: '3fr 2fr 0.8fr 1fr 1fr 1.5fr 0.5fr', backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
                            <AutocompleteInput
                                options={allMasters.filter(i => i.item_type === 'service' || i.item_type === 'both')}
                                value={newItems.unified_service.item_name}
                                placeholder={`Search Services...`}
                                disabled={isReadOnly}
                                onChange={val => setNewItems(prev => ({
                                    ...prev,
                                    unified_service: { ...prev.unified_service, item_name: val }
                                }))}
                                onSelect={item => {
                                    setNewItems(prev => ({
                                        ...prev,
                                        unified_service: {
                                            ...prev.unified_service,
                                            item_name: item.name,
                                            rate: item.sale_price,
                                            category: item.category_name || item.category,
                                            inventory_id: item.id
                                        }
                                    }));
                                }}
                                onClear={() => setNewItems(prev => ({
                                    ...prev,
                                    unified_service: { ...prev.unified_service, item_name: '', inventory_id: '' }
                                }))}
                                className=""
                            />
                            <select
                                value={newItems.unified_service.category}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_service: { ...prev.unified_service, category: e.target.value } }))}
                                style={{ padding: '0.4rem', border: 'none', background: 'transparent', fontSize: '0.85rem' }}
                                disabled={isReadOnly}
                            >
                                <option value="">Select Category</option>
                                {categories.filter(c => c.type === 'service' || c.type === 'both').map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Qty"
                                value={newItems.unified_service.qty}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_service: { ...prev.unified_service, qty: e.target.value } }))}
                                disabled={isReadOnly}
                            />
                            <input
                                type="number"
                                placeholder="Cost"
                                value={newItems.unified_service.rate}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_service: { ...prev.unified_service, rate: e.target.value } }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddItem('unified_service')}
                                disabled={isReadOnly}
                            />
                            <span style={{ fontWeight: 600 }}>₹{(Number(newItems.unified_service.qty) * Number(newItems.unified_service.rate)) || 0}</span>
                            <select
                                value={newItems.unified_service.mechanic_id}
                                onChange={e => setNewItems(prev => ({ ...prev, unified_service: { ...prev.unified_service, mechanic_id: e.target.value } }))}
                                style={{ padding: '0.4rem', borderRadius: '0.3rem', border: '1px solid var(--border)', fontSize: '0.85rem', width: '100%', minWidth: '0' }}
                                disabled={isReadOnly}
                            >
                                <option value="">{job.mechanic_name ? `Main: ${job.mechanic_name}` : 'Select Tech'}</option>
                                {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            {!isReadOnly && (
                                <button className="btn btn-primary" onClick={() => handleAddItem('unified_service')} style={{ padding: '0.5rem' }}>
                                    <Plus size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="complaints-actions" style={{ marginTop: '2rem' }}>
                            <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
                                <Save size={18} /> Save & Finish
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Sidenav (Sidebar) ===== */}
            <div className={`sidenav ${isSidebarOpen ? 'active' : ''}`}>
                <div className="closebtn" onClick={() => setIsSidebarOpen(false)}>
                    <ChevronRight size={28} color="var(--primary)" />
                </div>

                <div className="sd_top">
                    <div className="jb_w">
                        <div>Job card no:</div>
                        <div>{job.id}</div>
                    </div>
                    <div className="de_txt14">
                        <div className="mt_87">
                            <div className="ve_nn">Vehicle number</div>
                            <div className="ve_nnn_4565">{job.plate_number}</div>
                        </div>
                        <div className="mt_87">
                            <div className="ve_nn">Vehicle name</div>
                            <div className="ve_nnn_4565">{job.brand_name || ''} {job.model_name}</div>
                        </div>
                        <div className="mt_87">
                            <div className="ve_nn">Customer name</div>
                            <div className="ve_nnn_4565">{job.customer_name}</div>
                        </div>
                        <div className="mt_87">
                            <div className="ve_nn">Phone number</div>
                            <div className="ve_nnn_4565">{job.customer_mobile}</div>
                        </div>
                    </div>
                </div>

                <div className="ovr_con" style={{ display: sidebarType === 'dots' ? 'block' : 'none' }}>
                    <div className="ser1" onClick={() => { !isReadOnly && (setIsSidebarOpen(false) || handleFinishJob()); }} style={{ opacity: isReadOnly ? 0.5 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}>
                        <div className="ic_mn">
                            <div className="ed_round"><CheckCircle size={18} color="#22c55e" /></div>
                            <div className="ic_txt_454">Finish job card</div>
                        </div>
                        <div className="ic_para">Use this option to mark vehicle as ready when the work is complete. Upon marking ready, the customer shall receive the notification on SMS/ email/ app notifications.</div>
                    </div>
                    <div className="ser1" onClick={() => { setIsSidebarOpen(false); handleGenerateInvoice(); }}>
                        <div className="ic_mn">
                            <div className="ed_round" style={{ opacity: ['completed', 'delivered'].includes(job.status) ? 1 : 0.4 }}><Printer size={18} color="#3b82f6" /></div>
                            <div className="ic_txt_454">Print invoice</div>
                        </div>
                        <div className="ic_para">Use this option to generate the invoice. Please remember that generation of an invoice cannot be undone. Thus, please be careful when to generate an invoice.</div>
                    </div>
                    <div className="ser1" onClick={() => { setIsSidebarOpen(false); handleGenerateProforma(); }}>
                        <div className="ic_mn">
                            <div className="ed_round"><Briefcase size={18} color="#64748b" /></div>
                            <div className="ic_txt_454">Statement (Proforma)</div>
                        </div>
                        <div className="ic_para">Use this option to generate a proforma estimation. This is for reference only and does not record income or lock the job.</div>
                    </div>
                    {['completed', 'delivered'].includes(job.status) && (
                        <div className="ser1" onClick={() => { setIsSidebarOpen(false); handleGenerateGatePass(); }}>
                            <div className="ic_mn">
                                <div className="ed_round"><Archive size={18} color="#8b5cf6" /></div>
                                <div className="ic_txt_454">Generate Gate Pass</div>
                            </div>
                            <div className="ic_para">Generate a gate pass for the vehicle. This will notify the customer that the vehicle is ready for pickup.</div>
                        </div>
                    )}
                    <div className="ser1" onClick={() => { !isReadOnly && (setIsSidebarOpen(false) || handleDiscountClick()); }} style={{ opacity: isReadOnly ? 0.5 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}>
                        <div className="ic_mn">
                            <div className="ed_round"><Tag size={18} color="#eab308" /></div>
                            <div className="ic_txt_454">Add discount</div>
                        </div>
                        <div className="ic_para">Use this option to add discounts to invoices. Discounts can be added on invoice level or line item level. It is suggested to add discounts only on item level to avoid tax implications.</div>
                    </div>
                    <div className="ser1" onClick={() => { setIsSidebarOpen(false); handlePaymentClick(); }}>
                        <div className="ic_mn">
                            <div className="ed_round"><CreditCard size={18} color="#a855f7" /></div>
                            <div className="ic_txt_454">Capture payments</div>
                        </div>
                        <div className="ic_para">Payments can be captured in multiple modes including payment links which can be generated by clicking the button provided. Please contact support to activate payment link option.</div>
                    </div>
                    <div className="ser1" onClick={() => setIsSidebarOpen(false)}>
                        <div className="ic_mn">
                            <div className="ed_round"><Shield size={18} color="#06b6d4" /></div>
                            <div className="ic_txt_454">Go to insurance estimation</div>
                        </div>
                        <div className="ic_para">Use this option to go to insurance estimation. Insurance estimation can be created by clicking on the “push to insurance” button provided in the estimation page. Generate invoice for insurers here.</div>
                    </div>
                    <div className="ser1" onClick={() => { setIsSidebarOpen(false); fetchVehicleHistory(); }}>
                        <div className="ic_mn">
                            <div className="ed_round"><History size={18} color="#64748b" /></div>
                            <div className="ic_txt_454">Vehicle history</div>
                        </div>
                        <div className="ic_para">Use this option to view vehicle history. Vehicle history is available by job cards and break up of parts and services along with dates and pricing of services executed.</div>
                    </div>
                    <div className="ser1" onClick={() => { !isReadOnly && (setIsSidebarOpen(false) || handleCloseJob()); }} style={{ opacity: isReadOnly ? 0.5 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}>
                        <div className="ic_mn">
                            <div className="ed_round"><Archive size={18} color="#ef4444" /></div>
                            <div className="ic_txt_454">Close job card</div>
                        </div>
                        <div className="ic_para">Use this option to close a job card after a vehicle is handed over to a customer. It is suggested to capture any future payments by customers from the “Service history” page instead of keeping the job cards open.</div>
                    </div>
                </div>

                <div className="ovr_con" style={{ display: sidebarType === 'manage' ? 'block' : 'none' }}>
                    <div className="ser2" onClick={() => {
                        setIsSidebarOpen(false);
                        fetchMechanics();
                        setSelectedMechanicId(job.mechanic_id || '');
                        setIsManageTechOpen(true);
                    }}>
                        <div className="ic_mn">
                            <div className="ed_round"><Users size={18} color="#3b82f6" /></div>
                            <div className="ic_txt_454">Manage Technicians</div>
                        </div>
                        <div className="ic_para">Use this option to break up work and allocate technicians to each work. This will help you to track technician productivity. The reports are available in the business reports.</div>
                    </div>
                    <div className="ser2" onClick={() => setIsSidebarOpen(false)}>
                        <div className="ic_mn">
                            <div className="ed_round"><ShieldCheck size={18} color="#22c55e" /></div>
                            <div className="ic_txt_454">Digital vehicle inspection</div>
                        </div>
                        <div className="ic_para">Use this option to conduct digital vehicle inspection with predefined checklists. For example: 101 Point Checklist. Use this to charge the customer or provide as value add service.</div>
                    </div>
                    <div className="ser2" onClick={() => { setIsSidebarOpen(false); setActiveMasterModal('spares'); }}>
                        <div className="ic_mn">
                            <div className="ed_round"><Package size={18} color="#f59e0b" /></div>
                            <div className="ic_txt_454">Manage spares</div>
                        </div>
                        <div className="ic_para">Use this option to add spares quickly to inventory or the master's data. Helps you to maintain spare parts data correctly.</div>
                    </div>
                    <div className="ser2" onClick={() => { setIsSidebarOpen(false); setActiveMasterModal('services'); }}>
                        <div className="ic_mn">
                            <div className="ed_round"><Briefcase size={18} color="#ec4899" /></div>
                            <div className="ic_txt_454">Manage services</div>
                        </div>
                        <div className="ic_para">Use this option to quickly add services to the masters data. Helps you to maintain labour items’ data correctly.</div>
                    </div>
                    <div className="ser2" onClick={() => setIsSidebarOpen(false)}>
                        <div className="ic_mn">
                            <div className="ed_round"><Briefcase size={18} color="#ec4899" /></div>
                            <div className="ic_txt_454">Manage packages</div>
                        </div>
                        <div className="ic_para">Use this option to quickly add packages to the masters data. Helps you to maintain package items’ data correctly.</div>
                    </div>
                </div>

            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Manage Technicians Modal */}
            {isManageTechOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Manage Technicians</h3>
                            <button className="btn" onClick={() => setIsManageTechOpen(false)} style={{ padding: '0.5rem' }}><X size={20} /></button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                Current Assigned Mechanic: <strong style={{ color: 'var(--text)' }}>{job.mechanic_name || 'None'}</strong>
                            </p>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Re-assign Job To:</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    value={selectedMechanicId}
                                    onChange={(e) => setSelectedMechanicId(e.target.value)}
                                    style={{ flex: 1 }}
                                >
                                    <option value="">-- Select Mechanic --</option>
                                    {mechanics.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <button className="btn" onClick={() => setIsAddMechModalOpen(true)} title="Add New Mechanic">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button className="btn btn-primary" onClick={handleUpdateMechanic}>Update Assignment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Mechanic Nested Modal */}
            {isAddMechModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '350px', maxWidth: '90%' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Add New Mechanic</h3>
                        <div className="input-group">
                            <label className="input-label">Name</label>
                            <input
                                type="text"
                                value={newMechDetails.name}
                                onChange={e => setNewMechDetails({ ...newMechDetails, name: e.target.value })}
                                placeholder="Mechanic Name"
                                autoFocus
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Mobile (Optional)</label>
                            <input
                                type="text"
                                value={newMechDetails.mobile}
                                onChange={e => setNewMechDetails({ ...newMechDetails, mobile: e.target.value })}
                                placeholder="Mobile Number"
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn" onClick={() => setIsAddMechModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddMechanic}>Add & Select</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Vehicle History Modal */}
            {isHistoryOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setIsHistoryOpen(false)}>
                    <div className="card" style={{
                        width: '1000px', maxWidth: '95%', maxHeight: '90vh',
                        overflowY: 'auto', padding: '1.5rem'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Vehicle History: {job.plate_number}</h3>
                                <p style={{ margin: '0.2rem 0 0', color: 'var(--secondary)', fontSize: '0.85rem' }}>View all past services and job card details</p>
                            </div>
                            <button className="btn" onClick={() => setIsHistoryOpen(false)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', opacity: 0.5 }} />
                                <p style={{ marginTop: '1rem' }}>Loading History...</p>
                            </div>
                        ) : vehicleHistory.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                No previous history found for this vehicle.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {vehicleHistory.map((hJob, idx) => (
                                    <div key={hJob.id} style={{
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.75rem',
                                        overflow: 'hidden',
                                        backgroundColor: 'var(--bg-light)'
                                    }}>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            backgroundColor: 'var(--card)',
                                            borderBottom: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Job #{hJob.id}</span>
                                                <span style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                                                    Date: {new Date(hJob.job_date).toLocaleDateString()}
                                                </span>
                                                <span style={{
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '0.4rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: hJob.status === 'delivered' ? '#3b82f620' : '#eab30820',
                                                    color: hJob.status === 'delivered' ? '#3b82f6' : '#eab308'
                                                }}>
                                                    {hJob.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                Total: ₹{hJob.total_amount || 0}
                                            </div>
                                        </div>

                                        <div style={{ padding: '1rem' }}>
                                            {hJob.notes && (
                                                <div style={{
                                                    marginBottom: '1rem',
                                                    padding: '0.8rem',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                                    borderRadius: '0.5rem',
                                                    borderLeft: '4px solid #3b82f6'
                                                }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af', marginBottom: '0.4rem', textTransform: 'uppercase' }}>COMPLAINTS / NOTES:</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{hJob.notes}</div>
                                                </div>
                                            )}

                                            <div style={{ borderRadius: '0.6rem', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr style={{ textAlign: 'left', backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                                                            <th style={{ padding: '0.8rem', fontWeight: 700 }}>Item Name</th>
                                                            <th style={{ padding: '0.8rem', fontWeight: 700 }}>Qty</th>
                                                            <th style={{ padding: '0.8rem', fontWeight: 700 }}>Rate</th>
                                                            <th style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 700 }}>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {hJob.items && hJob.items.map(i => (
                                                            <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{i.item_name}</td>
                                                                <td style={{ padding: '0.8rem', color: '#1e293b' }}>{i.qty}</td>
                                                                <td style={{ padding: '0.8rem', color: '#64748b' }}>₹{i.rate}</td>
                                                                <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>₹{i.amount}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginTop: '1rem',
                                                padding: '0.8rem',
                                                fontSize: '0.85rem',
                                                backgroundColor: '#f8fafc',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div style={{ color: '#475569' }}>Mechanic: <strong style={{ color: '#4f46e5' }}>{hJob.mechanic_name || 'N/A'}</strong></div>
                                                <div style={{ color: '#475569' }}>Exit Date: <strong style={{ color: '#dc2626' }}>{hJob.exit_date ? new Date(hJob.exit_date).toLocaleDateString() : 'N/A'}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Manage Inventory Modal */}
            {activeMasterModal && (
                <ManageInventoryModal
                    type={activeMasterModal}
                    onClose={() => {
                        setActiveMasterModal(null);
                        fetchMasters();
                    }}
                />
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setIsPaymentModalOpen(false)}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <CreditCard size={24} color="var(--primary)" />
                                Capture Payment
                            </h3>
                            <button className="btn" onClick={() => setIsPaymentModalOpen(false)} style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--secondary)' }}>Total Bill:</span>
                                <strong style={{ fontSize: '1.1rem' }}>₹{job?.total_amount || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--secondary)' }}>Paid Amount:</span>
                                <strong style={{ color: '#22c55e' }}>₹{job?.paid_amount || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
                                <span style={{ fontWeight: 700 }}>Due Amount:</span>
                                <strong style={{ fontSize: '1.25rem', color: '#ef4444' }}>₹{(job?.total_amount - job?.paid_amount) || 0}</strong>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Payment Amount</label>
                            <input
                                type="number"
                                className="input"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Payment Method</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                {['gpay', 'cash', 'card'].map(method => (
                                    <button
                                        key={method}
                                        className={`btn ${paymentMethod === method ? 'btn-primary' : ''}`}
                                        onClick={() => setPaymentMethod(method)}
                                        style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}
                                    >
                                        {method === 'gpay' ? 'Google Pay' : method}
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

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn" style={{ flex: 1 }} onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                            {paymentMethod === 'gpay' ? (
                                <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#22c55e' }} onClick={() => handleRecordPayment(paymentAmount, 'gpay')}>
                                    Payment Confirmed (Record)
                                </button>
                            ) : (
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleRecordPayment(paymentAmount, paymentMethod)}>
                                    Record Payment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobEstimation;
