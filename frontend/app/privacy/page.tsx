import React from 'react';
import type { Metadata } from 'next';
import PublicLayout from '@/components/public-layout';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: "Privacy Policy — Catalyst CRM",
  description: "Read the Catalyst Privacy Policy outlining data practices, tenant isolation, and security commitments.",
  alternates: {
    canonical: "https://catalystcrm.ai/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="space-y-3 border-b border-[#DDE2EA] pb-6">
          <span className="text-xs font-mono text-[#5F6878] uppercase tracking-wider">Legal Framework</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E222B] tracking-tight">Privacy Policy</h1>
          <div className="flex items-center gap-2 text-xs text-[#8B96A5] font-mono">
            <Clock className="w-3.5 h-3.5" /> Last Updated: June 2026 • Version 2.0
          </div>
        </div>

        <div className="space-y-8 text-sm text-[#5F6878] leading-relaxed">
          <div className="p-4 rounded-xl border border-[#DDE2EA] bg-[#F7F9FC] space-y-2">
            <div className="flex items-center gap-2 text-[#1E222B] font-semibold text-xs font-mono uppercase">
              <ShieldCheck className="w-4 h-4 text-[#1E222B]" /> Multi-Tenant Isolation Guarantee
            </div>
            <p className="text-xs text-[#5F6878]">
              Catalyst provides strict multi-tenancy. Data belonging to Company A is cryptographically isolated via Supabase Row-Level Security (RLS) and is never accessible, readable, or leaked to Company B or unauthorized third parties.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">1. Data We Collect</h2>
            <p>
              When you use Catalyst, we process information necessary to provide autonomous CRM services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#5F6878]">
              <li><strong>Account Credentials:</strong> Full name, work email, password hash, and company details provided during registration.</li>
              <li><strong>Customer Records:</strong> Names, contact emails, phone numbers, and attributes you import or seed into your workspace.</li>
              <li><strong>Transaction Telemetry:</strong> Order history, purchase amounts, and item categories used by Customer Intelligence agents to compute RFM and churn scores.</li>
              <li><strong>Delivery Events:</strong> Timestamps, open confirmations, click-through signals, and provider message IDs generated during campaign execution.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">2. How We Use Customer Intelligence</h2>
            <p>
              Data within your tenant is used solely to provide your workspace services: identifying inactive customers, generating personalized email copy, simulating campaign ROI, and reporting real-time results. We do not sell, rent, or cross-pollinate tenant data across companies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">3. AI Models & Privacy</h2>
            <p>
              When AI agents (such as the Content Personalization Agent or Segmentation Agent) process prompts, customer data is only transmitted ephemerally to configured LLM providers (e.g., Groq, OpenAI) with zero data retention for model retraining.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">4. Data Retention & Deletion</h2>
            <p>
              You maintain complete ownership of all customer contacts and campaigns. Workspace owners can delete customer records, segments, campaigns, or their entire workspace at any time through Settings.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
