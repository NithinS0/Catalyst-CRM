import React from 'react';
import type { Metadata } from 'next';
import PublicLayout from '@/components/public-layout';
import { ShieldCheck, Award, FileText, CheckCircle, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: "SOC 2 Compliance Alignment — Catalyst CRM Compliance & Trust",
  description: "Learn about Catalyst's design alignment with AICPA Trust Services Criteria. Read about our security safeguards, data isolation protocols, and access audit standards.",
  alternates: {
    canonical: "https://catalystcrm.ai/soc2",
  },
  openGraph: {
    title: "SOC 2 Compliance | Catalyst CRM",
    description: "Our compliance posture and alignment with security, availability, confidentiality, and privacy standards.",
    url: "https://catalystcrm.ai/soc2",
    type: "website",
  },
};

export default function Soc2Page() {
  return (
    <PublicLayout>
      <div className="space-y-16 max-w-4xl mx-auto">
        
        {/* Title / Hero */}
        <div className="space-y-4 border-b border-white/[0.05] pb-8 text-center sm:text-left">
          <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Compliance Frameworks</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">SOC 2 Alignment</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Catalyst&apos;s architecture is designed following industry security best practices and is actively working towards formal alignment with recognized compliance standards including the AICPA Trust Services Criteria.
          </p>
        </div>

        {/* Introduction */}
        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <p>
            For enterprise brands, a CRM is the heart of customer operations. Trust, transparency, and system reliability are paramount. While Catalyst is currently working towards its formal auditing phases, we implement rigorous security controls aligned with the Trust Services Criteria.
          </p>
        </div>

        {/* SOC 2 Trust Principles */}
        <div className="space-y-8">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            Control Framework Alignment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                t: 'Security Controls',
                d: 'Systems are protected against unauthorized logical access. Firewalls, network segregation, and WAF rules are designed and monitored constantly.'
              },
              {
                t: 'Availability Safeguards',
                d: 'Downtime metrics, disaster recovery exercises, backup schedules, and active infrastructure monitoring meet strict enterprise SLAs.'
              },
              {
                t: 'Confidentiality Protections',
                d: 'Data designated as confidential is isolated. Row-Level Security (RLS) database segregation prevents logical cross-tenant exposure.'
              },
              {
                t: 'Privacy Principles',
                d: 'Shopper data processing, storage limits, and delete queues conform with explicit merchant privacy configurations and DPDP Act 2023 regulations.'
              }
            ].map((principle, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  {principle.t}
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{principle.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Reports request */}
        <div className="p-8 rounded-2xl bg-[#060018]/60 border border-white/[0.08] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              Compliance Documentation
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Active Enterprise customers and prospects under mutual Non-Disclosure Agreements (NDAs) can request our latest security package, including penetration testing summaries and self-assessment checklists.
            </p>
          </div>
          
          <a 
            href="mailto:compliance@catalystcrm.ai?subject=Security%20Package%20Request"
            className="flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 shrink-0 relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030014]"
          >
            Request Security Package
          </a>
        </div>

        {/* Continuous compliance practices */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Continuous Compliance & Tooling
          </h2>
          <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
            <p>
              Instead of relying on once-a-year manual point-in-time checks, Catalyst monitors its network environment continuously. We use modern compliance orchestration tooling to track access levels, verify server image patch status, monitor audit logs, and test recovery scripts automatically.
            </p>
            <p>
              Our infrastructure logs and access permissions sync in real-time, enabling our operations team to catch control drifts before they become compliance incidents.
            </p>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
