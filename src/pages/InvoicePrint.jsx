import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

const InvoicePrint = () => {
    const { id } = useParams();
    const location = useLocation();
    const isProforma = location.pathname.includes('/proforma/');

    const [job, setJob] = useState(null);
    const [items, setItems] = useState([]);
    const [inventoryMasters, setInventoryMasters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobRes, itemsRes, invRes] = await Promise.all([
                    axios.get(`/api/jobs/${id}`),
                    axios.get(`/api/jobs/${id}/items`),
                    axios.get('/api/inventory/items')
                ]);
                setJob(jobRes.data);
                setItems(itemsRes.data);
                setInventoryMasters(invRes.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePrint = () => {
        const originalTitle = document.title;
        if (job?.plate_number) {
            document.title = job.plate_number;
        }
        window.print();
        setTimeout(() => { document.title = originalTitle; }, 100);
    };

    if (loading) return <div className="p-8 text-center">{isProforma ? 'Loading Estimation...' : 'Loading Invoice...'}</div>;
    if (!job) return <div className="p-8 text-center">Job Not Found</div>;

    // --- Data Processing for Categorization ---
    const getCategoryType = (item) => {
        if (item.inventory_id) {
            const master = inventoryMasters.find(m => m.id === item.inventory_id);
            if (master) return master.item_type;
        }
        const cat = (item.category || '').toLowerCase();
        if (['oil', 'accessories', 'spare', 'parts'].some(k => cat.includes(k))) return 'spare';
        if (['labour', 'denting', 'painting', 'mechanical', 'service', 'wiring', 'washing'].some(k => cat.includes(k))) return 'service';
        return 'spare';
    };

    const spareItems = items.filter(item => getCategoryType(item) === 'spare' || getCategoryType(item) === 'both');
    const serviceItems = items.filter(item => getCategoryType(item) === 'service');

    const totalSpares = spareItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);
    const totalServices = serviceItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);
    const grandTotal = parseFloat(job.total_amount);
    const advance = parseFloat(job.advance_amount || 0);
    const balance = grandTotal - advance;

    const numToWords = (n) => {
        if (n === 0) return "Zero";
        const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
        const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const toWords = (num) => {
            if (num === 0) return "";
            if (num < 10) return units[num];
            if (num < 20) return teens[num - 10];
            if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + units[num % 10] : "");
            if (num < 1000) return units[Math.floor(num / 100)] + " Hundred " + toWords(num % 100);
            if (num < 100000) return toWords(Math.floor(num / 1000)) + " Thousand " + toWords(num % 1000);
            if (num < 10000000) return toWords(Math.floor(num / 100000)) + " Lakh " + toWords(num % 100000);
            return toWords(Math.floor(num / 10000000)) + " Crore " + toWords(num % 10000000);
        };
        return toWords(Math.floor(n)) + " Only";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // ==========================================
    // 1. PROFORMA TEMPLATE (MINIMALIST - COURIER STYLE)
    // ==========================================
    const ProformaTemplate = () => (
        <div style={{
            width: '900px',
            margin: '28px auto',
            backgroundColor: 'white',
            padding: '18px',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.03)',
            border: '1px solid #e5e5e5',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#000',
            boxSizing: 'border-box'
        }}>
            <style>{`
                @media print {
                    .proforma-page { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 !important; }
                    body { background: #fff !important; }
                }
            `}</style>

            <div className="proforma-page">
                {/* Top Title */}
                <div style={{
                    textAlign: 'center',
                    border: '1px solid #111',
                    padding: '6px 10px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                    fontSize: '16px'
                }}>PROFORMA INVOICE</div>

                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '28px', margin: 0, letterSpacing: '0.5px', fontWeight: 'bold' }}>SHINE TECH BIKEZ</h1>
                        <div style={{ fontSize: '11px', marginTop: '6px', color: '#333', lineHeight: '1.2' }}>
                            Opp Hottel Eda sery Mansion Pipe Line Road Kathirkadavu Eranakulam-682017<br />
                            Ph: 9446593114 &nbsp; Email: shinetechbikez00@gmail.com
                        </div>
                    </div>
                    <div>
                        <img src="/shine_tech_logo.png" alt="Logo" style={{ width: '200px', height: '80px', objectFit: 'contain' }} />
                    </div>
                </div>

                {/* Customer / Vehicle details */}
                <div style={{ display: 'flex', gap: '12px', margin: '8px 0 18px' }}>
                    <div style={{ border: '1px solid #111', padding: '10px', flex: 1, fontSize: '13px' }}>
                        <h4 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '13px' }}>CUSTOMER DETAILS</h4>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Contact Name:</div>
                            <div style={{ flex: 1 }}>{job.customer_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Address:</div>
                            <div style={{ flex: 1 }}>{job.customer_address || '#'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Phone:</div>
                            <div style={{ flex: 1 }}>{job.customer_mobile}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Email:</div>
                            <div style={{ flex: 1 }}>#</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Received By:</div>
                            <div style={{ flex: 1 }}>{job.mechanic_name || 'null'}</div>
                        </div>
                    </div>

                    <div style={{ border: '1px solid #111', padding: '10px', flex: 1, fontSize: '13px' }}>
                        <h4 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '13px' }}>VEHICLE DETAILS</h4>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>VIN/Invoice No:</div>
                            <div style={{ flex: 1 }}>{job.id}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Jobcard No:</div>
                            <div style={{ flex: 1 }}>{job.id}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Invoice Date:</div>
                            <div style={{ flex: 1 }}>{formatDate(new Date())}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Jobcard Date:</div>
                            <div style={{ flex: 1 }}>{formatDate(job.job_date)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Reg. Number:</div>
                            <div style={{ flex: 1 }}>{job.plate_number}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', margin: '3px 0' }}>
                            <div style={{ width: '120px', color: '#333', textTransform: 'uppercase', fontSize: '12px' }}>Model:</div>
                            <div style={{ flex: 1 }}>{job.brand_name} {job.model_name}</div>
                        </div>
                    </div>
                </div>

                {/* Parts Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '10px' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '48px' }}>S.NO</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', textAlign: 'left' }}>PARTICULARS OF PARTS</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>QTY</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>UNIT PRICE</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>DISCOUNT</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spareItems.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'center' }}>{i + 1}</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px' }}>{item.item_name}</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>{item.qty}</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>0.00</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>{parseFloat(item.amount).toFixed(2)}</td>
                            </tr>
                        ))}
                        {spareItems.length === 0 && (
                            <tr><td colSpan="6" style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>No parts</td></tr>
                        )}
                    </tbody>
                </table>

                {/* Services Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '10px' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '48px' }}>S.NO</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', textAlign: 'left' }}>PARTICULARS OF SERVICES</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>QTY</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>UNIT PRICE</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>DISCOUNT</th>
                            <th style={{ border: '1px solid #111', padding: '6px 8px', textTransform: 'uppercase', width: '90px', textAlign: 'right' }}>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serviceItems.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'center' }}>{i + 1}</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px' }}>{item.item_name}</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>1</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>{parseFloat(item.amount).toFixed(2)}</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>0.00</td>
                                <td style={{ borderLeft: '1px solid #111', borderRight: '1px solid #111', padding: '8px', textAlign: 'right' }}>{parseFloat(item.amount).toFixed(2)}</td>
                            </tr>
                        ))}
                        {serviceItems.length === 0 && (
                            <tr><td colSpan="6" style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>No services</td></tr>
                        )}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                    <div style={{ width: '260px', border: '1px solid #111', padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #ddd' }}>
                            <span>SUB TOTAL (Parts)</span>
                            <strong>{totalSpares.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #ddd' }}>
                            <span>SUB TOTAL (Services)</span>
                            <strong>{totalServices.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #ddd', color: '#dc2626' }}>
                            <span>DISCOUNT</span>
                            <strong>-{parseFloat(job.discount || 0).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #ddd' }}>
                            <span>TOTAL AMOUNT</span>
                            <strong>{grandTotal.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                            <span>TOTAL PAID</span>
                            <strong>{parseFloat(job.advance_amount || 0).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>

                {/* In Words */}
                <div style={{ marginTop: '10px', fontSize: '13px' }}>
                    <div style={{ marginTop: '6px' }}><strong>In words:</strong> {numToWords(grandTotal)}</div>
                </div>

                {/* Note Box */}
                <div style={{ border: '1px solid #111', padding: '10px', minHeight: '48px', marginTop: '14px' }}>
                    <strong>Note:</strong>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '20px' }}>
                    <div style={{ textAlign: 'center', fontSize: '12px', paddingTop: '20px', color: '#333' }}>Customer signature</div>
                    <div style={{ textAlign: 'center', fontSize: '12px', paddingTop: '20px', color: '#333' }}>Verified signature</div>
                    <div style={{ textAlign: 'center', fontSize: '12px', paddingTop: '20px', color: '#333' }}>
                        Authorised signatory<br />
                        <strong>SHINE TECH BIKEZ</strong>
                    </div>
                </div>

                {/* Footer Declaration */}
                <div style={{ marginTop: '18px', fontSize: '11px', color: '#333', borderTop: '1px solid #111', paddingTop: '8px' }}>
                    <div style={{ textAlign: 'center', fontWeight: '700', marginBottom: '6px' }}>THANK YOU FOR YOUR VISIT</div>
                    <div style={{ fontSize: '10px', lineHeight: '1.15', color: '#333' }}>
                        THIS IS A COMPUTER GENERATED STATEMENT AND REQUIRES NO SIGNATURE. <br />
                        DECLARATION: THIS BILL OF SUPPLY IS ISSUED AS PER SECTION 31(3)(C) OF CGST ACT, 2017 FOR BUSINESSES NOT REGISTERED UNDER GST. NO GST HAS BEEN CHARGED ON THIS INVOICE.
                    </div>
                </div>
            </div>

            {isProforma && (
                <div className="no-print" style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button onClick={handlePrint} style={{ padding: '12px 30px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>PRINT STATEMENT</button>
                </div>
            )}
        </div>
    );

    // ==========================================
    // 2. INVOICE TEMPLATES (STYLED - UNTOUCHED)
    // ==========================================
    const styles = {
        page: {
            width: '210mm',
            minHeight: '297mm',
            padding: '15mm',
            margin: '0 auto',
            backgroundColor: 'white',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pageBreakAfter: 'always'
        },
        container: {
            fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
            color: '#1e293b',
            lineHeight: 1.5,
            '-webkit-print-color-adjust': 'exact'
        },
        tableHeader: {
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            fontWeight: '600',
            fontSize: '10px',
            textTransform: 'uppercase',
            padding: '6px 8px',
            textAlign: 'left'
        },
        tableCell: {
            borderBottom: '1px solid #e2e8f0',
            padding: '6px 8px',
            fontSize: '11px',
            verticalAlign: 'top'
        }
    };

    const CoverPage = () => (
        <div style={styles.page} className="print-page">
            <div style={{ position: 'absolute', bottom: '10%', left: '20%', right: '20%', height: '2px', background: 'linear-gradient(90deg, transparent, #d97706, transparent)', opacity: 0.5 }}></div>
            <div style={{ position: 'absolute', bottom: '9.5%', left: '30%', right: '30%', height: '1px', background: 'linear-gradient(90deg, transparent, #0f172a, transparent)', opacity: 0.3 }}></div>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <img src="/shine_tech_logo.png" alt="Shine Tech Bikez" style={{ height: '220px', marginBottom: '1.5rem' }} />
                <div style={{ width: '80px', height: '1px', background: '#d97706', marginBottom: '1.5rem', opacity: 0.8 }}></div>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 3rem 0', fontWeight: '600' }}>Two-Wheeler Care</p>
                <div style={{ width: '100%', maxWidth: '400px', borderTop: '2px solid #d97706', borderBottom: '2px solid #d97706', padding: '2rem 0', margin: '2rem 0' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Vehicle Registration</span>
                        <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>{job.plate_number}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}>Job Card No</span>
                            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '700' }}>#{job.id}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}>Invoice No</span>
                            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '700' }}>INV-{job.id}</span>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}><strong>Date of Issue:</strong> {formatDate(new Date())}</p>
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}><strong>Service Advisor:</strong> {job.mechanic_name || 'N/A'}</p>
                </div>
                <div style={{ marginTop: 'auto', paddingBottom: '2rem', fontSize: '0.8rem', color: '#94a3b8' }}><p>Professional • Reliable • Premium</p></div>
            </div>
        </div>
    );

    const DetailsPage = () => (
        <div style={{ ...styles.page, pageBreakAfter: 'avoid' }} className="print-page">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #0f172a 0%, #0f172a 85%, #d97706 85%, #d97706 100%)' }}></div>
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '2px solid #1e293b', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/shine_tech_logo.png" alt="Logo" style={{ height: '80px' }} />
                        <div><h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>SHINE TECH BIKES</h2><p style={{ margin: 0, fontSize: '10px', color: '#64748b', maxWidth: '300px' }}>Opp Hotel Edassery Mansion Pipe Line Road Kathirkadavu Eranakulam - 682017<br />Ph: +91 9446593114</p></div>
                    </div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', opacity: 0.9 }}>INVOICE</div></div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#d97706', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>Customer Details</h3>
                        <div style={{ marginBottom: '4px' }}><span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Customer Name:</span><span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{job.customer_name}</span></div>
                        <div style={{ marginBottom: '4px' }}><span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Address:</span><span style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>{job.customer_address}</span></div>
                        <div><span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Phone:</span><span style={{ fontSize: '11px', color: '#475569' }}>{job.customer_mobile}</span></div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#d97706', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>Vehicle Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                            <div><span style={{ color: '#64748b' }}>Vehicle No:</span><div style={{ fontWeight: '600' }}>{job.plate_number}</div></div>
                            <div><span style={{ color: '#64748b' }}>Model:</span><div style={{ fontWeight: '600' }}>{job.model_name}</div></div>
                            <div><span style={{ color: '#64748b' }}>Odometer:</span><div style={{ fontWeight: '600' }}>{job.km_run || 'N/A'} KM</div></div>
                            <div><span style={{ color: '#64748b' }}>Service Date:</span><div style={{ fontWeight: '600' }}>{formatDate(job.job_date)}</div></div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#0f172a' }}>PARTICULARS OF PARTS</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr><th style={{ ...styles.tableHeader, width: '30px', textAlign: 'center' }}>#</th><th style={styles.tableHeader}>Description</th><th style={{ ...styles.tableHeader, width: '40px', textAlign: 'center' }}>Qty</th><th style={{ ...styles.tableHeader, width: '70px', textAlign: 'right' }}>Price</th><th style={{ ...styles.tableHeader, width: '80px', textAlign: 'right' }}>Amount</th></tr></thead>
                            <tbody>
                                {spareItems.map((item, idx) => (
                                    <tr key={idx}><td style={{ ...styles.tableCell, textAlign: 'center', color: '#64748b' }}>{idx + 1}</td><td style={styles.tableCell}>{item.item_name}</td><td style={{ ...styles.tableCell, textAlign: 'center' }}>{item.qty}</td><td style={{ ...styles.tableCell, textAlign: 'right' }}>{item.rate}</td><td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '600' }}>{item.amount}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#0f172a' }}>PARTICULARS OF SERVICES</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr><th style={{ ...styles.tableHeader, width: '30px', textAlign: 'center' }}>#</th><th style={styles.tableHeader}>Description</th><th style={{ ...styles.tableHeader, width: '40px', textAlign: 'center' }}>-</th><th style={{ ...styles.tableHeader, width: '70px', textAlign: 'right' }}>Price</th><th style={{ ...styles.tableHeader, width: '80px', textAlign: 'right' }}>Amount</th></tr></thead>
                            <tbody>
                                {serviceItems.map((item, idx) => (
                                    <tr key={idx}><td style={{ ...styles.tableCell, textAlign: 'center', color: '#64748b' }}>{idx + 1}</td><td style={styles.tableCell}>{item.item_name}</td><td style={{ ...styles.tableCell, textAlign: 'center', color: '#cbd5e1' }}>-</td><td style={{ ...styles.tableCell, textAlign: 'right' }}>{item.rate}</td><td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '600' }}>{item.amount}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={{ display: 'flex', marginTop: '2rem', borderTop: '2px solid #0f172a', paddingTop: '1rem' }}>
                    <div style={{ flex: 1, paddingRight: '2rem' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>Amount in Words</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', fontStyle: 'italic', color: '#0f172a', minHeight: '30px', marginBottom: '1rem', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>{numToWords(grandTotal)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#f8fafc' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`upi://pay?pa=9446569314-1@okbizaxis&pn=ShineTechBikez&am=${balance}&cu=INR&tn=Invoice_${job.id}`)}`} alt="QR" style={{ width: '80px', height: '80px', display: 'block' }} /><div style={{ fontSize: '8px', textAlign: 'center', marginTop: '4px', fontWeight: '700' }}>SCAN TO PAY</div></div>
                            <div><div style={{ fontSize: '10px', fontWeight: 'bold' }}>UPI ID: 9446569314-1@okbizaxis</div><div style={{ fontSize: '10px', color: '#64748b', maxWidth: '150px', marginTop: '4px' }}>We accept Google Pay, PhonePe, Paytm, and all UPI apps.</div></div>
                        </div>
                    </div>
                    <div style={{ width: '250px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}><span style={{ color: '#64748b' }}>Total Spares:</span><span style={{ fontWeight: '600' }}>₹{totalSpares.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}><span style={{ color: '#64748b' }}>Total Labour/Service:</span><span style={{ fontWeight: '600' }}>₹{totalServices.toFixed(2)}</span></div>
                        {Number(job.discount) > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: '#ef4444' }}><span>Discount:</span><span>-₹{Number(job.discount).toFixed(2)}</span></div>)}
                        <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}><span>GRAND TOTAL:</span><span>₹{grandTotal.toFixed(2)}</span></div>
                        {advance > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#22c55e' }}><span>Advance Paid:</span><span>-₹{advance.toFixed(2)}</span></div>)}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', fontWeight: '700', color: '#d97706' }}><span>BALANCE DUE:</span><span>₹{balance.toFixed(2)}</span></div>
                    </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}><div style={{ width: '30%', borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '10px', textAlign: 'center', color: '#64748b' }}>Customer Signature</div><div style={{ width: '30%', borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '10px', textAlign: 'center', color: '#64748b' }}>Verified By</div><div style={{ width: '30%', borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '10px', textAlign: 'center', color: '#64748b' }}>Authorized Signature</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '11px', color: '#0f172a', fontStyle: 'italic', marginBottom: '4px', fontWeight: '500' }}>"Thank you for choosing Shine Tech Bikes. Ride Safe!"</div><div style={{ fontSize: '9px', color: '#cbd5e1' }}>Shine Tech Bikes &copy; 2026</div></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="invoice-preview" style={{ backgroundColor: isProforma ? 'white' : '#525659', minHeight: '100vh', padding: isProforma ? '0' : '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {!isProforma && (
                <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100 }}>
                    <button onClick={handlePrint} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>PRINT INVOICE</button>
                </div>
            )}

            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; background-color: white !important; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .invoice-preview { padding: 0 !important; background-color: white !important; gap: 0 !important; display: block !important; }
                    .print-page { break-after: page; page-break-after: always; min-height: 297mm; height: 297mm; position: relative; }
                    .print-page:last-child { break-after: auto; page-break-after: auto; }
                }
            `}</style>

            {isProforma ? (
                <ProformaTemplate />
            ) : (
                <>
                    <CoverPage />
                    <DetailsPage />
                </>
            )}
        </div>
    );
};

export default InvoicePrint;
