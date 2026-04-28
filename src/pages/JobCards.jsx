import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter } from 'lucide-react';
import JobCardItem from '../components/JobCardItem';

const JobCards = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    // Filter effect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');

        if (jobs.length > 0) {
            if (status === 'under_servicing') {
                setFilteredJobs(jobs.filter(j => j.status === 'pending' || j.status === 'in_progress'));
                setSearchTerm(''); // Clear manual search
            } else if (status === 'ready') {
                setFilteredJobs(jobs.filter(j => j.status === 'completed'));
                setSearchTerm('');
            } else if (status === 'delivered') {
                setFilteredJobs(jobs.filter(j => j.status === 'delivered'));
                setSearchTerm('');
            } else {
                // Default: Show only jobs that haven't had gate pass issued yet
                // Jobs remain visible even after "Finish" until gate pass is generated
                if (!searchTerm) {
                    setFilteredJobs(jobs.filter(j => !j.is_gate_pass_generated));
                }
            }
        }
    }, [jobs, location.search]);

    const fetchJobs = async () => {
        try {
            const res = await axios.get('/api/jobs');
            setJobs(res.data);
            const params = new URLSearchParams(location.search);
            if (!params.get('status')) {
                // Default: Show only jobs without gate pass
                // Jobs stay visible after "Finish" until gate pass is issued
                setFilteredJobs(res.data.filter(j => !j.is_gate_pass_generated));
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!searchTerm) {
            setFilteredJobs(jobs);
            return;
        }
        const term = searchTerm.toLowerCase();
        const results = jobs.filter(job =>
            job.customer_name?.toLowerCase().includes(term) ||
            job.plate_number?.toLowerCase().includes(term) ||
            job.model_name?.toLowerCase().includes(term) ||
            job.customer_alt_mobile?.includes(term)
        );
        setFilteredJobs(results);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#22c55e';
            case 'pending': return '#eab308';
            case 'delivered': return '#3b82f6';
            default: return '#64748b';
        }
    };

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ margin: 0 }}>Job Cards</h1>
                    <p style={{ color: 'var(--secondary)', margin: 0 }}>Manage service jobs and billing</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/jobs/new')} style={{ height: '44px' }}>
                    <Plus size={18} />
                    New Job Card
                </button>
            </div>

            <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                <div className="search-container" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search by vehicle, customer name..."
                            style={{
                                paddingLeft: '3rem',
                                paddingRight: '1rem',
                                height: '44px',
                                width: '100%',
                                fontSize: '0.95rem'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto' }}>
                        <button className="btn btn-primary" onClick={handleSearch} style={{ height: '44px', flex: 1 }}>
                            Search
                        </button>
                        <button className="btn" style={{ border: '1px solid var(--border)', height: '44px', flex: 1 }}>
                            <Filter size={18} />
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredJobs.map(job => (
                    <JobCardItem key={job.id} job={job} onRefresh={fetchJobs} />
                ))}
            </div>

            {filteredJobs.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>
                    No job cards found. Create one to get started.
                </div>
            )}
        </div>
    );
};

export default JobCards;
