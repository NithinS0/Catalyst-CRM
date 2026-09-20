'use client';

import React from 'react';
import PublicLayout from '@/components/public-layout';
import { Download, FileText, Mail, Info, Megaphone } from 'lucide-react';

const PRESS_RELEASES = [
  {
    date: 'June 01, 2026',
    title: 'Catalyst Raises ₹120Cr Series A to Build Autonomous CRM Core',
    desc: 'Funding will be utilized to double the core engineering team, scale GPU inference server infrastructure, and expand enterprise database pipelines.'
  },
  {
    date: 'April 15, 2026',
    title: 'Catalyst Launches pgvector Semantic Memory Pipeline Integration',
    desc: 'The update introduces pgvector-based RAG architecture, enabling agents to parse, embed, and query months of customer support logs instantly.'
  },
  {
    date: 'February 10, 2026',
    title: 'Catalyst Crosses 50,000 Active Shoppers Managed Milestones',
    desc: 'Modern consumer brands see an average lift of 30% in repeat purchase rates within the first 60 days of deploying Catalyst agents.'
  }
];

export default function PressPage() {
  return (
    <PublicLayout>
      <div className="space-y-20 max-w-5xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/[0.08] border border-blue-500/[0.15]">
            Newsroom
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Catalyst Press & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Media Resources</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Latest press releases, corporate announcements, brand assets, and official media contact information.
          </p>
        </div>

        {/* Company Overview & Fact Sheet */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Company Overview
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Catalyst is an AI-native CRM platform that helps brands discover the right audience, generate personalized campaigns, optimize communication channels, and drive measurable business growth through autonomous AI agents. Rebuilding standard data silos to support automated execution loops, Catalyst represents the next evolution in shopper engagement.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Founded in 2024 and headquartered in Bengaluru, India, the company is backed by leading early-stage venture capital firms. Catalyst operates at the intersection of Postgres database architecture, vector databases, and multi-agent coordination frameworks.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
            <h3 className="text-sm font-bold text-white">Fact Sheet</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-white/[0.03] pb-2">
                <span className="text-slate-500">Founded</span>
                <span className="text-slate-300 font-semibold">2024</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.03] pb-2">
                <span className="text-slate-500">Headquarters</span>
                <span className="text-slate-300 font-semibold">Bengaluru, India</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.03] pb-2">
                <span className="text-slate-500">Core Tech</span>
                <span className="text-slate-300 font-semibold">NextJS, LangGraph, PGVector</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">Contact</span>
                <span className="text-blue-400 font-semibold">press@catalystcrm.ai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Media Brand Assets */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Download className="w-5 h-5 text-violet-400" />
            Brand Assets & Logos
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            Please use our official brand guidelines and high-resolution logo files for all press coverages.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { t: 'Catalyst Logo Kit', info: 'SVG and PNG formats in dark, light, and gradient variants.', size: '4.2 MB' },
              { t: 'Product Screenshot Pack', info: 'High-res dashboard, AI Studio, and Analytics screens.', size: '18.5 MB' },
              { t: 'Executive Headshots', info: 'Official photographs of our core leadership team.', size: '12.1 MB' }
            ].map((asset, i) => (
              <div key={i} className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.1] transition-all flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-white">{asset.t}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{asset.info}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
                  <span className="text-[9px] font-mono text-slate-500">{asset.size}</span>
                  <button className="text-[10px] font-semibold text-blue-400 flex items-center gap-1 hover:underline">
                    Download <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Press Releases */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Press Releases</h2>
          </div>
          <div className="space-y-4">
            {PRESS_RELEASES.map((pr, idx) => (
              <div 
                key={pr.title}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all flex flex-col md:flex-row gap-4 items-start"
              >
                <span className="text-xs font-mono text-slate-500 shrink-0 pt-0.5">{pr.date}</span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white hover:text-blue-400 cursor-pointer transition-colors leading-snug">{pr.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{pr.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media Contact info */}
        <div className="p-8 rounded-2xl bg-[#060018]/60 border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Are you a member of the press?</h3>
            <p className="text-xs text-slate-400">For speaking engagements, interviews, or custom quote requests, get in touch.</p>
          </div>
          <a 
            href="mailto:press@catalystcrm.ai" 
            className="flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            <Mail className="w-4 h-4" /> press@catalystcrm.ai
          </a>
        </div>

      </div>
    </PublicLayout>
  );
}
