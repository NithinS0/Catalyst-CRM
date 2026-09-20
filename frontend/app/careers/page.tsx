import React from 'react';
import type { Metadata } from 'next';
import PublicLayout from '@/components/public-layout';
import { Briefcase, Zap, Heart, Shield, Users, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: "Careers at Catalyst — Join Our AI Platform Team",
  description: "Work on the cutting edge of LangGraph orchestrators, pgvector database RAG networks, and real-time messaging workflows. View our open positions in Bengaluru and remote.",
  alternates: {
    canonical: "https://catalystcrm.ai/careers",
  },
  openGraph: {
    title: "Careers at Catalyst CRM",
    description: "Build the future of autonomous customer relationship networks.",
    url: "https://catalystcrm.ai/careers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers at Catalyst CRM",
    description: "Build the future of autonomous customer relationship networks.",
  },
};

const OPEN_POSITIONS = [
  {
    title: 'AI Engineer',
    team: 'AI & Core Research',
    location: 'Bengaluru, India (Hybrid)',
    type: 'Full-time',
    description: 'Design and optimize multi-agent orchestrator graphs using LangGraph, coordinate PGVector indexing layers, and run real-time prompt chains.'
  },
  {
    title: 'ML Engineer',
    team: 'Intelligence Services',
    location: 'Remote (APAC)',
    type: 'Full-time',
    description: 'Train and fine-tune localized embedding models and predictive customer LTV matrices. Build scalable training pipelines over streaming user logs.'
  },
  {
    title: 'Full Stack Engineer',
    team: 'Frontend Platform',
    location: 'Bengaluru, India (Hybrid)',
    type: 'Full-time',
    description: 'Build Next.js web applications, dynamic customer segment builders, conversational campaign studios, and premium custom layout rendering engines.'
  },
  {
    title: 'Product Designer',
    team: 'Design & UX',
    location: 'Bengaluru, India (Hybrid)',
    type: 'Full-time',
    description: 'Design beautiful, highly interactive dashboard interfaces, glassmorphic data visualization widgets, and sleek natural language agent prompt inputs.'
  }
];

export default function CareersPage() {
  return (
    <PublicLayout>
      <div className="space-y-20 max-w-5xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/[0.08] border border-blue-500/[0.15]">
            Join Catalyst
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Build the Future of <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Autonomous Commerce</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We are looking for creative engineers, designers, and builders to help us replace traditional database CRMs with autonomous multi-agent networks.
          </p>
        </div>

        {/* Culture & Why Us */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Our Culture
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We operate with high ownership, clear communication, and flat hierarchies. We value developers who understand customer experience, and designers who understand system latency. At Catalyst, we optimize for speed and product quality.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-400" />
              Why Work With Us
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              You will work at the absolute bleeding edge of applied Generative AI and multi-agent system orchestrators. We don&apos;t build wrapper products; we build core enterprise databases and real-time messaging pipeline controllers.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">Core Benefits</h2>
            <p className="text-xs text-slate-500 mt-2 font-mono">SUPPORTING YOUR MIND, BODY, AND CAREER</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, t: 'Comprehensive Healthcare', d: 'Premium medical insurance cover for employees and their immediate dependents.' },
              { icon: Heart, t: 'Workplace Flexibility', d: 'Hybrid office setup with flexible working schedules and workstation allowances.' },
              { icon: Zap, t: 'Latest Workspace Tech', d: 'Top-of-the-line MacBook Pro, curved displays, and all developer tool licenses.' },
              { icon: Users, t: 'Equity Ownership', d: 'Generous early-stage stock option plans (ESOPs) to share in our growth.' }
            ].map((b, i) => {
              const BIcon = b.icon;
              return (
                <div key={i} className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-3">
                  <BIcon className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xs font-bold text-white">{b.t}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{b.d}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open Positions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-mono font-bold text-cyan-400 uppercase tracking-widest">Open Positions</h2>
          </div>
          <div className="space-y-4">
            {OPEN_POSITIONS.map((job, idx) => (
              <div 
                key={job.title}
                tabIndex={0}
                aria-label={`Apply for position: ${job.title} - ${job.team}`}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</h3>
                    <span className="text-[9px] font-mono font-bold bg-white/[0.06] text-slate-400 border border-white/[0.08] px-2 py-0.5 rounded">
                      {job.team}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">{job.description}</p>
                  <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <button className="text-xs font-semibold text-blue-400 group-hover:translate-x-1.5 transition-transform shrink-0 flex items-center gap-1.5 self-start md:self-auto">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
