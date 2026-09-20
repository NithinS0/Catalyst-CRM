'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, ChevronRight, Menu, X,
  Database, Users, Sparkles, Send, BarChart3,
  Bot, Layers, MessageSquare, Zap, ShieldCheck,
  CheckCircle2, AlertCircle, Compass, Terminal,
  Cpu, Eye, Mail, Phone, MessageCircle, Radio, Bell
} from 'lucide-react';
import Footer from '@/components/footer';

/* ═══════════════════════════════════════════════
   10 AGENTS DATA
═══════════════════════════════════════════════ */
const AGENTS = [
  {
    id: 'supervisor',
    name: '1. Supervisor Agent',
    role: 'Central Orchestration & Governance',
    desc: 'Analyzes user business intent, decomposes campaign goals, and routes execution through specialized spokes via LangGraph.',
    inputs: ['Business Goal', 'Company Context', 'Active Constraints'],
    outputs: ['Execution Plan', 'Agent Routing Decisions', 'Task Graph'],
    status: 'Active',
  },
  {
    id: 'intelligence',
    name: '2. Customer Intelligence Agent',
    role: 'Behavioral Discovery & Scoring',
    desc: 'Evaluates recency, frequency, monetary value (RFM), and churn probability curves to pinpoint high-opportunity accounts.',
    inputs: ['Purchase Logs', 'Activity Signals', 'Historical LTV'],
    outputs: ['Opportunity Signals', 'Churn Risk Scores', 'Next Best Action'],
    status: 'Active',
  },
  {
    id: 'segmentation',
    name: '3. Segmentation Agent',
    role: 'Dynamic Audience Partitioning',
    desc: 'Transforms high-level marketing objectives into precise SQL/Boolean filter rules to isolate target recipients.',
    inputs: ['Opportunity Context', 'Customer Attributes', 'Inactivity Thresholds'],
    outputs: ['Validated Segment Rules', 'Audience Count', 'Cohort Criteria'],
    status: 'Active',
  },
  {
    id: 'content',
    name: '4. Content Personalization Agent',
    role: 'Brand-Compliant Dynamic Copywriting',
    desc: 'Generates tailored subject lines, body copy, and calls-to-action tuned to the company voice and recipient traits.',
    inputs: ['Brand Guidelines', 'Segment Demographics', 'Value Proposition'],
    outputs: ['Dynamic Subject Lines', 'Personalized Body HTML', 'A/B Variants'],
    status: 'Active',
  },
  {
    id: 'channel',
    name: '5. Channel Selection Agent',
    role: 'Engagement Channel Routing',
    desc: 'Assesses historical engagement patterns to recommend optimal outreach channels (Email active, mobile channels queued).',
    inputs: ['Channel Response History', 'Customer Contact Info', 'Frequency Caps'],
    outputs: ['Recommended Channel: Email', 'Channel Allocation Rationale'],
    status: 'Active',
  },
  {
    id: 'simulation',
    name: '6. Pre-flight Simulation Agent',
    role: 'Predictive ROI & Outcome Modeling',
    desc: 'Acts as a digital twin to simulate delivery rates, open probability, click-through rates, and projected revenue before sending.',
    inputs: ['Audience Size', 'Content Tone Score', 'Historical Benchmarks'],
    outputs: ['Predicted Open Rate', 'Conversion Projection', 'Expected ROI'],
    status: 'Active',
  },
  {
    id: 'execution',
    name: '7. Execution Agent',
    role: 'Real-Time Provider Dispatch',
    desc: 'Manages batching, idempotency tokens, provider APIs (Resend/SMTP), and queue monitoring with exponential backoff retries.',
    inputs: ['Campaign Payload', 'Resolved Recipients', 'Idempotency Keys'],
    outputs: ['Sent Receipts', 'Provider Message IDs', 'Dispatch Logs'],
    status: 'Active',
  },
  {
    id: 'callback',
    name: '8. Callback Processor Agent',
    role: 'Event Ingestion & Delivery Reconciliation',
    desc: 'Captures and processes provider webhook events: queued, sent, delivered, opened, clicked, bounced, and failed.',
    inputs: ['Provider Webhooks', 'Delivery Telemetry', 'User Interactions'],
    outputs: ['Communication Events', 'Delivery Status Updates', 'Error Flags'],
    status: 'Active',
  },
  {
    id: 'analytics',
    name: '9. Analytics & Explainability Agent',
    role: 'Impact Attribution & Decision Rationale',
    desc: 'Computes real-time conversion metrics, compares predicted vs actual results, and produces clear human-readable explanations.',
    inputs: ['Delivery Logs', 'Order Attributions', 'Prior Predictions'],
    outputs: ['Actual vs Predicted Report', 'Performance Attribution', 'AI Reasoning'],
    status: 'Active',
  },
  {
    id: 'fallback',
    name: '10. Fallback / Recovery Agent',
    role: 'Resilience & Circuit Breaking',
    desc: 'Monitors workflow execution, catches provider exceptions or rate limits, and triggers automatic recovery pathways.',
    inputs: ['Dispatch Exceptions', 'Timeouts', 'Rate Limits'],
    outputs: ['DLQ Queue Records', 'Retry Schedules', 'Operator Alerts'],
    status: 'Active',
  },
];

/* ═══════════════════════════════════════════════
   7-STEP HOW IT WORKS DATA
═══════════════════════════════════════════════ */
const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Define Goal',
    desc: 'Describe your business target in natural language (e.g., "Win back high-value customers who haven\'t purchased in 60 days").',
  },
  {
    num: '02',
    title: 'Understand Customers',
    desc: 'Catalyst Customer Intelligence scans behavioral signals, transaction frequency, and churn risk to identify opportunities.',
  },
  {
    num: '03',
    title: 'Discover Audience',
    desc: 'Segmentation Agent dynamically queries your tenant database to build precise, actionable customer cohorts.',
  },
  {
    num: '04',
    title: 'Personalize Content',
    desc: 'Content Agent drafts brand-compliant subject lines and email templates tailored to each individual customer profile.',
  },
  {
    num: '05',
    title: 'Select Channel',
    desc: 'Channel Selection Agent matches recipients to the most responsive channel. In V2, Email is fully live and active.',
  },
  {
    num: '06',
    title: 'Simulate & Execute',
    desc: 'Simulate open and conversion rates, then launch real-time dispatch with idempotency protection and retry handling.',
  },
  {
    num: '07',
    title: 'Analyze & Improve',
    desc: 'Review actual delivery metrics, open and click rates in real time, with explainable AI recommending the next best action.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [activeWorkflowIndex, setActiveWorkflowIndex] = useState(0);

  // Auto-cycle workflow highlight
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWorkflowIndex((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const flowNodes = [
    'Customer Data',
    'AI Intelligence',
    'Audience Cohort',
    'Personalized Campaign',
    'Real-Time Engagement',
    'Measurable Insights',
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F9FC', color: '#1E222B' }}>

      {/* ═══════════════════════════════════════════════
          STICKY NAVBAR
      ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 transition-all"
        style={{
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #DDE2EA'
        }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/crmlogo_light.png"
                alt="Catalyst"
                className="h-8 w-auto object-contain"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                style={{ background: 'rgba(11,133,252,0.10)', color: '#0B85FC', border: '1px solid rgba(11,133,252,0.20)' }}>
                V2
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: '#5F6878' }}>
              <a href="#product" className="hover:text-[#0B85FC] transition-colors">Product</a>
              <a href="#ai-agents" className="hover:text-[#0B85FC] transition-colors">AI Agents</a>
              <a href="#how-it-works" className="hover:text-[#0B85FC] transition-colors">How It Works</a>
              <a href="#features" className="hover:text-[#0B85FC] transition-colors">Features</a>
              <Link href="/about" className="hover:text-[#0B85FC] transition-colors">About</Link>
              <Link href="/contact" className="hover:text-[#0B85FC] transition-colors">Contact</Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-[rgba(11,133,252,0.06)]"
              style={{ color: '#1E222B' }}>
              Login
            </Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2.5">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#1E222B' }}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden px-6 py-4 space-y-3"
              style={{ borderTop: '1px solid #DDE2EA', background: 'white' }}
            >
              {['#product:Product', '#ai-agents:AI Agents', '#how-it-works:How It Works', '#features:Features'].map(item => {
                const [href, label] = item.split(':');
                return (
                  <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-medium py-1 transition-colors" style={{ color: '#1E222B' }}>
                    {label}
                  </a>
                );
              })}
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium py-1 transition-colors" style={{ color: '#1E222B' }}>About</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium py-1 transition-colors" style={{ color: '#1E222B' }}>Contact</Link>
              <div className="pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid #DDE2EA' }}>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-medium rounded-lg border transition-all"
                  style={{ border: '1px solid #DDE2EA', color: '#1E222B' }}>
                  Login
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full text-center py-2.5 text-sm justify-center">
                  Get Started Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6"
          style={{
            background: 'rgba(11,133,252,0.08)',
            border: '1px solid rgba(11,133,252,0.20)',
            color: '#0B85FC'
          }}>
          <span className="w-2 h-2 rounded-full" style={{ background: '#0DB8FA', boxShadow: '0 0 6px rgba(13,184,250,0.5)' }} />
          <span>From customer data to intelligent action</span>
        </div>

        <h1 className="heading-hero max-w-4xl mx-auto">
          Turn Customer Data Into{' '}
          <span className="text-gradient-blue">Intelligent Action.</span>
        </h1>

        <p className="heading-sub max-w-2xl mx-auto mt-6 text-base">
          Catalyst is an AI-native CRM that discovers customer opportunities, builds personalized campaigns, chooses the right engagement channel, and helps businesses turn customer intelligence into measurable growth.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/register" className="btn-primary w-full sm:w-auto px-7 py-3.5 text-base">
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works" className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-base">
            <span>Explore Catalyst</span>
          </a>
        </div>

        <p className="text-xs font-mono mt-4" style={{ color: '#8B96A5' }}>
          Free during early access. No credit card required.
        </p>

        {/* ─── Interactive Pipeline Visualization ─── */}
        <div id="product" className="mt-16 rounded-2xl p-6 lg:p-8 max-w-5xl mx-auto text-left"
          style={{ background: 'white', border: '1px solid #DDE2EA', boxShadow: '0 4px 24px rgba(14,20,31,0.06)' }}>
          <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: '1px solid #DDE2EA' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#0DB8FA', boxShadow: '0 0 6px rgba(13,184,250,0.5)' }} />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: '#1E222B' }}>
                Catalyst Autonomous Workflow Pipeline
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: '#8B96A5' }}>
              Step {activeWorkflowIndex + 1} of 6
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {flowNodes.map((node, i) => {
              const isActive = i === activeWorkflowIndex;
              return (
                <button
                  key={node}
                  type="button"
                  onClick={() => setActiveWorkflowIndex(i)}
                  className="p-3.5 rounded-xl text-left transition-all cursor-pointer"
                  style={isActive ? {
                    border: '2px solid #0B85FC',
                    background: 'rgba(11,133,252,0.06)',
                    boxShadow: '0 0 0 3px rgba(11,133,252,0.10)'
                  } : {
                    border: '1px solid #DDE2EA',
                    background: 'white',
                    opacity: 0.7
                  }}
                >
                  <div className="text-[10px] font-mono mb-1"
                    style={{ color: isActive ? '#0B85FC' : '#8B96A5' }}>0{i + 1}</div>
                  <div className="text-xs font-semibold" style={{ color: '#1E222B' }}>{node}</div>
                </button>
              );
            })}
          </div>

          {/* Active Step Preview */}
          <div className="mt-6 p-4 rounded-xl text-xs space-y-2 font-mono"
            style={{ border: '1px solid rgba(11,133,252,0.15)', background: 'rgba(11,133,252,0.03)' }}>
            <div className="flex items-center justify-between" style={{ color: '#8B96A5' }}>
              <span>[Pipeline Event: {flowNodes[activeWorkflowIndex]}]</span>
              <span className="font-semibold" style={{ color: '#0B85FC' }}>Active State</span>
            </div>
            <p style={{ color: '#1E222B' }} className="leading-relaxed">
              {activeWorkflowIndex === 0 && 'Ingesting raw customer purchases, recency timestamps, order values, and engagement histories across isolated tenant records.'}
              {activeWorkflowIndex === 1 && 'Customer Intelligence Agent recalculates RFM metrics, LTV potential, and surfaces churn risk indicators automatically.'}
              {activeWorkflowIndex === 2 && 'Segmentation Agent generates structured query rules to capture exact customer cohorts without manual database queries.'}
              {activeWorkflowIndex === 3 && 'Content Agent drafts brand-safe, personalized copy with dynamic variables tailored for the target recipient.'}
              {activeWorkflowIndex === 4 && 'Execution Agent dispatches emails through production Resend / SMTP providers with batching and idempotency keys.'}
              {activeWorkflowIndex === 5 && 'Real-time telemetry captures delivery confirmations, opens, and conversions, feeding next-best-action recommendations.'}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          WHY CATALYST: TRADITIONAL VS CATALYST
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-8" style={{ borderTop: '1px solid #DDE2EA', background: '#F7F9FC' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: '#0B85FC' }}>
              The Architecture Shift
            </div>
            <h2 className="heading-section">
              CRM should do more than store customer data.
            </h2>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: '#5F6878' }}>
              Traditional CRMs act as passive databases requiring teams to manually analyze numbers, write copy, pick segments, and guess outcomes. Catalyst is an active intelligence and execution engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Traditional CRM */}
            <div className="rounded-2xl p-6 lg:p-8" style={{ border: '1px solid #DDE2EA', background: 'white' }}>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-mono uppercase px-2.5 py-1 rounded" style={{ border: '1px solid #DDE2EA', color: '#8B96A5' }}>
                  Traditional CRM
                </span>
                <span className="text-xs" style={{ color: '#8B96A5' }}>Passive Record Store</span>
              </div>
              <ul className="space-y-3.5 text-sm" style={{ color: '#5F6878' }}>
                {[
                  'Stores customer records and raw transaction tables.',
                  'Generates static historical reports without actionable next steps.',
                  'Requires marketers to manually conceive and schedule every campaign.',
                  'No pre-send outcome simulation; marketers guess engagement.',
                  'Leaves post-campaign analysis and next actions up to manual guesswork.',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="font-bold mt-0.5" style={{ color: '#8B96A5' }}>—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Catalyst V2 */}
            <div className="rounded-2xl p-6 lg:p-8 relative" style={{
              border: '2px solid #0B85FC',
              background: 'white',
              boxShadow: '0 8px 32px rgba(11,133,252,0.12)'
            }}>
              <div className="absolute -top-3 left-6">
                <span className="text-xs font-mono uppercase px-3 py-1 rounded-full font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #0B85FC, #0DB8FA)' }}>
                  Recommended
                </span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-mono uppercase px-2.5 py-1 rounded font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #0B85FC, #0DB8FA)' }}>
                  Catalyst V2
                </span>
                <span className="text-xs font-semibold" style={{ color: '#0B85FC' }}>Active Intelligence & Execution</span>
              </div>
              <ul className="space-y-3.5 text-sm" style={{ color: '#1E222B' }}>
                {[
                  ['Discovers Opportunities:', 'Proactively surfaces dormant high-value customers.'],
                  ['Generates Audiences:', 'Translates natural language goals into precise segments.'],
                  ['Personalizes Content:', 'AI copywriting tuned to brand guidelines and recipient context.'],
                  ['Simulates Outcomes:', 'Predicts open rates, conversions, and ROI before dispatch.'],
                  ['Executes in Real Time:', 'Sends real emails with queueing, idempotency, and live tracking.'],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0B85FC' }} />
                    <span><strong>{bold}</strong> {rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════════ */}
      <section id="features" className="py-20 px-6 lg:px-8" style={{ borderTop: '1px solid #DDE2EA', background: 'white' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: '#0B85FC' }}>
              Capabilities
            </div>
            <h2 className="heading-section">Built for measurable customer engagement.</h2>
            <p className="text-sm mt-4" style={{ color: '#5F6878' }}>
              A comprehensive suite of intelligence tools designed around autonomous agent workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Customer 360',
                desc: 'Unified view of customer profile, lifetime value, total orders, behavioral signals, campaign engagement, and personal preferences.',
                tag: 'Full History · RFM Signals',
                color: '#0B85FC',
              },
              {
                icon: Sparkles,
                title: 'AI Campaign Studio',
                desc: 'State your marketing objective in plain English. Catalyst builds the audience, copy, channel strategy, and outcome simulation.',
                tag: 'LangGraph Orchestration',
                color: '#5660F3',
              },
              {
                icon: Bot,
                title: 'Customer Digital Twin',
                desc: 'Deep behavioral synthesis per customer: purchase cadence, category affinities, churn risk score, preferred channels, and predicted next purchases.',
                tag: 'Predictive Persona',
                color: '#6B5CF6',
              },
              {
                icon: Send,
                title: 'Multi-Channel System',
                desc: 'Email is fully active with real provider sending. SMS, WhatsApp, Phone, RCS, and Push notifications are queued as upcoming integrations.',
                tag: 'Email: Active · Others: Coming Soon',
                color: '#0DB8FA',
              },
              {
                icon: Eye,
                title: 'Explainable AI',
                desc: 'Never wonder why Catalyst selected an audience, drafted a message, or recommended a channel. Clear business reasoning on every decision.',
                tag: 'Transparent Logic',
                color: '#0B85FC',
              },
              {
                icon: BarChart3,
                title: 'Database-Driven Analytics',
                desc: 'Real metrics from delivery events: opens, clicks, conversions, and revenue influenced. Compare predicted vs actual results.',
                tag: 'No Fake Metrics',
                color: '#5660F3',
              },
            ].map(({ icon: Icon, title, desc, tag, color }) => (
              <div key={title} className="catalyst-card p-6 flex flex-col justify-between group">
                <div>
                  <div className="p-2.5 rounded-lg w-fit mb-4 transition-all group-hover:scale-110"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#1E222B' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5F6878' }}>{desc}</p>
                </div>
                <div className="mt-6 pt-4 flex items-center gap-2 text-xs font-mono"
                  style={{ borderTop: '1px solid #DDE2EA', color: '#8B96A5' }}>
                  <span>{tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          AI AGENTS SECTION
      ═══════════════════════════════════════════════ */}
      <section id="ai-agents" className="py-20 px-6 lg:px-8" style={{ borderTop: '1px solid #DDE2EA', background: '#F7F9FC' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: '#5660F3' }}>
              LangGraph Multi-Agent Network
            </div>
            <h2 className="heading-section">
              10 specialized AI agents{' '}
              <span className="text-gradient-ai">working as one.</span>
            </h2>
            <p className="text-sm mt-4" style={{ color: '#5F6878' }}>
              Explore each agent&apos;s role, inputs, and outputs across the orchestration graph.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Agent List */}
            <div className="lg:col-span-5 space-y-2">
              {AGENTS.map((agent) => {
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgent(agent)}
                    className="w-full p-3.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between"
                    style={
                      isSelected
                        ? {
                            border: '1px solid #0B85FC',
                            background: 'linear-gradient(135deg, #0B85FC, #5660F3)',
                            color: 'white',
                            boxShadow: '0 4px 16px rgba(11,133,252,0.25)'
                          }
                        : {
                            border: '1px solid #DDE2EA',
                            background: 'white',
                            color: '#1E222B'
                          }
                    }
                  >
                    <div>
                      <div className="text-xs font-bold">{agent.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : '#8B96A5' }}>
                        {agent.role}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: isSelected ? 'white' : '#8B96A5' }} />
                  </button>
                );
              })}
            </div>

            {/* Agent Detail Card */}
            <div className="lg:col-span-7 rounded-2xl p-8 flex flex-col justify-between"
              style={{ background: 'white', border: '1px solid #DDE2EA', boxShadow: '0 4px 24px rgba(14,20,31,0.06)' }}>
              <div>
                <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: '1px solid #DDE2EA' }}>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#8B96A5' }}>
                      Specialist Inspector
                    </span>
                    <h3 className="text-xl font-bold mt-1" style={{ color: '#1E222B' }}>{selectedAgent.name}</h3>
                    <p className="text-xs font-mono mt-0.5" style={{ color: '#5F6878' }}>{selectedAgent.role}</p>
                  </div>
                  <span className="badge badge-blue font-mono text-[10px]">
                    Status: {selectedAgent.status}
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#1E222B' }}>
                      Core Responsibility
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: '#5F6878' }}>
                      {selectedAgent.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid #DDE2EA' }}>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#1E222B' }}>
                        Inputs Required
                      </h4>
                      <ul className="space-y-2 text-xs" style={{ color: '#5F6878' }}>
                        {selectedAgent.inputs.map((inp) => (
                          <li key={inp} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#0B85FC' }} />
                            <span>{inp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#1E222B' }}>
                        Outputs Produced
                      </h4>
                      <ul className="space-y-2 text-xs" style={{ color: '#5F6878' }}>
                        {selectedAgent.outputs.map((out) => (
                          <li key={out} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#0B85FC' }} />
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 flex items-center justify-between text-xs" style={{ borderTop: '1px solid #DDE2EA', color: '#8B96A5' }}>
                <span>Orchestrated via LangGraph StateGraph</span>
                <Link href="/register" className="font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: '#0B85FC' }}>
                  Try Campaign Studio <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS (7 STEPS)
      ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-6 lg:px-8" style={{ borderTop: '1px solid #DDE2EA', background: 'white' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: '#0B85FC' }}>
              Step-By-Step
            </div>
            <h2 className="heading-section">How Catalyst works in practice.</h2>
            <p className="text-sm mt-4" style={{ color: '#5F6878' }}>
              A 7-step journey from raw customer data to closed revenue and continuous optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {WORKFLOW_STEPS.map((st, i) => (
              <div key={st.num} className="rounded-2xl p-6 transition-all group"
                style={{ border: '1px solid #DDE2EA', background: 'white' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#0B85FC';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(11,133,252,0.10)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#DDE2EA';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}>
                <div className="font-mono text-3xl font-bold mb-3 text-gradient-blue">{st.num}</div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#1E222B' }}>{st.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5F6878' }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          REAL-TIME CAMPAIGN EXECUTION
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-8" style={{ borderTop: '1px solid #DDE2EA', background: '#F7F9FC' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono mb-5"
            style={{ background: 'rgba(11,133,252,0.08)', border: '1px solid rgba(11,133,252,0.20)', color: '#0B85FC' }}>
            <Radio className="w-3.5 h-3.5" /> Real-Time Engine
          </div>
          <h2 className="heading-section">Execute campaigns in real time.</h2>
          <p className="text-sm max-w-2xl mx-auto mt-4 leading-relaxed" style={{ color: '#5F6878' }}>
            In V2, Email is fully integrated with actual delivery infrastructure (Resend & SMTP). Catalyst dispatches recipients in batches with idempotency guarantees, records provider message IDs, and monitors delivery status live.
          </p>

          {/* Live Monitor Mock */}
          <div className="mt-12 rounded-2xl p-6 text-left max-w-3xl mx-auto font-mono text-xs space-y-4"
            style={{
              background: '#0E141F',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 48px rgba(14,20,31,0.30)'
            }}>
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="font-bold text-white">Live Campaign Monitor Preview</span>
              <span className="badge badge-blue">Processing</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center py-2">
              {[
                { label: 'QUEUED', val: '1,284', color: '#AAB3C2' },
                { label: 'SENT', val: '1,240', color: '#0B85FC' },
                { label: 'OPENED', val: '732', color: '#10B981' },
                { label: 'FAILED', val: '0', color: '#EF4444' },
              ].map(({ label, val, color }) => (
                <div key={label} className="p-2.5 rounded-lg"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-[10px] mb-1" style={{ color: '#7A8494' }}>{label}</div>
                  <div className="font-bold text-sm" style={{ color }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] pt-1" style={{ color: '#5F6878' }}>
              ✓ Verified provider idempotency token: <span style={{ color: '#0DB8FA' }}>camp_winback_cust_942</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CHANNEL SELECTOR
      ═══════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-8" style={{ borderTop: '1px solid #DDE2EA', background: 'white' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: '#0B85FC' }}>
              Channel System
            </div>
            <h2 className="heading-section">Multi-channel strategy with real execution.</h2>
            <p className="text-sm mt-4" style={{ color: '#5F6878' }}>
              We never fake delivery. Channels reflect their actual backend status.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Mail, label: 'Email', status: 'ACTIVE', active: true },
              { icon: MessageSquare, label: 'SMS', status: 'Coming Soon', active: false },
              { icon: MessageCircle, label: 'WhatsApp', status: 'Coming Soon', active: false },
              { icon: Phone, label: 'Phone AI', status: 'Coming Soon', active: false },
              { icon: Radio, label: 'RCS', status: 'Coming Soon', active: false },
              { icon: Bell, label: 'Push', status: 'Coming Soon', active: false },
            ].map(({ icon: Icon, label, status, active }) => (
              <div key={label} className="p-4 rounded-xl text-left transition-all"
                style={active ? {
                  border: '2px solid #0B85FC',
                  background: 'rgba(11,133,252,0.05)',
                  boxShadow: '0 4px 16px rgba(11,133,252,0.15)'
                } : {
                  border: '1px solid #DDE2EA',
                  background: '#F7F9FC',
                  opacity: 0.75
                }}>
                <Icon className="w-5 h-5 mb-2" style={{ color: active ? '#0B85FC' : '#8B96A5' }} />
                <div className="font-bold text-sm" style={{ color: '#1E222B' }}>{label}</div>
                <div className="text-[10px] font-mono font-bold uppercase mt-1"
                  style={{ color: active ? '#0B85FC' : '#8B96A5' }}>{status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          EARLY ACCESS CTA
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-8 text-center relative overflow-hidden"
        style={{ borderTop: '1px solid #DDE2EA' }}>
        {/* Background gradient */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #0E141F 0%, #1E222B 40%, #2F3654 100%)'
        }} />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(11,133,252,0.20) 0%, transparent 60%)'
        }} />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono mb-5"
            style={{ background: 'rgba(11,133,252,0.15)', border: '1px solid rgba(11,133,252,0.30)', color: '#0DB8FA' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Early Access
          </div>
          <h2 className="heading-section" style={{ color: 'white' }}>
            Catalyst is currently <span className="text-gradient-blue">free for everyone.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto mt-4 leading-relaxed" style={{ color: '#AAB3C2' }}>
            Create your isolated workspace today, explore with pre-built demo data or import your own contacts, and experience AI-native CRM with real campaign execution.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base">
              <span>Create Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="px-7 py-3.5 text-base font-semibold rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
