import React from 'react';
import type { Metadata } from 'next';
import PublicLayout from '@/components/public-layout';
import { Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: "Terms of Service — Catalyst CRM",
  description: "Terms of Service for Catalyst CRM software and multi-tenant services.",
  alternates: {
    canonical: "https://catalystcrm.ai/terms",
  },
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="space-y-3 border-b border-[#DDE2EA] pb-6">
          <span className="text-xs font-mono text-[#5F6878] uppercase tracking-wider">Terms of Service</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E222B] tracking-tight">Terms of Service</h1>
          <div className="flex items-center gap-2 text-xs text-[#8B96A5] font-mono">
            <Clock className="w-3.5 h-3.5" /> Last Updated: June 2026 • Version 2.0
          </div>
        </div>

        <div className="space-y-8 text-sm text-[#5F6878] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Catalyst CRM, you agree to be bound by these Terms of Service. If you are registering on behalf of a company, you represent that you have the authority to bind that entity to these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">2. Early Access & Free Services</h2>
            <p>
              Catalyst is currently offered free of charge during early access. We reserve the right to introduce optional premium features or rate limits with reasonable advance notice, without retroactively billing for free access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">3. Responsible Email Dispatch</h2>
            <p>
              You agree to use Catalyst email campaign execution features solely for legitimate, permission-based marketing communications. You must comply with anti-spam legislation (including CAN-SPAM, GDPR, and CASL) and maintain valid sender and reply-to addresses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">4. Workspace Governance & Roles</h2>
            <p>
              The user who registers a company workspace is designated as the <strong>OWNER</strong>. Owners have authority over team invitations, role assignments (Admin, Marketer, Analyst), integration credentials, and workspace deletion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E222B]">5. Limitation of Liability</h2>
            <p>
              Catalyst provides simulated outcome predictions and AI-generated copy as decision-support tools. You remain responsible for reviewing and approving all outgoing campaign communications before final launch.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
