"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Rocket,
    CheckCircle2,
    ArrowRight,
    FileText,
    Globe,
    Mail,
    User,
    Briefcase,
    HelpCircle,
    Loader2
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { logEvent } from "@/utils/eventLogger";

function LandingPageContent() {
    const [persona, setPersona] = useState('investor'); // 'investor' or 'founder'
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [errors, setErrors] = useState({});
    const [uploadProgress, setUploadProgress] = useState(null); // 'uploading', 'success', 'error'

    const searchParams = useSearchParams();
    const campaign_recipient_id = searchParams?.get("campaign_recipient_id") || null;

    const validate = () => {
        const newErrors = {};
        if (!formData.fullName) newErrors.fullName = "Full Name is required";
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (persona === "investor") {
            if (!formData.targetCompany) newErrors.targetCompany = "Company Name is required";
            if (!formData.website) {
                newErrors.website = "Website is required";
            } else if (!/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
                newErrors.website = "Invalid website URL";
            }
        } else {
            if (!formData.companyName) newErrors.companyName = "Company Name is required";
            if (!formData.website) {
                newErrors.website = "Website is required";
            } else if (!/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
                newErrors.website = "Invalid website URL";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/png',
            'image/jpeg'
        ];
        const maxSize = 25 * 1024 * 1024; // 25MB

        const validFiles = [];
        const newErrors = { ...errors };

        if (selectedFiles.length + files.length > 10) {
            alert("Maximum 10 files allowed");
            return;
        }

        files.forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                alert(`File type ${file.type} is not allowed.`);
                return;
            }
            if (file.size > maxSize) {
                alert(`File ${file.name} is too large (max 25MB).`);
                return;
            }
            validFiles.push(file);
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            setLoading(true);
            try {
                const { getSupabase } = await import('../../supabaseClient');
                const supabase = getSupabase();

                const commonData = {
                    full_name: formData.fullName,
                    email: formData.email,
                    status: 'pending',
                    campaign_recipient_id: campaign_recipient_id,
                    metadata: {
                        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                        submittedAt: new Date().toISOString()
                    },
                    reviewed_by: null,
                    source: 'Landing Page'
                };

                let insertData;
                if (persona === 'investor') {
                    insertData = {
                        ...commonData,
                        persona_type: 'investor',
                        company_fund_name: formData.fundName || null,
                        target_company_name: formData.targetCompany,
                        target_company_url: formData.website,
                        free_text: formData.reason || null
                    };
                } else {
                    insertData = {
                        ...commonData,
                        persona_type: 'company',
                        own_company_name: formData.companyName,
                        own_company_url: formData.website,
                        free_text: formData.lookingFor || null
                    };
                }

                const { data: submissionData, error: submissionError } = await supabase
                    .from('new_submissions')
                    .insert([insertData])
                    .select()
                    .single();

                if (submissionError) throw submissionError;

                const submissionId = submissionData.id;

                // Handle File Uploads
                if (selectedFiles.length > 0) {
                    setUploadProgress('uploading');
                    for (const file of selectedFiles) {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${submissionId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
                        const filePath = `new_submissions/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('submissions')
                            .upload(filePath, file);

                        if (uploadError) {
                            console.log(`Error uploading ${file.name}:`, uploadError);
                            continue;
                        }

                        // Record file in syndet.new_submission_documents
                        const { error: docError } = await supabase
                            .from('new_submission_documents')
                            .insert([{
                                submission_id: submissionId,
                                file_name: file.name,
                                storage_path: filePath,
                                file_type: file.type,
                                file_size: file.size
                            }]);

                        if (docError) {
                            console.log(`Error recording metadata for ${file.name}:`, docError);
                        }
                    }
                    setUploadProgress('success');
                }

                // Log the successful submission event
                logEvent({
                    eventType: `landing_page_submission_${persona}`
                });

                setSubmitted(true);
                setSelectedFiles([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                console.log("Submission failed:", err);
                alert("An unexpected error occurred. Please try again.");
                setUploadProgress('error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePersonaSelect = (type) => {
        setPersona(type);
        setSubmitted(false);
        setFormData({});
        setSelectedFiles([]);
        setErrors({});
    };

    return (
        <div className="landing-container">
            {/* Header */}
            <header className="landing-header">
                <div className="container d-flex justify-content-between align-items-center">
                    <a href="#" className="brand-logo">
                        <Image src="/logo.svg" alt="SyndetAI" width={32} height={32} />
                    </a>
                </div>
            </header>

            {/* Split Content Main Section */}
            <main className="main-content-split">
                <div className="container">
                    <div className="row g-5 align-items-start">
                        {/* Left Side: Form Area */}
                        <div className="col-lg-6 order-2 order-lg-1">
                            <div className="persona-selection-area mb-4">
                                <div className="persona-tabs">
                                    <button
                                        className={`persona-tab ${persona === 'investor' ? 'active' : ''}`}
                                        onClick={() => handlePersonaSelect('investor')}
                                    >
                                        {persona === 'investor' && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="active-tab-bg"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="tab-content">
                                            <Search size={18} className="me-2" />
                                            Investor
                                        </span>
                                    </button>

                                    <button
                                        className={`persona-tab ${persona === 'founder' ? 'active' : ''}`}
                                        onClick={() => handlePersonaSelect('founder')}
                                    >
                                        {persona === 'founder' && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="active-tab-bg"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="tab-content">
                                            <Rocket size={18} className="me-2" />
                                            Founder
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="form-container" style={{ margin: '0', maxWidth: '100%' }}>
                                {!submitted ? (
                                    <>
                                        <div className="form-header">
                                            <h2>{persona === 'investor' ? 'Investor Research' : 'Founder Intelligence'}</h2>
                                            <p>
                                                {persona === 'investor'
                                                    ? 'Perform due diligence quickly without building a massive analyst team.'
                                                    : 'See how your company appears to external investors and stakeholders.'}
                                            </p>
                                        </div>

                                        <form className="syndet-form" onSubmit={handleSubmit}>
                                            <div className="form-group">
                                                <label><User size={14} className="me-1" /> Full Name*</label>
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    className="form-input"
                                                    placeholder="Your Name"
                                                    required
                                                    onChange={handleInputChange}
                                                />
                                                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                                            </div>

                                            <div className="form-group">
                                                <label><Mail size={14} className="me-1" /> Email Address*</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="form-input"
                                                    placeholder="you@company.com"
                                                    required
                                                    onChange={handleInputChange}
                                                />
                                                {errors.email && <span className="error-text">{errors.email}</span>}
                                            </div>

                                            {persona === 'investor' ? (
                                                <>
                                                    <div className="form-group">
                                                        <label><Briefcase size={14} className="me-1" /> Company or Fund Name (Optional)</label>
                                                        <input type="text" name="fundName" className="form-input" placeholder="e.g. Velocity Ventures" onChange={handleInputChange} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Search size={14} className="me-1" /> Company to Research*</label>
                                                        <input type="text" name="targetCompany" className="form-input" placeholder="Name of target startup" required onChange={handleInputChange} />
                                                        {errors.targetCompany && <span className="error-text">{errors.targetCompany}</span>}
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Globe size={14} className="me-1" /> Company Website*</label>
                                                        <input type="text" name="website" className="form-input" placeholder="https://target.com" required onChange={handleInputChange} />
                                                        {errors.website && <span className="error-text">{errors.website}</span>}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="form-group">
                                                        <label><Rocket size={14} className="me-1" /> Company Name*</label>
                                                        <input type="text" name="companyName" className="form-input" placeholder="Your Startup Name" required onChange={handleInputChange} />
                                                        {errors.companyName && <span className="error-text">{errors.companyName}</span>}
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Globe size={14} className="me-1" /> Company Website*</label>
                                                        <input type="text" name="website" className="form-input" placeholder="https://yourstartup.com" required onChange={handleInputChange} />
                                                        {errors.website && <span className="error-text">{errors.website}</span>}
                                                    </div>
                                                </>
                                            )}

                                            <div className="form-group">
                                                <label><FileText size={14} className="me-1" /> Upload additional info (Optional)</label>
                                                <div 
                                                    className="file-dropzone border border-dashed p-4 rounded-3 text-center text-muted w-100"
                                                    onClick={() => document.getElementById('fileInput').click()}
                                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    <input 
                                                        type="file" 
                                                        id="fileInput" 
                                                        multiple 
                                                        hidden 
                                                        onChange={handleFileChange}
                                                        accept=".pdf,.docx,.xlsx,.csv,.txt,.pptx,.png,.jpg,.jpeg"
                                                    />
                                                    {selectedFiles.length === 0 ? (
                                                        <>
                                                            <div className="mb-2"><FileText size={24} className="text-primary" /></div>
                                                            <div>Click to upload files (max 10)</div>
                                                            <div className="small">PDF, DOCX, XLSX, CSV, TXT, PPTX, PNG, JPG (Max 25MB each)</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-start">
                                                            {selectedFiles.map((file, idx) => (
                                                                <div key={idx} className="d-flex justify-content-between align-items-center mb-1 bg-light p-2 rounded">
                                                                    <span className="small text-truncate" style={{ maxWidth: '80%' }}>{file.name}</span>
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn-close" 
                                                                        style={{ fontSize: '10px' }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeFile(idx);
                                                                        }}
                                                                    ></button>
                                                                </div>
                                                            ))}
                                                            <div className="text-center mt-2 small text-primary font-weight-bold">+ Add more</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button type="submit" className="submit-btn" disabled={loading}>
                                                {loading ? (
                                                    <><Loader2 className="animate-spin" size={20} /> Processing...</>
                                                ) : (
                                                    <>Get Started <ArrowRight size={20} /></>
                                                )}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <motion.div
                                        className="success-card"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <div className="success-icon">
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <h2 className="fw-bold">Request Received!</h2>
                                        {persona === 'investor' ? (
                                            <p>
                                                Thanks, we're preparing your account and your report on <strong>{formData.targetCompany || 'the company'}</strong>.
                                                You'll receive an email with login details and your report.
                                            </p>
                                        ) : (
                                            <p>Thanks, we've received your request and will be in touch shortly.</p>
                                        )}
                                        <button
                                            className="btn btn-outline-primary mt-4 px-4 py-2 rounded-pill"
                                            onClick={() => setSubmitted(false)}
                                        >
                                            New Request
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Hero Content */}
                        <div className="col-lg-6 order-1 order-lg-2">
                            <div className="hero-content-split">
                                <motion.h1
                                    className="hero-headline text-start"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6 }}
                                    style={{ textAlign: 'left' }}
                                >
                                    Intelligence for the <br />Modern Startup Ecosystem
                                </motion.h1>
                                <motion.p
                                    className="hero-subtext"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    style={{ margin: '0 0 2.5rem 0', textAlign: 'left' }}
                                >
                                    SyndetAI leverages advanced AI to provide deep insights for investors and founders,
                                    turning data into actionable intelligence in minutes.
                                </motion.p>

                                <motion.div
                                    className="hero-preview"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    style={{ margin: '0' }}
                                >
                                    <div className="preview-placeholder">
                                        <FileText size={48} strokeWidth={1} />
                                        <p className="fw-bold">Sample Intelligence Report Preview</p>
                                        <div className="d-flex gap-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} style={{ width: 40, height: 4, background: '#eee', borderRadius: 2 }} />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-5 text-center text-muted border-top bg-white">
                <div className="container">
                    <p className="mb-0">© {new Date().getFullYear()} SyndetAI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default function RootPage() {
    return (
        <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
            <LandingPageContent />
        </Suspense>
    );
}


