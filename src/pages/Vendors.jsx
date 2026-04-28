import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X, Phone, MapPin, Mail, ShoppingBag, History, AlertTriangle, Package, Search } from 'lucide-react';
import ManageInventoryModal from '../components/ManageInventoryModal';

const Vendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [historyVendor, setHistoryVendor] = useState(null);
    const [vendorHistory, setVendorHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedVendorForItems, setSelectedVendorForItems] = useState(null);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [editingItemForModal, setEditingItemForModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialForm = {
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        gst_number: '',
        status: 'active'
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchVendors();
        fetchInventory();
    }, []);

    const fetchInventory = async (vendorId = null) => {
        setLoadingItems(true);
        try {
            const url = vendorId ? `/api/vendors/${vendorId}/inventory` : '/api/inventory/spares';
            const res = await axios.get(url);
            setInventoryItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingItems(false);
        }
    };

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/vendors');
            setVendors(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingVendor) {
                await axios.put(`/api/vendors/${editingVendor.id}`, formData);
                alert('Updated successfully');
            } else {
                await axios.post('/api/vendors', formData);
                alert('Added successfully');
            }
            setIsModalOpen(false);
            setEditingVendor(null);
            setFormData(initialForm);
            fetchVendors();
        } catch (err) {
            console.error(err);
            alert('Error saving vendor: ' + (err.response?.data?.message || err.message));
        }
    };

    const fetchVendorHistory = async (vendor) => {
        setHistoryVendor(vendor);
        setLoadingHistory(true);
        try {
            const res = await axios.get(`/api/vendors/${vendor.id}/history`);
            setVendorHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchVendorItems = async (vendor) => {
        if (selectedVendorForItems?.id === vendor.id) {
            setSelectedVendorForItems(null);
            fetchInventory();
        } else {
            setSelectedVendorForItems(vendor);
            fetchInventory(vendor.id);
        }
    };

    const handleUpdateStock = async (item, change) => {
        const newStock = (item.stock || 0) + change;
        try {
            await axios.put(`/api/inventory/spares/${item.id}`, { ...item, stock: newStock });
            setInventoryItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: newStock } : i));
        } catch (err) {
            alert('Failed to update stock');
        }
    };

    const handleDeleteVendorItem = async (id) => {
        if (!window.confirm('Delete this item from inventory?')) return;
        try {
            await axios.delete(`/api/inventory/spares/${id}`);
            setInventoryItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    const openEdit = (vendor) => {
        setEditingVendor(vendor);
        setFormData({ ...vendor });
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingVendor(null);
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Vendor Management</h2>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>Manage suppliers and track part inventory integration</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setIsInventoryModalOpen(true)} className="btn" style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border)' }}>
                        <Package size={18} /> Manage Spares
                    </button>
                    <button onClick={openAdd} className="btn btn-primary">
                        <Plus size={18} /> Add New Vendor
                    </button>
                </div>
            </div>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {vendors.map(v => (
                    <div key={v.id} className="card" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openEdit(v)} className="btn-icon" style={{ color: 'var(--primary)' }}><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(v.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </div>

                        <div style={{ cursor: 'pointer' }} onClick={() => fetchVendorItems(v)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '50px', height: '50px', borderRadius: '50%',
                                    backgroundColor: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--primary)'
                                }}>
                                    <ShoppingBag size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{v.name}</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{v.contact_person || 'No Contact Person'}</span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.1rem 0.4rem',
                                            borderRadius: '0.3rem',
                                            backgroundColor: v.status === 'active' ? '#22c55e20' : '#ef444420',
                                            color: v.status === 'active' ? '#22c55e' : '#ef4444'
                                        }}>
                                            {v.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Phone size={14} color="var(--secondary)" /> {v.phone || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Mail size={14} color="var(--secondary)" /> {v.email || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <MapPin size={14} color="var(--secondary)" /> {v.address || 'No Address'}
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                <button className="btn" onClick={() => fetchVendorHistory(v)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border)' }}>
                                    <History size={14} /> View History
                                </button>
                                {v.part_count > 0 && (
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        <Package size={14} /> {v.part_count} Parts Supplied
                                    </div>
                                )}
                                {v.gst_number && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>GST: {v.gst_number}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Inventory Table Section */}
            <div className="card" style={{ marginTop: '2rem', borderTop: '4px solid var(--primary)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>
                            {selectedVendorForItems ? `Stock List: ${selectedVendorForItems.name}` : 'All Spares Inventory'}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                            {selectedVendorForItems ? 'Manage specific spares supplied by this vendor' : 'Viewing all parts across all vendors'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                            <input
                                type="text"
                                placeholder="Search parts..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    paddingLeft: '2.5rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.5rem',
                                    paddingBottom: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border)',
                                    width: '250px'
                                }}
                            />
                        </div>
                        {selectedVendorForItems && (
                            <button onClick={() => { setSelectedVendorForItems(null); fetchInventory(); }} className="btn-icon">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {loadingItems ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading inventory...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ backgroundColor: 'var(--bg-light)' }}>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '0.75rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem' }}>Vendor name</th>
                                    <th style={{ padding: '0.75rem' }}>Part name</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Availabe QTY</th>
                                    <th style={{ padding: '0.75rem' }}>Location</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Purchase Pricing</th>
                                    <th style={{ padding: '0.75rem' }}>Part Category</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Stock</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryItems
                                    .filter(item =>
                                        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (item.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (item.part_number || '').toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontWeight: 600 }}>{item.vendor_name || 'Generic / N/A'}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{item.part_number || 'No Part No.'}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: item.stock <= (item.low_stock_threshold || 5) ? '#ef4444' : 'inherit' }}>
                                                {item.stock}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{item.rack_number || '-'}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{parseFloat(item.purchase_price || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.2rem 0.6rem',
                                                    backgroundColor: 'var(--primary)15',
                                                    color: 'var(--primary)',
                                                    borderRadius: '4px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                    <button onClick={() => handleUpdateStock(item, 1)} className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: '#22c55e', color: 'white' }}>Add</button>
                                                    <button onClick={() => handleUpdateStock(item, -1)} className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: '#ef4444', color: 'white' }}>Reduce</button>
                                                    <button
                                                        onClick={() => { setEditingItemForModal(item); setIsInventoryModalOpen(true); }}
                                                        className="btn"
                                                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary)', color: 'white' }}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleDeleteVendorItem(item.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {inventoryItems.length === 0 && !loadingItems && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
                                No spares found. Use "Manage Spares" to add items.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Vendor History Modal */}
            {historyVendor && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{ width: '900px', maxWidth: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Supply History - {historyVendor.name}</h3>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--secondary)', fontSize: '0.85rem' }}>Parts supplied and their consumption tracking</p>
                            </div>
                            <button onClick={() => setHistoryVendor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            {loadingHistory ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading history...</div>
                            ) : vendorHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>No history found for this vendor.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--bg-light)', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Part Name</th>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Current Stock</th>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Job Context</th>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Consumed Qty</th>
                                            <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendorHistory.map((h, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{h.part_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}># {h.part_number || 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        color: h.stock < 5 ? '#ef4444' : 'var(--text)',
                                                        fontWeight: h.stock < 5 ? 700 : 400
                                                    }}>
                                                        {h.stock}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {h.job_id ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>Job #{h.job_id}</div>
                                                            <div style={{ fontSize: '0.75rem' }}>{h.customer_name} | {new Date(h.job_date).toLocaleDateString()}</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--secondary)' }}>No consumption yet</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{h.consumed_qty || 0}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>₹{h.total_amount || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Spares Modal Integration */}
            {isInventoryModalOpen && (
                <ManageInventoryModal
                    type="spares"
                    onClose={() => {
                        setIsInventoryModalOpen(false);
                        setEditingItemForModal(null);
                        if (selectedVendorForItems) {
                            fetchInventory(selectedVendorForItems.id);
                        } else {
                            fetchInventory();
                        }
                    }}
                    initialEditItem={editingItemForModal}
                />
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label className="input-label">Vendor Name *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Contact Person</label>
                                <input type="text" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Phone</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <textarea rows="2" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}></textarea>
                            </div>
                            <div className="input-group">
                                <label className="input-label">GST Number</label>
                                <input type="text" value={formData.gst_number} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Save size={18} /> Save Vendor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
