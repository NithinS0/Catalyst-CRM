import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/components/public-layout';
import { Target, Eye, Sparkles, BookOpen, Heart, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: "About Catalyst CRM — Intelligent Customer Engagement",
  description: "Learn about the mission, architecture, and principles of Catalyst. We transform customer data into intelligent, measurable action.",
  alternates: {
    canonical: "https://catalystcrm.ai/about",
  },
};

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="space-y-16 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DDE2EA] bg-white text-xs font-mono text-[#5F6878]">
            Our Mission & Architecture
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1E222B]">
            From Customer Data To Intelligent Action
          </h1>
          <p className="text-base text-[#5F6878] max-w-2xl mx-auto leading-relaxed">
            Traditional CRM systems mainly store customer records and leave campaign decisions up to manual guesswork. Catalyst was engineered to discover opportunities, compose personalized campaigns, and drive measurable engagement.
          </p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#DDE2EA] rounded-2xl p-6 bg-white">
            <div className="p-2.5 rounded-lg border border-[#DDE2EA] w-fit mb-4">
              <Target className="w-5 h-5 text-[#1E222B]" />
            </div>
            <h2 className="text-lg font-bold text-[#1E222B] mb-2">Our Mission</h2>
            <p className="text-sm text-[#5F6878] leading-relaxed">
              To empower modern businesses to build authentic, highly personalized relationships with every customer at scale. We believe every communication should be timely, relevant, and measurable.
            </p>
          </div>

          <div className="border border-[#DDE2EA] rounded-2xl p-6 bg-white">
            <div className="p-2.5 rounded-lg border border-[#DDE2EA] w-fit mb-4">
              <Eye className="w-5 h-5 text-[#1E222B]" />
            </div>
            <h2 className="text-lg font-bold text-[#1E222B] mb-2">Explainable AI</h2>
            <p className="text-sm text-[#5F6878] leading-relaxed">
              We reject opaque black boxes. When Catalyst selects a segment, recommends an outreach channel, or drafts personalized copy, clear business-level reasoning is always provided.
            </p>
          </div>
        </div>

        {/* Architectural Pillars */}
        <div className="border border-[#DDE2EA] rounded-2xl p-8 bg-[#F7F9FC] space-y-6">
          <h2 className="text-xl font-bold text-[#1E222B]">Four Architectural Pillars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E222B] shrink-0 mt-1" />
              <div>
                <strong className="text-[#1E222B] block">Complete Tenant Isolation</strong>
                <span className="text-[#5F6878] text-xs">Dedicated company scopes enforced at the database and application levels.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E222B] shrink-0 mt-1" />
              <div>
                <strong className="text-[#1E222B] block">LangGraph Multi-Agent Spoke Flow</strong>
                <span className="text-[#5F6878] text-xs">10 cooperative agents orchestrating goal decomposition, copy, and dispatch.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E222B] shrink-0 mt-1" />
              <div>
                <strong className="text-[#1E222B] block">Real Delivery Infrastructure</strong>
                <span className="text-[#5F6878] text-xs">Provider abstraction supporting Resend, SMTP, SendGrid, and Amazon SES.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#1E222B] shrink-0 mt-1" />
              <div>
                <strong className="text-[#1E222B] block">Database-Backed Telemetry</strong>
                <span className="text-[#5F6878] text-xs">Zero fake numbers. Every metric derives directly from verifiable delivery events.</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link href="/register" className="btn-primary px-8 py-3 text-sm inline-flex items-center gap-2">
            <span>Get Started with Catalyst</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
