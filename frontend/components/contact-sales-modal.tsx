'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  User, Mail, Briefcase, Building2, Globe, Users, 
  HelpCircle, Sparkles, CheckCircle2, Calendar, 
  ChevronRight, ArrowRight, AlertCircle, Loader2 
} from 'lucide-react';

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPANY_SIZES = [
  '1-10 Employees',
  '11-50 Employees',
  '51-200 Employees',
  '201-500 Employees',
  '501-1000 Employees',
  '1000+ Employees'
];

const USE_CASES = [
  'Customer Retention',
  'Marketing Automation',
  'Audience Segmentation',
  'Personalization',
  'Campaign Analytics',
  'Multi-channel Engagement',
  'Other'
];

export default function ContactSalesModal({ isOpen, onClose }: ContactSalesModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobTitle: '',
    companyName: '',
    industry: '',
    companySize: COMPANY_SIZES[0],
    expectedCustomers: '',
    campaignVolume: '',
    currentCrm: '',
    useCases: [] as string[],
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState('');
  const [demoBooked, setDemoBooked] = useState(false);

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        jobTitle: '',
        companyName: '',
        industry: '',
        companySize: COMPANY_SIZES[0],
        expectedCustomers: '',
        campaignVolume: '',
        currentCrm: '',
        useCases: [],
        message: ''
      });
      setErrors({});
      setTouched({});
      setSubmitStatus('idle');
      setApiError('');
      setDemoBooked(false);
    }
  }, [isOpen]);

  const validateField = (name: string, value: any) => {
    let error = '';
    
    if (name === 'name') {
      if (!value) error = 'Full Name is required.';
      else if (value.trim().length < 3) error = 'Name must be at least 3 characters.';
    }
    
    if (name === 'email') {
      if (!value) {
        error = 'Work Email is required.';
      } else {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(value)) {
          error = 'Please enter a valid email address.';
        } else {
          const domain = value.split('@')[1]?.toLowerCase();
          const freeDomains = [
            'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 
            'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com', 'proton.me',
            'live.com', 'gmx.com', 'yandex.com'
          ];
          if (freeDomains.includes(domain)) {
            error = 'Please use a valid business email address, not a free email provider.';
          }
        }
      }
    }
    
    if (name === 'companyName') {
      if (!value || !value.trim()) error = 'Company Name is required.';
    }
    
    if (name === 'jobTitle') {
      if (!value || !value.trim()) error = 'Job Title is required.';
    }

    if (name === 'industry') {
      if (!value || !value.trim()) error = 'Industry is required.';
    }
    
    if (name === 'message') {
      if (!value) error = 'Message / Requirements is required.';
      else if (value.trim().length < 20) error = 'Requirements details must be at least 20 characters.';
    }
    
    return error;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleUseCasesChange = (useCase: string) => {
    const isSelected = formData.useCases.includes(useCase);
    const newUseCases = isSelected
      ? formData.useCases.filter(u => u !== useCase)
      : [...formData.useCases, useCase];
    handleChange('useCases', newUseCases);
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['name', 'email', 'jobTitle', 'companyName', 'industry', 'message'];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    
    // Mark all as touched to trigger error styling
    const allTouched: Record<string, boolean> = {};
    fieldsToValidate.forEach(field => { allTouched[field] = true; });
    setTouched(allTouched);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          job_title: formData.jobTitle,
          company_name: formData.companyName,
          industry: formData.industry,
          company_size: formData.companySize,
          expected_customers: formData.expectedCustomers || null,
          campaign_volume: formData.campaignVolume || null,
          current_crm: formData.currentCrm || null,
          use_cases: formData.useCases,
          message: formData.message
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit request.');
      }

      setSubmitStatus('success');
    } catch (err: any) {
      setSubmitStatus('error');
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-white/[0.08] bg-[#05011a]/95 backdrop-blur-3xl rounded-2xl shadow-2xl p-0">
        
        {/* Soft glowing backgrounds */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {submitStatus !== 'success' ? (
            <motion.div
              key="sales-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 md:p-8"
            >
              <DialogHeader className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-3 w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  Catalyst Enterprise CRM
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Contact our Solutions Team
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-1.5">
                  Let&apos;s discuss how Catalyst can power autonomous customer engagement for your brand.
                </DialogDescription>
              </DialogHeader>

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-300 text-sm items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Submission failed</span>
                    <p className="mt-0.5 text-red-200/90">{apiError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. PERSONAL INFORMATION */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/[0.04] pb-1.5">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Full Name <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => handleChange('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                          placeholder="John Doe"
                          className={`w-full text-sm bg-[#1E222B] border ${
                            touched.name && errors.name 
                              ? 'border-red-500/60 focus:border-red-500' 
                              : 'border-[#2F3654] focus:border-[#0B85FC]'
                          } rounded-xl py-2.5 pl-10 pr-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200`}
                          style={{ caretColor: '#0B85FC' }}
                        />
                      </div>
                      {touched.name && errors.name && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Work Email <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => handleChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          placeholder="you@company.com"
                          className={`w-full text-sm bg-[#1E222B] border ${
                            touched.email && errors.email 
                              ? 'border-red-500/60 focus:border-red-500' 
                              : 'border-[#2F3654] focus:border-[#0B85FC]'
                          } rounded-xl py-2.5 pl-10 pr-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200`}
                          style={{ caretColor: '#0B85FC' }}
                        />
                      </div>
                      {touched.email && errors.email && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Job Title <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={e => handleChange('jobTitle', e.target.value)}
                          onBlur={() => handleBlur('jobTitle')}
                          placeholder="VP of Growth"
                          className={`w-full text-sm bg-[#1E222B] border ${
                            touched.jobTitle && errors.jobTitle 
                              ? 'border-red-500/60 focus:border-red-500' 
                              : 'border-[#2F3654] focus:border-[#0B85FC]'
                          } rounded-xl py-2.5 pl-10 pr-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200`}
                          style={{ caretColor: '#0B85FC' }}
                        />
                      </div>
                      {touched.jobTitle && errors.jobTitle && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.jobTitle}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. COMPANY INFORMATION */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/[0.04] pb-1.5">
                    Company Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Company Name <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={e => handleChange('companyName', e.target.value)}
                          onBlur={() => handleBlur('companyName')}
                          placeholder="Acme Corp"
                          className={`w-full text-sm bg-[#1E222B] border ${
                            touched.companyName && errors.companyName 
                              ? 'border-red-500/60 focus:border-red-500' 
                              : 'border-[#2F3654] focus:border-[#0B85FC]'
                          } rounded-xl py-2.5 pl-10 pr-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200`}
                          style={{ caretColor: '#0B85FC' }}
                        />
                      </div>
                      {touched.companyName && errors.companyName && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.companyName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Industry <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={formData.industry}
                          onChange={e => handleChange('industry', e.target.value)}
                          onBlur={() => handleBlur('industry')}
                          placeholder="E-commerce / FinTech"
                          className={`w-full text-sm bg-[#1E222B] border ${
                            touched.industry && errors.industry 
                              ? 'border-red-500/60 focus:border-red-500' 
                              : 'border-[#2F3654] focus:border-[#0B85FC]'
                          } rounded-xl py-2.5 pl-10 pr-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200`}
                          style={{ caretColor: '#0B85FC' }}
                        />
                      </div>
                      {touched.industry && errors.industry && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.industry}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Company Size <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                        <select
                          value={formData.companySize}
                          onChange={e => handleChange('companySize', e.target.value)}
                          className="w-full text-sm bg-[#1E222B] border border-[#2F3654] focus:border-[#0B85FC] rounded-xl py-2.5 pl-10 pr-10 text-[#FFFFFF] appearance-none focus:outline-none cursor-pointer"
                        >
                          {COMPANY_SIZES.map(size => (
                            <option key={size} value={size} className="bg-[#1E222B] text-[#FFFFFF]">
                              {size}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. BUSINESS REQUIREMENTS */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/[0.04] pb-1.5">
                    Business Requirements
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Expected Customers
                      </label>
                      <input
                        type="text"
                        value={formData.expectedCustomers}
                        onChange={e => handleChange('expectedCustomers', e.target.value)}
                        placeholder="e.g. 50,000"
                        className="w-full text-sm bg-[#1E222B] border border-[#2F3654] focus:border-[#0B85FC] rounded-xl py-2.5 px-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Monthly Campaign Volume
                      </label>
                      <input
                        type="text"
                        value={formData.campaignVolume}
                        onChange={e => handleChange('campaignVolume', e.target.value)}
                        placeholder="e.g. 1M emails"
                        className="w-full text-sm bg-[#1E222B] border border-[#2F3654] focus:border-[#0B85FC] rounded-xl py-2.5 px-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Current CRM (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.currentCrm}
                        onChange={e => handleChange('currentCrm', e.target.value)}
                        placeholder="e.g. Salesforce / HubSpot"
                        className="w-full text-sm bg-[#1E222B] border border-[#2F3654] focus:border-[#0B85FC] rounded-xl py-2.5 px-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. USE CASES */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/[0.04] pb-1.5">
                    Use Cases
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {USE_CASES.map(useCase => {
                      const isSelected = formData.useCases.includes(useCase);
                      return (
                        <button
                          key={useCase}
                          type="button"
                          onClick={() => handleUseCasesChange(useCase)}
                          className={`text-left text-xs font-semibold py-2 px-3 rounded-lg border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                              : 'bg-white/[0.01] border-white/[0.06] text-slate-400 hover:bg-white/[0.03] hover:border-white/[0.1]'
                          }`}
                        >
                          <span>{useCase}</span>
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-400 text-white' 
                              : 'border-white/[0.15] bg-transparent'
                          }`}>
                            {isSelected && <span className="text-[9px]">✓</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. MESSAGE */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Additional Information / Requirements <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={e => handleChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    placeholder="Looking for white-label deployment and dedicated infrastructure."
                    className={`w-full text-sm bg-[#1E222B] border ${
                      touched.message && errors.message 
                        ? 'border-red-500/60 focus:border-red-500' 
                        : 'border-[#2F3654] focus:border-[#0B85FC]'
                    } rounded-xl p-4 text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none transition-all duration-200 resize-none`}
                    style={{ caretColor: '#0B85FC' }}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {touched.message && errors.message ? (
                      <p className="text-[11px] text-red-400">{errors.message}</p>
                    ) : (
                      <p className="text-[10px] text-slate-500">Provide at least 20 characters detailing your request.</p>
                    )}
                    <span className={`text-[10px] ${formData.message.length >= 20 ? 'text-blue-400' : 'text-slate-500'}`}>
                      {formData.message.length} chars
                    </span>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        Submitting Lead...
                      </>
                    ) : (
                      <>
                        Submit Enterprise Request
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sales-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="p-8 text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              
              <DialogTitle className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Request Submitted Successfully!
              </DialogTitle>
              
              <div className="mt-4 max-w-md mx-auto">
                <p className="text-slate-300 text-sm leading-relaxed">
                  Thank you for your interest in Catalyst Enterprise.
                </p>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Our solutions team will review your requirements and contact you within 24 hours.
                </p>
              </div>

              {/* BOOK DEMO STATE */}
              <AnimatePresence mode="wait">
                {!demoBooked ? (
                  <motion.div
                    key="demo-unbooked"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-semibold text-sm transition-all duration-200 hover:text-white cursor-pointer active:scale-[0.98]"
                    >
                      Return to Website
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoBooked(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Demo Instantly
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="demo-booked"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 max-w-md mx-auto text-left"
                  >
                    <div className="flex gap-3">
                      <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-bold text-white">Simulated Booking Slot Reserved!</h5>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          We&apos;ve provisionally reserved a demo slot for your team. A calendar invite has been sent to your business email.
                        </p>
                        <button
                          type="button"
                          onClick={onClose}
                          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          Back to Site <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>

      </DialogContent>
    </Dialog>
  );
}
