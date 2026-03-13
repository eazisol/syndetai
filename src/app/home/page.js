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

function LandingPageContent() {
    const [persona, setPersona] = useState(null); // 'investor' or 'founder'
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
                setLoading(false);
                setSubmitted(true);
                window.scrollTo({ top: (document.querySelector('.form-container')?.offsetTop || 0) - 100, behavior: 'smooth' });
            }, 2000);
        }
    };

    const handlePersonaSelect = (type) => {
        setPersona(type);
        setSubmitted(false);
        setFormData({});
        setErrors({});
        setTimeout(() => {
            document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
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

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <motion.h1
                        className="hero-headline"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        Intelligence for the <br />Modern Startup Ecosystem
                    </motion.h1>
                    <motion.p
                        className="hero-subtext"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        SyndetAI leverages advanced AI to provide deep insights for investors and founders,
                        turning data into actionable intelligence in minutes.
                    </motion.p>

                    <motion.div
                        className="hero-preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
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
            </section>

            {/* Persona Selector */}
            <section className="persona-section">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold h1 mb-3">Who are you?</h2>
                        <p className="text-muted">Select your path to continue</p>
                    </div>

                    <div className="persona-grid">
                        <motion.div
                            className={`persona-card ${persona === 'investor' ? 'active' : ''}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePersonaSelect('investor')}
                        >
                            <div className="persona-icon">
                                <Search size={32} />
                            </div>
                            <h3>I'm an investor</h3>
                            <p className="text-muted small">Researching a company or performing due diligence.</p>
                            <div className={`mt-auto ${persona === 'investor' ? 'text-primary' : 'text-muted'}`}>
                                <ArrowRight size={20} />
                            </div>
                        </motion.div>

                        <motion.div
                            className={`persona-card ${persona === 'founder' ? 'active' : ''}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePersonaSelect('founder')}
                        >
                            <div className="persona-icon">
                                <Rocket size={32} />
                            </div>
                            <h3>I'm a founder</h3>
                            <p className="text-muted small">Understanding how my company appears to investors.</p>
                            <div className={`mt-auto ${persona === 'founder' ? 'text-primary' : 'text-muted'}`}>
                                <ArrowRight size={20} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Dynamic Content Area */}
            <AnimatePresence mode="wait">
                {persona && (
                    <motion.section
                        key={persona}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="form-section pb-5"
                    >
                        <div className="container">
                            <div className="form-container">
                                {!submitted ? (
                                    <>
                                        <div className="form-header text-center">
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
                                                    <div className="form-group">
                                                        <label><HelpCircle size={14} className="me-1" /> Why are you interested? (Optional)</label>
                                                        <textarea name="reason" className="form-input" placeholder="Share specific areas of interest..." rows={3} onChange={handleInputChange} />
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
                                                    <div className="form-group">
                                                        <label><Search size={14} className="me-1" /> What are you looking for? (Optional)</label>
                                                        <textarea name="lookingFor" className="form-input" placeholder="Competitor analysis, market perception, etc." rows={3} onChange={handleInputChange} />
                                                    </div>
                                                </>
                                            )}

                                            <div className="form-group">
                                                <label><FileText size={14} className="me-1" /> Upload additional info (Optional)</label>
                                                <div className="border border-dashed p-4 rounded-3 text-center text-muted">
                                                    Click to drag & drop files here
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
                    </motion.section>
                )}
            </AnimatePresence>

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
