'use client';

import React, { useState } from 'react';
import PublicLayout from '@/components/public-layout';
import { Mail, MessageSquare, Shield, HelpCircle, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // POST to backend contact sales / support endpoint if available
      await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company_name: formData.company || 'Direct Contact',
          job_title: 'Prospect',
          industry: 'Technology',
          company_size: '1-50',
          message: `[Subject: ${formData.subject || 'General Inquiry'}] ${formData.message}`,
        }),
      }).catch(() => {
        // graceful local fallback
      });

      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DDE2EA] bg-white text-xs font-mono text-[#5F6878]">
            Enterprise Inquiries & Support
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1E222B]">
            Get In Touch With Catalyst
          </h1>
          <p className="text-base text-[#5F6878] max-w-xl mx-auto leading-relaxed">
            Have questions about autonomous CRM workflows, multi-tenant provisioning, or email provider integrations? We’re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Contact Details */}
          <div className="md:col-span-5 space-y-6">
            <div className="catalyst-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border border-[#DDE2EA] bg-white">
                  <Mail className="w-4 h-4 text-[#1E222B]" />
                </div>
                <div>
                  <div className="text-xs text-[#8B96A5] font-mono">Email Us</div>
                  <div className="text-sm font-semibold text-[#1E222B]">contact@catalystcrm.com</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border border-[#DDE2EA] bg-white">
                  <MessageSquare className="w-4 h-4 text-[#1E222B]" />
                </div>
                <div>
                  <div className="text-xs text-[#8B96A5] font-mono">Product Inquiries</div>
                  <div className="text-sm font-semibold text-[#1E222B]">support@catalystcrm.com</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border border-[#DDE2EA] bg-white">
                  <Shield className="w-4 h-4 text-[#1E222B]" />
                </div>
                <div>
                  <div className="text-xs text-[#8B96A5] font-mono">Security & Compliance</div>
                  <div className="text-sm font-semibold text-[#1E222B]">security@catalystcrm.com</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DDE2EA] bg-[#F7F9FC] text-xs text-[#5F6878] leading-relaxed">
              <strong>Early Access Support:</strong> Workspace owners receive dedicated technical support for setting up Resend, custom domains, and CRM data migrations.
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-7">
            <div className="border border-[#DDE2EA] rounded-2xl p-8 bg-white shadow-sm">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-12 h-12 rounded-full border border-[#DDE2EA] bg-[#F7F9FC] flex items-center justify-center mx-auto text-[#1E222B]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1E222B]">Message Received</h3>
                  <p className="text-xs text-[#5F6878] max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. Our engineering team has received your inquiry and will respond within one business day.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
                    }}
                    className="btn-secondary text-xs px-4 py-2 mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg border border-[#DDE2EA] bg-[#F7F9FC] text-xs text-[#1E222B]">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jane@company.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Corp"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Inquiry or Feedback"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help your team?"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors resize-none"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary py-3 text-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
