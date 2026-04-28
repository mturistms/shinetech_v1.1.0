import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X, Lock, Unlock, User, Phone, MapPin, Mail, Shield, FileText, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Staff = () => {
    const [isLocked, setIsLocked] = useState(true);
    const [password, setPassword] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    // Initial Form State
    const initialForm = {
        name: '',
        age: '',
        phone: '',
        designation: 'Employee',
        email: '',
        aadhar: '',
        address: '',
        native_place: '',
        photo: '', // URL or Base64 string
        status: 'active'
    };
    const [formData, setFormData] = useState(initialForm);
    const [photoPreview, setPhotoPreview] = useState(null);

    const unlock = (e) => {
        e.preventDefault();
        if (password === 'manager123' || password === 'admin') {
            setIsLocked(false);
            fetchStaff();
        } else {
            alert('Incorrect Password');
        }
    };

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/staff');
            setStaffList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size too large. Max 5MB.');
                return;
            }
            // Convert to Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result }); // Base64 string
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // We can send JSON now!
            const payload = { ...formData };
            if (!payload.age) delete payload.age; // cleanup empty strings if needed or backend handles it

            if (editingStaff) {
                await axios.put(`/api/staff/${editingStaff.id}`, payload);
                alert('Updated successfully');
            } else {
                await axios.post('/api/staff', payload);
                alert('Added successfully');
            }
            setIsModalOpen(false);
            setEditingStaff(null);
            setFormData(initialForm);
            setPhotoPreview(null);
            fetchStaff();
        } catch (err) {
            console.error(err);
            alert('Error saving staff: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;
        try {
            await axios.delete(`/api/staff/${id}`);
            fetchStaff();
        } catch (err) {
            console.error(err);
            alert('Error deleting staff');
        }
    };

    const openEdit = (staff) => {
        setEditingStaff(staff);
        setFormData({ ...staff }); // photo is already a URL from DB
        setPhotoPreview(staff.photo ? (staff.photo.startsWith('http') || staff.photo.startsWith('data:') ? staff.photo : `${axios.defaults.baseURL || ''}${staff.photo}`) : null);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingStaff(null);
        setFormData(initialForm);
        setPhotoPreview(null);
        setIsModalOpen(true);
    };

    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${axios.defaults.baseURL || ''}${path}`;
    };

    if (isLocked) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
                    <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Manager Access Required</h2>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Please enter the manager password to access staff records.</p>
                    <form onSubmit={unlock}>
                        <div className="input-group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                style={{ textAlign: 'center' }}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            <Unlock size={18} /> Access Staff
                        </button>
                    </form>
                    <small style={{ display: 'block', marginTop: '1rem', color: 'var(--secondary)' }}>
                        Hint: manager123
                    </small>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button onClick={openAdd} className="btn btn-primary">
                    <Plus size={18} /> Add New Staff
                </button>
            </div>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {staffList.map(staff => (
                    <div key={staff.id} className="card" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openEdit(staff)} className="btn-icon" style={{ color: 'var(--primary)' }}><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(staff.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', border: '1px solid var(--border)'
                            }}>
                                {staff.photo ? (
                                    <img src={getPhotoUrl(staff.photo)} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=User' }}
                                    />
                                ) : (
                                    <User size={30} color="var(--secondary)" />
                                )}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{staff.name}</h3>
                                <span style={{
                                    fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '1rem',
                                    backgroundColor: staff.designation?.toLowerCase() === 'manager' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: staff.designation?.toLowerCase() === 'manager' ? '#818cf8' : '#34d399',
                                    fontWeight: '600',
                                    border: '1px solid currentColor'
                                }}>
                                    {staff.designation || 'Staff'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Phone size={14} color="var(--secondary)" /> {staff.phone || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Mail size={14} color="var(--secondary)" /> {staff.email || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <MapPin size={14} color="var(--secondary)" /> {staff.native_place || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <FileText size={14} color="var(--secondary)" /> Aadhar: {staff.aadhar || 'N/A'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '1rem'
                }}>
                    <div className="card" style={{ width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                <div style={{
                                    width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto',
                                    backgroundColor: 'var(--bg)', overflow: 'hidden', border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem'
                                }}>
                                    {photoPreview ? (
                                        <img src={getPhotoUrl(photoPreview)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={40} color="var(--secondary)" />
                                    )}
                                </div>
                                <label className="btn btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                                    <Upload size={16} style={{ marginRight: '0.5rem' }} /> Upload Photo
                                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                </label>
                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>
                                    Max 5MB (JPG, PNG)
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Name *</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Designation *</label>
                                    <input required type="text" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Mechanic, Manager" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Age</label>
                                    <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Phone</label>
                                    <input type="text" maxLength="10" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Aadhar Number</label>
                                    <input type="text" value={formData.aadhar} onChange={e => setFormData({ ...formData, aadhar: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Native Place</label>
                                    <input type="text" value={formData.native_place} onChange={e => setFormData({ ...formData, native_place: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label className="input-label">Address</label>
                                <textarea rows="3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Save size={18} /> Save Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
