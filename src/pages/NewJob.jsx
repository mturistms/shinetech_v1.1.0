import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';

const NewJob = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [mechanics, setMechanics] = useState([]);

    const [formData, setFormData] = useState({
        vehicle_id: '',
        mechanic_name: '',
        expected_delivery: '',
        estimated_amount: '',
        advance_amount: '',
        advance_payment_mode: 'cash',
        notes: ''
    });

    const [complaintList, setComplaintList] = useState(['']); // Start with one empty line

    const handleAddComplaintLine = () => {
        setComplaintList([...complaintList, '']);
    };

    const handleComplaintChange = (index, value) => {
        const newList = [...complaintList];
        newList[index] = value;
        setComplaintList(newList);
    };

    const handleRemoveComplaintLine = (index) => {
        if (complaintList.length === 1) {
            setComplaintList(['']); // Reset if last one
            return;
        }
        const newList = complaintList.filter((_, i) => i !== index);
        setComplaintList(newList);
    };

    // Added state for customers and search
    const [customers, setCustomers] = useState([]);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

    // Autocomplete states for New Vehicle
    const [uniqueModels, setUniqueModels] = useState([]);
    const [uniqueBrands, setUniqueBrands] = useState([]);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

    const [newVehicle, setNewVehicle] = useState({
        plate_number: '',
        model_name: '',
        brand_name: '',
        km_run: '',
        customer_name: '',
        mobile: '',
        alternate_number: ''
    });
    const [isPlateDropdownOpen, setIsPlateDropdownOpen] = useState(false);
    const [existingCustomer, setExistingCustomer] = useState(null);

    // Mechanic Dropdown & Add States
    const [isMechDropdownOpen, setIsMechDropdownOpen] = useState(false);
    // Removed inline Add Mechanic per new requirements

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vRes, mRes, cRes] = await Promise.all([
                    axios.get('/api/vehicles'),
                    axios.get('/api/mechanics'),
                    axios.get('/api/customers')
                ]);
                setVehicles(vRes.data || []);
                setMechanics(mRes.data || []);
                // api/customers returns { customers: [], pagination: {} }
                setCustomers(cRes.data?.customers || cRes.data || []);

                // Extract unique models and brands
                const models = [...new Set((vRes.data || []).map(v => v.model_name).filter(Boolean))];
                const brands = [...new Set((vRes.data || []).map(v => v.brand_name).filter(Boolean))];
                setUniqueModels(models);
                setUniqueBrands(brands);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let vehicleId = formData.vehicle_id;

            if (!vehicleId) {
                // 1. Determine Customer (Create New or Use Existing)
                let customerId;
                if (existingCustomer) {
                    customerId = existingCustomer.id;
                } else {
                    const custRes = await axios.post('/api/customers', {
                        name: newVehicle.customer_name,
                        mobile: newVehicle.mobile ? newVehicle.mobile.trim() : '',
                        alternate_number: newVehicle.alternate_number ? newVehicle.alternate_number.trim() : ''
                    });
                    customerId = custRes.data.customer.id;
                }

                // 2. Create Vehicle
                const vehRes = await axios.post('/api/vehicles', {
                    customer_id: customerId,
                    plate_number: newVehicle.plate_number,
                    model_name: newVehicle.model_name || null,
                    brand_name: newVehicle.brand_name || null,
                    km_run: newVehicle.km_run ? parseInt(newVehicle.km_run) : null
                });

                vehicleId = vehRes.data.vehicle.id;
            }

            // 2b. Handle Mechanic (Find by Name or Create)
            let mechanicId = null;
            if (formData.mechanic_name && formData.mechanic_name.trim()) {
                const nameToFind = formData.mechanic_name.trim();
                // Check if exists in loaded mechanics
                const existingMech = mechanics.find(m => m.name && m.name.toLowerCase() === nameToFind.toLowerCase());

                if (existingMech) {
                    mechanicId = existingMech.id;
                } else {
                    // Create new mechanic (Admin rights required)
                    try {
                        const mechRes = await axios.post('/api/mechanics', { name: nameToFind, mobile: null });
                        mechanicId = mechRes.data.id;
                    } catch (mErr) {
                        console.error('Mechanic creation failed:', mErr.response?.data || mErr.message);
                        // If it fails due to permissions, we inform the user
                        if (mErr.response?.status === 403) {
                            throw new Error('Only Admins can create new mechanics. Please select an existing name or ask an Admin.');
                        }
                        throw mErr;
                    }
                }
            }

            // 3. Create Job
            await axios.post('/api/jobs', {
                vehicle_id: vehicleId,
                mechanic_id: mechanicId,
                expected_delivery: formData.expected_delivery || null,
                estimated_amount: formData.estimated_amount || 0,
                advance_amount: formData.advance_amount || 0,
                notes: complaintList.filter(c => c && c.trim()).join('\n')
            });

            navigate('/jobs');

        } catch (err) {
            console.error('Job Creation Error Detail:', err.response?.data || err.message);

            // Handle "One active job card per vehicle" rule violation
            if (err.response?.status === 409 && err.response?.data?.existingJobId) {
                const existingJobId = err.response.data.existingJobId;
                alert(`Oops! This vehicle already has an active job card (#${existingJobId}).\n\nRedirecting you to the existing job card for editing.`);
                navigate(`/jobs/${existingJobId}/estimation`);
                return;
            }

            const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Error creating job';
            alert(`Failed to create job card: ${errorMsg}`);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate('/jobs')} className="btn" style={{ marginBottom: '1rem', paddingLeft: 0 }}>
                <ArrowLeft size={18} /> Back to Jobs
            </button>

            <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Create New Job Card</h2>

                <form onSubmit={handleSubmit}>
                    {/* New Vehicle Form */}
                    <div style={{
                        backgroundColor: 'var(--bg)',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--border)'
                    }}>
                        <h4 style={{ marginBottom: '1rem' }}>Vehicle & Customer Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label">Plate Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        required
                                        type="text"
                                        value={newVehicle.plate_number}
                                        onChange={e => {
                                            let val = e.target.value.toUpperCase();
                                            val = val.replace(/\s+/g, '-');
                                            val = val.replace(/[^A-Z0-9-]/g, '');
                                            val = val.replace(/-+/g, '-');

                                            // Handle plate change
                                            if (formData.vehicle_id) {
                                                const current = vehicles.find(v => v.id === formData.vehicle_id);
                                                if (current && current.plate_number !== val) {
                                                    setFormData(prev => ({ ...prev, vehicle_id: '' }));
                                                    setExistingCustomer(null);
                                                }
                                            }

                                            setNewVehicle({ ...newVehicle, plate_number: val });
                                            setIsPlateDropdownOpen(true);

                                            // Check for exact match
                                            const exactMatch = vehicles.find(v => v.plate_number === val);
                                            if (exactMatch) {
                                                setNewVehicle({
                                                    plate_number: exactMatch.plate_number,
                                                    model_name: exactMatch.model_name || '',
                                                    brand_name: exactMatch.brand_name || '',
                                                    km_run: '',
                                                    customer_name: exactMatch.customer_name || '',
                                                    mobile: exactMatch.customer_mobile || '',
                                                    alternate_number: exactMatch.customer_alternate_number || ''
                                                });
                                                setFormData(prev => ({ ...prev, vehicle_id: exactMatch.id }));
                                                setExistingCustomer({ id: exactMatch.customer_id, name: exactMatch.customer_name });
                                            }
                                        }}
                                        onFocus={() => setIsPlateDropdownOpen(true)}
                                        placeholder="e.g. KL-07-BQ-1234"
                                        maxLength={16}
                                    />
                                    {isPlateDropdownOpen && newVehicle.plate_number && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                            backgroundColor: 'var(--card)', border: '1px solid var(--border)',
                                            borderRadius: '0.5rem', maxHeight: '150px', overflowY: 'auto',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                        }}>
                                            {vehicles.filter(v => (v.plate_number || '').toLowerCase().includes(newVehicle.plate_number.toLowerCase()))
                                                .map((v, i) => (
                                                    <div key={i}
                                                        onClick={() => {
                                                            setNewVehicle({
                                                                plate_number: v.plate_number,
                                                                model_name: v.model_name || '',
                                                                brand_name: v.brand_name || '',
                                                                km_run: '',
                                                                customer_name: v.customer_name || '',
                                                                mobile: v.customer_mobile || '',
                                                                alternate_number: v.customer_alternate_number || ''
                                                            });
                                                            setFormData(prev => ({ ...prev, vehicle_id: v.id }));
                                                            setExistingCustomer({ id: v.customer_id, name: v.customer_name });
                                                            setIsPlateDropdownOpen(false);
                                                        }}
                                                        style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg)'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                    >
                                                        <strong>{v.plate_number}</strong> - {v.model_name} <small>({v.customer_name})</small>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                    {isPlateDropdownOpen && (
                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
                                            onClick={() => setIsPlateDropdownOpen(false)}></div>
                                    )}
                                </div>
                                {newVehicle.plate_number && vehicles.some(v => (v.plate_number || '').toLowerCase() === newVehicle.plate_number.trim().toLowerCase()) && !formData.vehicle_id && (
                                    <div style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        ⚠️ This vehicle already exists! Use dropdown to select.
                                    </div>
                                )}
                            </div>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label className="input-label">Model Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={newVehicle.model_name}
                                    onChange={e => {
                                        setNewVehicle({ ...newVehicle, model_name: e.target.value });
                                        setIsModelDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsModelDropdownOpen(true)}
                                    placeholder="e.g. Activa 6G"
                                />
                                {isModelDropdownOpen && newVehicle.model_name && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                        backgroundColor: 'var(--card)', border: '1px solid var(--border)',
                                        borderRadius: '0.5rem', maxHeight: '150px', overflowY: 'auto'
                                    }}>
                                        {uniqueModels.filter(m => m.toLowerCase().includes(newVehicle.model_name.toLowerCase()))
                                            .map((m, i) => (
                                                <div key={i}
                                                    onClick={() => {
                                                        setNewVehicle({ ...newVehicle, model_name: m });
                                                        setIsModelDropdownOpen(false);
                                                    }}
                                                    style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                                >
                                                    {m}
                                                </div>
                                            ))}
                                    </div>
                                )}
                                {isModelDropdownOpen && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
                                        onClick={() => setIsModelDropdownOpen(false)}></div>
                                )}
                            </div>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label className="input-label">Brand Name</label>
                                <input
                                    type="text"
                                    value={newVehicle.brand_name}
                                    onChange={e => {
                                        setNewVehicle({ ...newVehicle, brand_name: e.target.value });
                                        setIsBrandDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsBrandDropdownOpen(true)}
                                    placeholder="e.g. Honda"
                                />
                                {isBrandDropdownOpen && newVehicle.brand_name && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                        backgroundColor: 'var(--card)', border: '1px solid var(--border)',
                                        borderRadius: '0.5rem', maxHeight: '150px', overflowY: 'auto'
                                    }}>
                                        {uniqueBrands.filter(b => b.toLowerCase().includes(newVehicle.brand_name.toLowerCase()))
                                            .map((b, i) => (
                                                <div key={i}
                                                    onClick={() => {
                                                        setNewVehicle({ ...newVehicle, brand_name: b });
                                                        setIsBrandDropdownOpen(false);
                                                    }}
                                                    style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                                >
                                                    {b}
                                                </div>
                                            ))}
                                    </div>
                                )}
                                {isBrandDropdownOpen && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
                                        onClick={() => setIsBrandDropdownOpen(false)}></div>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="input-label">Km Run</label>
                                <input
                                    type="number"
                                    value={newVehicle.km_run}
                                    onChange={e => setNewVehicle({ ...newVehicle, km_run: e.target.value })}
                                    placeholder="e.g. 15000"
                                />
                            </div>
                        </div>

                        <hr style={{ margin: '1.5rem 0', border: '0', borderTop: '1px solid var(--border)' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Customer Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={newVehicle.customer_name}
                                    onChange={e => setNewVehicle({ ...newVehicle, customer_name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Mobile Number</label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={newVehicle.mobile}
                                    onChange={async (e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setNewVehicle(prev => ({ ...prev, mobile: val }));

                                        if (val.length === 10) {
                                            try {
                                                const res = await axios.get(`/api/customers?search=${val}`);
                                                const searchResults = res.data?.customers || [];
                                                const match = searchResults.find(c => c.mobile == val);

                                                if (match) {
                                                    setExistingCustomer(match);
                                                    setNewVehicle(prev => ({
                                                        ...prev,
                                                        customer_name: match.name,
                                                        alternate_number: match.alternate_number || ''
                                                    }));
                                                } else {
                                                    setExistingCustomer(null);
                                                }
                                            } catch (err) {
                                                console.error('Customer search error:', err);
                                            }
                                        } else {
                                            setExistingCustomer(null);
                                        }
                                    }}
                                    placeholder="10-digit number"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Alternate Number</label>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={newVehicle.alternate_number}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setNewVehicle({ ...newVehicle, alternate_number: val });
                                    }}
                                    placeholder="10-digit number"
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            {existingCustomer && (
                                <div style={{ color: '#059669', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 'bold', padding: '0.5rem', backgroundColor: '#ecfdf5', borderRadius: '0.4rem', border: '1px solid #10b981' }}>
                                    <span style={{ display: 'block' }}>✓ Found existing customer: {existingCustomer.name}</span>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 400, color: '#047857' }}>This vehicle will be added to their account.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Arrival & Delivery Log */}
                    <div style={{
                        marginTop: '1.5rem',
                        marginBottom: '1.5rem',
                        padding: '1.5rem',
                        backgroundColor: 'var(--bg)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)'
                    }}>
                        <h4 style={{ marginBottom: '1rem' }}>Arrival & Delivery Log</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Date of Arrival</label>
                                <input
                                    type="text"
                                    disabled
                                    value={new Date().toLocaleDateString('en-GB')}
                                    style={{ backgroundColor: 'var(--card)', cursor: 'not-allowed' }}
                                />
                                <small style={{ color: 'var(--secondary)' }}>Auto-set to today</small>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Expected Delivery <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.expected_delivery}
                                    onChange={e => setFormData({ ...formData, expected_delivery: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mechanic Select */}
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label className="input-label">Assign Mechanic</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={formData.mechanic_name}
                                onChange={e => {
                                    setFormData({ ...formData, mechanic_name: e.target.value });
                                    setIsMechDropdownOpen(true);
                                }}
                                onFocus={() => setIsMechDropdownOpen(true)}
                                placeholder="Search or select mechanic..."
                                style={{ width: '100%' }}
                            />
                            {isMechDropdownOpen && (
                                <div className="mech-dropdown" style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                    backgroundColor: 'var(--card)', border: '1px solid var(--border)',
                                    borderRadius: '0.5rem', marginTop: '0.25rem', maxHeight: '200px',
                                    overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    {mechanics.filter(m => (m.name || '').toLowerCase().includes((formData.mechanic_name || '').toLowerCase()))
                                        .map(m => (
                                            <div
                                                key={m.id}
                                                onClick={() => {
                                                    setFormData({ ...formData, mechanic_name: m.name });
                                                    setIsMechDropdownOpen(false);
                                                }}
                                                style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                                className="dropdown-item"
                                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg)'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                {m.name}
                                            </div>
                                        ))}
                                </div>
                            )}
                            {isMechDropdownOpen && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
                                    onClick={() => setIsMechDropdownOpen(false)}></div>
                            )}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Initial Notes / Complaints <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {complaintList.map((complaint, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        required={index === 0}
                                        type="text"
                                        value={complaint}
                                        onChange={(e) => handleComplaintChange(index, e.target.value)}
                                        placeholder={`Complaint ${index + 1}`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddComplaintLine();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => handleRemoveComplaintLine(index)}
                                        style={{ color: '#ef4444', borderColor: 'var(--border)', padding: '0.5rem' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn"
                            onClick={handleAddComplaintLine}
                            style={{ marginTop: '0.5rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                        >
                            <Plus size={16} /> Add Another Line
                        </button>
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Estimation Amount (₹)</label>
                        <input
                            type="number"
                            value={formData.estimated_amount}
                            onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                            placeholder="Enter estimated cost..."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Advance Amount (₹)</label>
                            <input
                                type="number"
                                value={formData.advance_amount}
                                onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                                placeholder="Enter advance payment (if any)..."
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Payment Mode</label>
                            <select
                                value={formData.advance_payment_mode}
                                onChange={(e) => setFormData({ ...formData, advance_payment_mode: e.target.value })}
                                disabled={!formData.advance_amount || parseFloat(formData.advance_amount) <= 0}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border)',
                                    backgroundColor: (!formData.advance_amount || parseFloat(formData.advance_amount) <= 0) ? 'var(--bg)' : 'var(--card)',
                                    color: 'var(--text)',
                                    cursor: (!formData.advance_amount || parseFloat(formData.advance_amount) <= 0) ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                            </select>
                            {(!formData.advance_amount || parseFloat(formData.advance_amount) <= 0) && (
                                <small style={{ color: 'var(--secondary)', marginTop: '0.25rem', display: 'block' }}>
                                    Enter advance amount to select mode
                                </small>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button type="button" onClick={() => navigate('/jobs')} className="btn" style={{ marginRight: '1rem' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Job Card</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewJob;
