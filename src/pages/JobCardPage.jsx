import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import JobCardPrint from '../components/JobCardPrint';
import { Printer, Download, Share2, ArrowLeft } from 'lucide-react';
import './JobCardPage.css';

const JobCardPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const componentRef = useRef();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const [jobRes, itemsRes] = await Promise.all([
                axios.get(`/api/jobs/${id}`),
                axios.get(`/api/jobs/${id}/items`)
            ]);
            // Merge items into job object or pass separately. 
            // Passing as part of job object for simplicity in Prop signature if JobCardPrint expects one prop, 
            // but cleaner to pass as separate prop. 
            // Let's attach to job for now as 'items'
            const jobData = jobRes.data;
            jobData.items = itemsRes.data || [];

            setJob(jobData);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert('Error fetching job details');
            setLoading(false);
        }
    };

    // Print handler
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `JobCard_${job?.id}_${job?.plate_number}`,
    });

    // Download as PDF
    const handleDownloadPDF = async () => {
        const element = componentRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`JobCard_${job?.id}_${job?.plate_number}.pdf`);
    };

    // Share to WhatsApp
    const handleShareWhatsApp = async () => {
        const element = componentRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        canvas.toBlob(async (blob) => {
            const file = new File([blob], `JobCard_${job?.id}.png`, { type: 'image/png' });

            // Check if Web Share API is available
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Job Card #${job?.id}`,
                        text: `Job Card for ${job?.plate_number} - ${job?.customer_name}`,
                    });
                } catch (err) {
                    console.error('Error sharing:', err);
                    // Fallback to WhatsApp Web
                    shareViaWhatsAppWeb();
                }
            } else {
                // Fallback to WhatsApp Web
                shareViaWhatsAppWeb();
            }
        });
    };

    const shareViaWhatsAppWeb = () => {
        const text = `Job Card #${job?.id}\nVehicle: ${job?.plate_number}\nCustomer: ${job?.customer_name}\nStatus: ${job?.status}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: 'var(--secondary)'
            }}>
                Loading job card...
            </div>
        );
    }

    if (!job) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                gap: '1rem'
            }}>
                <p style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>Job card not found</p>
                <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
                    <ArrowLeft size={20} />
                    Back to Jobs
                </button>
            </div>
        );
    }

    return (
        <div className="jobcard-page">
            {/* Action Bar */}
            <div className="jobcard-actions no-print">
                <button className="btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Back
                </button>

                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={handlePrint} title="Print Job Card">
                        <Printer size={20} />
                        Print
                    </button>

                    <button className="btn" onClick={handleDownloadPDF} title="Download as PDF" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                        <Download size={20} />
                        PDF
                    </button>

                    <button className="btn" onClick={handleShareWhatsApp} title="Share to WhatsApp" style={{ backgroundColor: '#25D366', color: 'white' }}>
                        <Share2 size={20} />
                        WhatsApp
                    </button>
                </div>
            </div>

            {/* Job Card Preview */}
            <div className="jobcard-preview">
                <JobCardPrint ref={componentRef} job={job} />
            </div>
        </div>
    );
};

export default JobCardPage;
