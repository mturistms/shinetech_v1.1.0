import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Package, Wrench, Search, AlertTriangle, Minus, Edit2, LayoutGrid } from 'lucide-react';

const ManageInventoryModal = ({ type, onClose, initialEditItem }) => {
    // type: 'spares' or 'services'
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('items'); // 'items' or 'categories'

    const [newItem, setNewItem] = useState({
        name: '',
        part_number: '',
        stock: '',
        low_stock_threshold: 5,
        sale_price: '',
        purchase_price: '',
        item_type: type === 'spares' ? 'spare' : 'service',
        category_id: '',
        category_name: '',
        rack_number: '',
        vendor_id: '',
        estimated_time_minutes: '',
        unit: 'pcs',
        description: ''
    });

    const [newCategory, setNewCategory] = useState({ name: '', type: 'both' });
    const [vendors, setVendors] = useState([]);
    const [editingItem, setEditingItem] = useState(null);

    const isSpares = type === 'spares';
    const title = isSpares ? 'Manage Spares Inventory' : 'Manage Services & Labour';
    const apiUrl = '/api/inventory/items';

    useEffect(() => {
        fetchItems();
        fetchCategories();
        fetchVendors();
        if (initialEditItem) {
            startEdit(initialEditItem);
        }
    }, [type, initialEditItem]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/inventory/categories?t=' + Date.now());
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await axios.get('/api/vendors');
            setVendors(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}?type=${type === 'spares' ? 'spare' : 'service'}`);
            setItems(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            if (!newItem.category_id) {
                // Find category_id from category_name if matching
                const cat = categories.find(c => c.name === newItem.category_name);
                if (cat) newItem.category_id = cat.id;
            }

            if (editingItem) {
                await axios.put(`${apiUrl}/${editingItem.id}`, newItem);
            } else {
                await axios.post(apiUrl, newItem);
            }

            fetchItems();
            resetForm();
        } catch (err) {
            console.error(err);
            alert('Error saving item');
        }
    };

    const resetForm = () => {
        setNewItem({
            name: '',
            part_number: '',
            stock: '',
            low_stock_threshold: 5,
            sale_price: '',
            purchase_price: '',
            item_type: type === 'spares' ? 'spare' : 'service',
            category_id: '',
            category_name: '',
            rack_number: '',
            vendor_id: '',
            estimated_time_minutes: '',
            unit: 'pcs',
            description: ''
        });
        setEditingItem(null);
    };

    const startEdit = (item) => {
        setEditingItem(item);
        setNewItem({
            ...item,
            category_name: item.category_name || item.category,
            sale_price: item.sale_price || item.cost || ''
        });
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`/api/inventory/spares/${id}`);
            setItems(items.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete item');
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/inventory/categories', newCategory);
            setNewCategory({ name: '', type: 'both' });
            fetchCategories();
        } catch (err) {
            alert('Error adding category');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete category? Items using this category will still exist but without valid category ID.')) return;
        try {
            await axios.delete(`/api/inventory/categories/${id}`);
            fetchCategories();
        } catch (err) {
            alert('Error deleting category');
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.part_number && item.part_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{
                width: '1000px', maxWidth: '95%', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'var(--bg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            padding: '0.5rem', borderRadius: '0.5rem',
                            backgroundColor: isSpares ? '#f59e0b20' : '#6366f120',
                            color: isSpares ? '#f59e0b' : '#6366f1'
                        }}>
                            {isSpares ? <Package size={24} /> : <Wrench size={24} />}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{title}</h2>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary)' }}>
                                {isSpares ? 'Add and manage spare parts, oils, and accessories' : 'Define standard labour charges and services'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className={`btn ${view === 'items' ? 'btn-primary' : ''}`} onClick={() => setView('items')}>Items</button>
                        <button className={`btn ${view === 'categories' ? 'btn-primary' : ''}`} onClick={() => setView('categories')}><LayoutGrid size={18} /> Categories</button>
                        <button className="btn" onClick={onClose} style={{ borderRadius: '50%', padding: '0.5rem' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {view === 'items' ? (
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* List Section */}
                        <div style={{ flex: 1.5, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                            {/* Search */}
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                        <input
                                            type="text"
                                            placeholder="Search items..."
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                                {loading ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>Loading...</div>
                                ) : filteredItems.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>No items found.</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-light)', zIndex: 10 }}>
                                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                                                <th style={{ padding: '0.75rem' }}>Category</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Price</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Stock</th>
                                                <th style={{ padding: '0.75rem', width: '80px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map(item => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>
                                                            {item.item_type.toUpperCase()} {item.part_number && `| Part: ${item.part_number}`}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>{item.category_name || item.category}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>₹{item.sale_price}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.stock}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                            <button onClick={() => startEdit(item)} style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteItem(item.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Form Section */}
                        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: 'var(--bg-light)', overflowY: 'auto' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {editingItem ? <Edit2 size={20} /> : <Plus size={20} />} {editingItem ? 'Edit Item' : `Add New ${isSpares ? 'Spare' : 'Service'}`}
                            </h3>
                            <form onSubmit={handleAddItem}>
                                <div className="input-group">
                                    <label className="input-label">Item Name *</label>
                                    <input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">Item Type</label>
                                        <select value={newItem.item_type} onChange={e => setNewItem({ ...newItem, item_type: e.target.value })}>
                                            <option value="spare">Spare Part</option>
                                            <option value="service">Labour/Service</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Category</label>
                                        <select
                                            value={newItem.category_id || newItem.category_name}
                                            onChange={e => {
                                                const cat = categories.find(c => c.id == e.target.value || c.name === e.target.value);
                                                setNewItem({
                                                    ...newItem,
                                                    category_id: cat ? cat.id : '',
                                                    category_name: cat ? cat.name : e.target.value
                                                });
                                            }}
                                        >
                                            <option value="">-- No Category --</option>
                                            {categories.filter(c => c.type === 'both' || c.type === newItem.item_type).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {newItem.item_type !== 'service' && (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-group">
                                                <label className="input-label">Part Number</label>
                                                <input value={newItem.part_number} onChange={e => setNewItem({ ...newItem, part_number: e.target.value })} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Rack Number</label>
                                                <input value={newItem.rack_number} onChange={e => setNewItem({ ...newItem, rack_number: e.target.value })} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="input-group">
                                                <label className="input-label">Purchase Price</label>
                                                <input type="number" value={newItem.purchase_price} onChange={e => setNewItem({ ...newItem, purchase_price: e.target.value })} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Initial Stock</label>
                                                <input type="number" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: e.target.value })} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">Selling Price (Rate) *</label>
                                        <input required type="number" value={newItem.sale_price} onChange={e => setNewItem({ ...newItem, sale_price: e.target.value })} />
                                    </div>
                                    {newItem.item_type !== 'spare' && (
                                        <div className="input-group">
                                            <label className="input-label">Est. Mins</label>
                                            <input type="number" value={newItem.estimated_time_minutes} onChange={e => setNewItem({ ...newItem, estimated_time_minutes: e.target.value })} />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    {editingItem && <button type="button" className="btn" style={{ flex: 1 }} onClick={resetForm}>Cancel</button>}
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editingItem ? 'Update Item' : 'Add Item'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flex: 1, padding: '1.5rem', gap: '2rem' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '1rem' }}>Global Categories</h3>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {categories.map(cat => (
                                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>{cat.name}</span>
                                            <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'var(--secondary)' }}>({cat.type})</span>
                                        </div>
                                        <button onClick={() => handleDeleteCategory(cat.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, height: 'fit-content' }} className="card">
                            <h3>Add New Category</h3>
                            <form onSubmit={handleAddCategory} style={{ marginTop: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Category Name</label>
                                    <input required value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Applicable To</label>
                                    <select value={newCategory.type} onChange={e => setNewCategory({ ...newCategory, type: e.target.value })}>
                                        <option value="both">Both</option>
                                        <option value="spare">Spares Only</option>
                                        <option value="service">Services Only</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Category</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageInventoryModal;
