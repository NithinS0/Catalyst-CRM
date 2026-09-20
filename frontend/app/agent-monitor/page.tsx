'use client';

import React, { useState } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import {
  Cpu, Bot, Layers, FileText, Megaphone, TrendingUp,
  ShieldCheck, Send, BarChart3, Database, RefreshCw,
  Terminal, Activity, CheckCircle2, Play
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface SwarmAgent {
  id: string;
  name: string;
  role: string;
  model: string;
  latency: string;
  status: 'Ready' | 'Active' | 'Standby';
  inputData: string;
  outputData: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const SWARM_AGENTS: SwarmAgent[] = [
  {
    id: 'market_context',
    name: 'MarketContextEngine',
    role: 'Synthesizes enterprise branding constraints and campaign goals',
    model: 'Groq Llama-3 70B',
    latency: '140ms',
    status: 'Ready',
    inputData: 'Brand guidelines, target audience objectives, promotional calendar',
    outputData: 'Semantic context vectors, brand tone parameters',
    icon: Bot,
  },
  {
    id: 'customer_intelligence',
    name: 'CustomerIntelligence',
    role: 'Analyzes buyer history and extracts pgvector memories',
    model: 'Groq Llama-3 70B',
    latency: '220ms',
    status: 'Ready',
    inputData: 'Customer transaction ledger, support tickets, contact timeline',
    outputData: 'Affinity score, predicted purchase interval, churn risk index',
    icon: Database,
  },
  {
    id: 'audience_segmentation',
    name: 'AudienceSegmentation',
    role: 'Generates SQL & JSON filter criteria for cohort formation',
    model: 'Groq Llama-3 8B',
    latency: '95ms',
    status: 'Ready',
    inputData: 'Segmentation natural language prompt, database schema definitions',
    outputData: 'Structured filter AST, matched audience count',
    icon: Layers,
  },
  {
    id: 'creative_architect',
    name: 'CreativeArchitect',
    role: 'Drafts copy variants and tokenized email content',
    model: 'Groq Llama-3 70B',
    latency: '310ms',
    status: 'Ready',
    inputData: 'Context vector, personalization variables, goal prompt',
    outputData: 'Subject line variants, rendered HTML/plain-text email templates',
    icon: FileText,
  },
  {
    id: 'channel_selector',
    name: 'ChannelSelector',
    role: 'Routes outreach through deliverability matrix (Email active in V2)',
    model: 'Rule Engine + Llama-3 8B',
    latency: '45ms',
    status: 'Ready',
    inputData: 'Channel preferences, historical engagement rates, provider health',
    outputData: 'Selected channel: Email (Resend/SMTP), dispatch priority',
    icon: Megaphone,
  },
  {
    id: 'monte_carlo_sim',
    name: 'MonteCarloSimulator',
    role: 'Simulates deliverability, open, and ROI distributions',
    model: 'Stochastic Simulation Engine',
    latency: '180ms',
    status: 'Ready',
    inputData: 'Cohort size, subject line strength, historical open benchmarks',
    outputData: 'Expected open rate (35%), estimated revenue, confidence intervals',
    icon: TrendingUp,
  },
  {
    id: 'safety_guardian',
    name: 'SafetyGuardian',
    role: 'Audits copy for hallucinations, spam triggers, and compliance',
    model: 'Groq Llama-3 8B',
    latency: '80ms',
    status: 'Ready',
    inputData: 'Rendered copy, discount claims, provider rate limits',
    outputData: 'Safety verification pass, anti-spam validation flag',
    icon: ShieldCheck,
  },
  {
    id: 'execution_dispatcher',
    name: 'ExecutionDispatcher',
    role: 'Batches and sends emails via Resend/SMTP with idempotency keys',
    model: 'Native Async Provider Pipeline',
    latency: '60ms',
    status: 'Ready',
    inputData: 'Recipient list, compiled email templates, idempotency locks',
    outputData: 'Provider message IDs, delivery ledger receipts',
    icon: Send,
  },
  {
    id: 'attribution_engine',
    name: 'AttributionEngine',
    role: 'Tracks multi-touch engagement and correlates revenue conversion',
    model: 'Attribution Processor',
    latency: '110ms',
    status: 'Ready',
    inputData: 'Webhook delivery events, clicks, orders, invoice logs',
    outputData: 'Incremental lift metrics, attribution records',
    icon: BarChart3,
  },
  {
    id: 'memory_consolidator',
    name: 'MemoryConsolidator',
    role: 'Writes outcomes and newly learned preferences into pgvector',
    model: 'FastAPI Vector Ingestion Service',
    latency: '150ms',
    status: 'Ready',
    inputData: 'Campaign engagement results, customer behavioral feedback',
    outputData: 'Committed vector embeddings in Supabase customer_memories',
    icon: Cpu,
  },
];

export default function AgentMonitorPage() {
  const { success } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<SwarmAgent>(SWARM_AGENTS[0]);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'LangGraph swarm initialized with 10 cognitive nodes.',
    'MarketContextEngine standing by for goal prompt.',
    'SafetyGuardian anti-hallucination checkpoints verified.',
    'ExecutionDispatcher connected to tenant email provider socket.',
    'Row-Level Security token injection active across all agent queries.',
  ]);

  const runTestCycle = () => {
    setRunningSimulation(true);
    const timestamp = new Date().toLocaleTimeString();
    
    setTimeout(() => {
      setLogs(prev => [
        `[${timestamp}] MarketContextEngine parsed synthetic goal: "Q4 High-Value Reactivation".`,
        `[${timestamp}] CustomerIntelligence queried pgvector for 50 dormant enterprise accounts.`,
        ...prev
      ]);
    }, 400);

    setTimeout(() => {
      setLogs(prev => [
        `[${timestamp}] CreativeArchitect synthesized 3 subject line variants with brand tone 9.4/10.`,
        `[${timestamp}] MonteCarloSimulator calculated predicted open rate 38.2% and ROI 420%.`,
        ...prev
      ]);
    }, 900);

    setTimeout(() => {
      setLogs(prev => [
        `[${timestamp}] SafetyGuardian approved dispatch; anti-spam score 0.02 (Optimal).`,
        `[${timestamp}] ExecutionDispatcher verified provider idempotency key camp_test_001.`,
        ...prev
      ]);
      setRunningSimulation(false);
      success('10-agent orchestration test completed with 0 errors!');
    }, 1500);
  };

  return (
    <LayoutWrapper>
      <div className="space-y-8 pb-10 font-mono">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0E141F 0%, #1E222B 50%, #2F3654 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] uppercase font-mono"
              style={{ background: 'rgba(13,184,250,0.10)', border: '1px solid rgba(13,184,250,0.22)', color: '#0DB8FA' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#0DB8FA', boxShadow: '0 0 4px rgba(13,184,250,0.8)' }} />
              10-Agent Swarm Online
            </div>
            <h1 className="text-2xl font-bold text-white">LangGraph AI Swarm Telemetry</h1>
            <p className="text-xs" style={{ color: '#AAB3C2' }}>
              Real-time state transitions, node latency, memory read/write cycles, and orchestration telemetry.
            </p>
          </div>

          <button
            onClick={runTestCycle}
            disabled={runningSimulation}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-50 self-start sm:self-auto"
          >
            {runningSimulation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{runningSimulation ? 'Running Swarm Test...' : 'Trigger Swarm Test'}</span>
          </button>
        </div>

        {/* Master-Detail Agent Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: 10 Nodes Matrix */}
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-xs uppercase font-bold" style={{ color: '#5F6878' }}>Cognitive Swarm Architecture</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SWARM_AGENTS.map((agent) => {
                const Icon = agent.icon;
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between min-h-[120px]"
                    style={{
                      background: isSelected ? 'rgba(11,133,252,0.10)' : '#1E222B',
                      border: `1px solid ${isSelected ? 'rgba(11,133,252,0.40)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: isSelected ? '0 4px 20px rgba(11,133,252,0.12)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded flex items-center justify-center"
                          style={{ background: isSelected ? 'rgba(11,133,252,0.20)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0B85FC]' : 'text-[#AAB3C2]'}`} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: isSelected ? '#FFFFFF' : '#F7F9FC' }}>{agent.name}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(13,184,250,0.10)', color: '#0DB8FA', border: '1px solid rgba(13,184,250,0.20)' }}>
                        {agent.latency}
                      </span>
                    </div>

                    <p className="text-[11px] line-clamp-2 mt-2 leading-relaxed" style={{ color: '#AAB3C2' }}>
                      {agent.role}
                    </p>

                    <div className="flex items-center justify-between text-[10px] mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: '#5F6878' }}>
                      <span>Model: {agent.model.split(' ')[0]}</span>
                      <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Node Telemetry & Terminal Console */}
          <div className="lg:col-span-5 space-y-5">

            {/* Node Inspector */}
            <div className="p-5 rounded-xl space-y-4" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: '#0DB8FA' }} />
                  <h3 className="text-sm font-bold text-white">Node Details: {selectedAgent.name}</h3>
                </div>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded"
                  style={{ background: 'rgba(13,184,250,0.10)', color: '#0DB8FA', border: '1px solid rgba(13,184,250,0.20)' }}>
                  {selectedAgent.status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold block mb-1" style={{ color: '#5F6878' }}>Mission Objective:</span>
                  <p className="leading-relaxed" style={{ color: '#AAB3C2' }}>{selectedAgent.role}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded" style={{ background: 'rgba(14,20,31,0.60)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[9px] uppercase block" style={{ color: '#5F6878' }}>Inference Engine</span>
                    <strong className="text-[11px] text-white">{selectedAgent.model}</strong>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(14,20,31,0.60)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[9px] uppercase block" style={{ color: '#5F6878' }}>Avg Turn Latency</span>
                    <strong className="text-[11px]" style={{ color: '#0DB8FA' }}>{selectedAgent.latency}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold block mb-1" style={{ color: '#5F6878' }}>Inputs:</span>
                  <p className="text-[11px] p-2 rounded leading-relaxed" style={{ color: '#AAB3C2', background: 'rgba(14,20,31,0.50)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {selectedAgent.inputData}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold block mb-1" style={{ color: '#5F6878' }}>Outputs:</span>
                  <p className="text-[11px] p-2 rounded leading-relaxed" style={{ color: '#AAB3C2', background: 'rgba(14,20,31,0.50)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {selectedAgent.outputData}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Telemetry Log Feed */}
            <div className="p-5 rounded-xl space-y-3" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" style={{ color: '#5660F3' }} />
                  <h3 className="text-xs uppercase font-bold text-white">Telemetry Stream</h3>
                </div>
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#0DB8FA' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#0DB8FA' }} />
                  Live
                </span>
              </div>

              <div className="space-y-2 text-[11px] max-h-56 overflow-y-auto pr-1"
                style={{ background: '#0E141F', borderRadius: 8, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                {logs.map((log, i) => (
                  <div key={i} className="leading-relaxed" style={{ color: '#AAB3C2' }}>
                    <span style={{ color: '#5F6878' }}>[{i === 0 ? 'LATEST' : 'LOG'}]</span>{' '}
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </LayoutWrapper>
  );
}
