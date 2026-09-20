import React from 'react';
import PublicLayout from '@/components/public-layout';
import { Shield, Key, Database, FileCheck, Eye, Activity, Terminal, Lock } from 'lucide-react';

export default function SecurityPage() {
  return (
    <PublicLayout>
      <div className="space-y-16 max-w-5xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#8B96A5] uppercase tracking-widest px-3 py-1 rounded-full bg-[#2B2B2B]/40 border border-[#DDE2EA]">
            <Shield className="w-3.5 h-3.5 text-[#1E222B]" />
            Trust Center & Security Architecture
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1E222B] leading-tight">
            Enterprise-Grade <br className="hidden sm:inline" />
            <span className="text-[#1E222B]">Data Isolation & Protection</span>
          </h1>
          <p className="text-base text-[#8B96A5] max-w-2xl mx-auto leading-relaxed">
            Catalyst V2 is engineered with multi-tenant logical isolation, row-level security (RLS), field-level encryption, and immutable audit logging.
          </p>
        </div>

        {/* Security Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Key,
              t: 'Tenant Isolation & Row-Level Security',
              d: 'Every tenant database query is restricted at the engine level via Supabase Postgres Row-Level Security (RLS) policies scoped strictly to company_id. Cross-tenant access is structurally prohibited.'
            },
            {
              icon: Lock,
              t: 'Role-Based Access Control (RBAC)',
              d: 'Workspaces enforce granular permissions: OWNER, ADMIN, MARKETER, and ANALYST. Destructive actions, provider integrations, and audit log inspection require explicit administrative authorization.'
            },
            {
              icon: Database,
              t: 'Encryption at Rest & in Transit',
              d: 'All transactional logs, vector embeddings, and customer datasets are encrypted at rest using AES-256 standards. All communication traverses TLS 1.3 encrypted channels across public and private subnets.'
            },
            {
              icon: FileCheck,
              t: 'Immutable Audit Logging',
              d: 'Campaign dispatches, team modifications, integration updates, and authentication events are written to an append-only audit_logs ledger with IP addresses and user agents.'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-7 rounded-xl bg-[#2B2B2B]/20 border border-[#DDE2EA] hover:border-[#0B85FC]/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#2B2B2B]/60 border border-[#DDE2EA] flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#1E222B]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1E222B] mb-2">{item.t}</h2>
                <p className="text-sm text-[#8B96A5] leading-relaxed">{item.d}</p>
              </div>
            );
          })}
        </div>

        {/* Deep Dive Security Infrastructure */}
        <div className="p-8 md:p-10 rounded-xl bg-[#2B2B2B]/30 border border-[#DDE2EA] space-y-6">
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-xl font-bold text-[#1E222B] tracking-tight">Compliance & Infrastructure Resilience</h2>
            <p className="text-sm text-[#8B96A5] leading-relaxed">
              Our infrastructure operates in ISO 27001 and SOC 2 Type II certified data centers. We maintain automated vulnerability scanning, zero-trust network boundaries, and dedicated idempotency queues to protect data integrity during high-throughput real-time campaign dispatches.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-white/40 border border-[#DDE2EA] flex items-center gap-3 text-xs font-mono text-[#1E222B]">
              <Eye className="w-4 h-4 text-[#1E222B]" /> 24/7 Endpoint Monitoring
            </div>
            <div className="p-4 rounded-lg bg-white/40 border border-[#DDE2EA] flex items-center gap-3 text-xs font-mono text-[#1E222B]">
              <Activity className="w-4 h-4 text-[#1E222B]" /> WAF DDoS Shielding
            </div>
            <div className="p-4 rounded-lg bg-white/40 border border-[#DDE2EA] flex items-center gap-3 text-xs font-mono text-[#1E222B]">
              <Terminal className="w-4 h-4 text-[#1E222B]" /> Static & Dynamic AST Audits
            </div>
            <div className="p-4 rounded-lg bg-white/40 border border-[#DDE2EA] flex items-center gap-3 text-xs font-mono text-[#1E222B]">
              <Shield className="w-4 h-4 text-[#1E222B]" /> ISO 27001 Data Centers
            </div>
          </div>
        </div>

        {/* Responsible Disclosure */}
        <div className="p-8 rounded-xl bg-white border border-[#DDE2EA] space-y-4">
          <h2 className="text-lg font-bold text-[#1E222B] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1E222B]" />
            Responsible Vulnerability Disclosure
          </h2>
          <p className="text-sm text-[#8B96A5] leading-relaxed">
            We welcome collaborative security research. If you discover a vulnerability or security flaw in the Catalyst platform, APIs, or database handlers, please submit a diagnostic report outlining reproduction steps to <span className="font-mono text-[#1E222B] underline">security@catalystcrm.ai</span>. We acknowledge all reports within 24 hours and do not pursue legal action against researchers acting in good faith.
          </p>
        </div>

      </div>
    </PublicLayout>
  );
}
