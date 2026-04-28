import React, { forwardRef } from "react";
import "./JobCardPrint.css";
import logo from "../assets/logo.svg";

const JobCardPrint = forwardRef(({ job }, ref) => {
    if (!job) return null;

    const rawComplaints =
        job.notes || job.complaints
            ? (job.notes || job.complaints).split("\n")
            : [];

    const complaints = rawComplaints.map(line => {
        const parts = line.split(' | ');
        return {
            text: parts[0] || '',
            rate: parts[3] || ''
        };
    });

    const items = job.items || [];

    const combinedRows = [];

    complaints.forEach(c => {
        combinedRows.push({ col1: c.text, col2: "", col3: c.rate ? `₹${c.rate}` : "" });
    });

    items.forEach(item => {
        const name =
            item.qty > 1
                ? `${item.item_name} (x${item.qty})`
                : item.item_name;

        combinedRows.push({
            col1: "",
            col2: name,
            col3: item.amount || item.rate ? `₹${item.amount || item.rate}` : ""
        });
    });

    while (combinedRows.length < 15) {
        combinedRows.push({ col1: "", col2: "", col3: "" });
    }

    const finalRows = combinedRows.slice(0, 15);

    const calculatedSpareTotal = items.reduce((sum, item) => sum + Number(item.amount || (item.qty * item.rate) || 0), 0);
    const complaintsTotal = complaints.reduce((sum, c) => sum + (Number(c.rate) || 0), 0);
    const totalWithComplaints = calculatedSpareTotal + complaintsTotal;

    return (
        <div ref={ref} className="print-container">
            <div className="a4-page">

                {/* ================= HEADER ================= */}
                <div className="header-grid">
                    <div className="header-logo">
                        <img src={logo} alt="Logo" />
                    </div>

                    <div className="header-job-info">
                        <div className="job-title">JOB CARD</div>
                        <div>JOB NO: #{job.id}</div>
                        <div>
                            DATE: {new Date(job.job_date).toLocaleDateString("en-GB")}
                        </div>
                    </div>

                    <div className="header-address">
                        <div className="shop-name">SHINE TECH BIKEZ</div>
                        <div>Opp Hotel Edasery Mansion</div>
                        <div>Pipe Line Road, Kathrikadavu</div>
                        <div>Ernakulam - 682017</div>
                        <div className="shop-phone">PH: 9645693144</div>
                    </div>

                    <div className="cell">VEHICLE NO: <b>{job.plate_number}</b></div>
                    <div className="cell">MODEL: {job.brand_name} {job.model_name}</div>
                    <div className="cell">MECHANIC: {job.mechanic_name}</div>

                    <div className="cell highlight-cell inline-cell">
                        <span className="cell-label">PH:</span>
                        <span className="highlight-value">{job.customer_mobile}</span>
                    </div>

                    <div className="cell highlight-cell inline-cell">
                        <span className="cell-label">CUSTOMER:</span>
                        <span className="highlight-value">{job.customer_name}</span>
                    </div>
                    <div className="cell">
                        DELIVERY:
                        <span className="delivery-line">
                            {job.expected_delivery
                                ? new Date(job.expected_delivery).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })
                                : ""}
                        </span>
                    </div>
                </div>

                {/* ================= MAIN TABLE ================= */}
                <div className="main-grid">
                    <div className="main-grid-header">
                        <div>COMPLAINTS</div>
                        <div>SPARE</div>
                        <div>RATE</div>
                    </div>

                    {finalRows.map((row, i) => (
                        <div key={i} className="grid-row">
                            <div className="grid-cell">{row.col1}</div>
                            <div className="grid-cell">{row.col2}</div>
                            <div className="grid-cell">{row.col3}</div>
                        </div>
                    ))}
                </div>

                {/* ================= FOOTER & GATE PASS ================= */}
                <div className="footer-section-wrapper">
                    <div className="footer-columns">
                        {/* LEFT */}
                        <div className="footer-left">
                            <div className="est-adv-block">
                                <div>ESTIMATION: <b>₹{job.estimated_amount || ""}</b></div>
                                <div>ADVANCE: <b>₹{job.advance_amount || ""}</b></div>
                            </div>

                            <div className="outside-header">
                                <span>OUTSIDE WORK DETAILS</span>
                                <span>RATE</span>
                            </div>

                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="outside-row">
                                    <div></div>
                                    <div></div>
                                </div>
                            ))}
                        </div>

                        {/* REMARK */}
                        <div className="remark-box">
                            <div className="remark-title">REMARK</div>
                            <div className="remark-line"></div>
                        </div>

                        {/* RIGHT */}
                        <div className="footer-right">
                            <div className="check-row">
                                ☐ Helmet &nbsp; ☐ RC &nbsp; ☐ Key
                            </div>

                            <table>
                                <tbody>
                                    <tr><td>SPARE</td><td>₹{calculatedSpareTotal || ""}</td></tr>
                                    <tr><td>OUTSIDE</td><td>₹{job.outside_total || ""}</td></tr>
                                    <tr><td>LABOUR</td><td>₹</td></tr>
                                    <tr className="total">
                                        <td>TOTAL</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ================= GATE PASS (Integrated) ================= */}
                    <div className="gatepass-box">
                        <div className="gatepass-title">GATE PASS</div>

                        <div className="gatepass-grid">
                            <div>Amount</div>
                            <div>Est Time</div>
                            <div>Advance</div>
                            <div>Helmet</div>
                            <div>Fuel</div>

                            <div>₹{job.total_amount || job.estimated_amount || ""}</div>
                            <div></div>
                            <div>₹{job.advance_amount || ""}</div>
                            <div></div>
                            <div></div>
                        </div>

                        <div className="gatepass-footer">
                            <div>Job No: {job.id}</div>
                            <div>Vehicle No: {job.plate_number}</div>
                            <div>Date: ______ Time: ______</div>
                        </div>
                    </div>
                </div>


                {/* SIGNATURE */}
                <div className="signature">
                    <div className="sig-line"></div>
                    <div>MECHANIC SIG</div>
                </div>

            </div>
        </div>
    );
});

export default JobCardPrint;
