import React from 'react';
import type { Metadata } from 'next';
import PublicLayout from '@/components/public-layout';
import { ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: "GDPR Compliance Statement — Catalyst CRM Trust Center",
  description: "Learn how Catalyst CRM enables consumer brands to uphold European Union General Data Protection Regulation requirements as a Data Processor.",
  alternates: {
    canonical: "https://catalystcrm.ai/gdpr",
  },
  openGraph: {
    title: "GDPR Compliance | Catalyst CRM",
    description: "Our role as a Data Processor and support for shopper rights under GDPR.",
    url: "https://catalystcrm.ai/gdpr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GDPR Compliance | Catalyst CRM",
    description: "Our role as a Data Processor and support for shopper rights under GDPR.",
  },
};

export default function GDPRPage() {
  return (
    <PublicLayout>
      <div className="space-y-16 max-w-4xl mx-auto">
        
        {/* Title / Hero */}
        <div className="space-y-4 border-b border-white/[0.05] pb-8 text-center sm:text-left">
          <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">EU Data Compliance</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">GDPR Compliance Statement</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            How Catalyst CRM enables consumer brands to uphold European Union General Data Protection Regulation requirements.
          </p>
        </div>

        {/* Content Block */}
        <div className="space-y-10 text-sm text-slate-400 leading-relaxed">
          <div className="p-6 rounded-xl bg-blue-500/[0.02] border border-blue-500/[0.1] flex gap-4 items-start">
            <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">Processor Commitment</h4>
              <p className="text-xs">
                Under GDPR terminology, our brand customers act as the &ldquo;Data Controller&rdquo; of shopper information, and Catalyst operates as the &ldquo;Data Processor.&rdquo; We maintain a comprehensive DPA and respect all EU data residency standards.
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              Supporting Shopper Rights
            </h2>
            <p>
              We have built dedicated APIs, dashboard workflows, and memory deletion hooks into our database handlers to help controllers respond to shopper rights requests:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                {
                  t: 'Right to Access & Portability',
                  d: 'Controllers can execute JSON/CSV exports of all profiles, transactional records, and vector embeddings associated with a shopper email ID.'
                },
                {
                  t: 'Right to Erasure (Forgotten)',
                  d: 'A single API request or admin button click initiates a cascading purge of a user profile, support embeddings, and order history across active schemas.'
                },
                {
                  t: 'Right to Rectification',
                  d: 'Correct or update customer attributes instantly via dashboard segments or our webhook updates interface.'
                },
                {
                  t: 'Right to Object & Opt-out',
                  d: 'All dispatches (SMS, Email, WhatsApp) contain unsubscribe variables that instantly write blacklists to active schemas.'
                }
              ].map((right, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {right.t}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{right.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">03</span>
              Security & Processing Safeguards
            </h2>
            <p>
              GDPR Article 32 demands technical and organizational measures to safeguard customer data. Catalyst applies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-xs">
              <li>End-to-end logical tenant database segregation (Row-Level Security).</li>
              <li>Encrypted database volumes (AES-256) and TLS transit networks.</li>
              <li>Strict subprocessor vetting and active Data Processing Addendums (DPAs).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">04</span>
              Authorized Subprocessors
            </h2>
            <p>
              To deliver our AI-native CRM features, campaign dispatches, and logical database clusters, Catalyst CRM partners with third-party service providers (subprocessors) that may have access to customer personal records:
            </p>
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs text-left border-collapse border border-white/[0.06]">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                    <th className="p-3 font-semibold text-slate-300">Subprocessor Name</th>
                    <th className="p-3 font-semibold text-slate-300">Service Category</th>
                    <th className="p-3 font-semibold text-slate-300">Data Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Amazon Web Services (AWS)</td>
                    <td className="p-3 text-slate-400">Database hosting, storage, and RAG vector search servers.</td>
                    <td className="p-3 text-slate-400">India (Bengaluru), EU (Frankfurt)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Google Cloud Platform (GCP)</td>
                    <td className="p-3 text-slate-400">Serverless API execution and model fine-tuning hosts.</td>
                    <td className="p-3 text-slate-400">India (Mumbai), EU (Belgium)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Twilio Inc. (SendGrid)</td>
                    <td className="p-3 text-slate-400">SMTP transactional email and notification gateways.</td>
                    <td className="p-3 text-slate-400">United States</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Meta Platforms, Inc.</td>
                    <td className="p-3 text-slate-400">WhatsApp Business API integration and campaign dispatches.</td>
                    <td className="p-3 text-slate-400">Global (edge routing)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Stripe, Inc.</td>
                    <td className="p-3 text-slate-400">Subscription billing processing and customer invoice portals.</td>
                    <td className="p-3 text-slate-400">United States</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">05</span>
              Data Protection Officer (DPO) Contact
            </h2>
            <p>
              If your corporate compliance team needs to execute a DPA with Catalyst CRM or has inquiries regarding EU-US Data Privacy Framework alignments, please contact our DPO office:
            </p>
            <p className="font-mono text-xs text-blue-400">
              dpo@catalystcrm.ai
            </p>
          </section>
        </div>

      </div>
    </PublicLayout>
  );
}
