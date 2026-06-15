'use client';

import React, { useState, useEffect, useRef } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Send, Bot, Layers, FileText, Megaphone, TrendingUp,
  Terminal, Activity, Check, Edit, Mail, MessageSquare, PhoneCall,
  ShieldCheck, AlertTriangle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { useCurrency } from '@/context/currency-context';

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

interface WorkflowStep {
  name: string;
  agent: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  model: string;
  latency: string;
  inputs: string;
  outputs: string;
  defaultOutput: string;
}

const STEPS: WorkflowStep[] = [
  {
    name: '1. Customer Insights',
    agent: 'customer_intelligence',
    description: 'Analyzes customer interaction history',
    icon: EyeIcon,
    model: 'Groq Llama-3 70B (Agentic Tool)',
    latency: '1.2s',
    inputs: 'Business goal, raw contact history logs, timeline activity data',
    outputs: 'Key account analysis, conversion constraints, engagement summaries',
    defaultOutput: 'Identified target contact list ready for custom rules filtering.'
  },
  {
    name: '2. Target Filtering',
    agent: 'segmentation',
    description: 'Builds group rules for target contacts',
    icon: Layers,
    model: 'Groq Llama-3 8B (Structured JSON)',
    latency: '0.8s',
    inputs: 'Target profile notes, customer database schema, filters',
    outputs: 'Structured JSON match rules, segment title & description',
    defaultOutput: 'Generated segment rules targeting inactive high-value customers.'
  },
  {
    name: '3. Message Writing',
    agent: 'content',
    description: 'Writes customized email/SMS message drafts',
    icon: FileText,
    model: 'Groq Llama-3 70B (Copywriter)',
    latency: '1.5s',
    inputs: 'Goal, channel preferences, customer personas, subject tone',
    outputs: 'Email subjects, body copywriting drafts, SMS variants',
    defaultOutput: 'Drafted tailored campaign text templates with active CTAs.'
  },
  {
    name: '4. Channel Choice',
    agent: 'channel',
    description: 'Selects best contact channel (Email, SMS)',
    icon: Megaphone,
    model: 'Groq Llama-3 8B (Channel Scorer)',
    latency: '0.6s',
    inputs: 'Audience response history, delivery rates, content layout',
    outputs: 'Highest probability engagement channel selection (email/sms/whatsapp)',
    defaultOutput: 'Selected Email as the channel with highest historical open rate.'
  },
  {
    name: '5. Result Simulation',
    agent: 'simulation',
    description: 'Simulates conversion rates and value',
    icon: TrendingUp,
    model: 'Groq Llama-3 70B (Monte Carlo)',
    latency: '1.1s',
    inputs: 'Audience size, draft content, channel performance benchmarks',
    outputs: 'Projected delivery, read, click, conversion rates, estimated revenue, expected ROI',
    defaultOutput: 'Calculated expected ROI at 210% with 98% inbox delivery probability.'
  }
];

const SPOKE_PATHS = [
  "M 100 160 C 180 80, 240 51.2, 300 51.2",
  "M 100 160 C 250 120, 380 51.2, 500 51.2",
  "M 100 160 L 700 160",
  "M 100 160 C 250 200, 380 268.8, 500 268.8",
  "M 100 160 C 180 240, 240 268.8, 300 268.8"
];

const SPOKE_POSITIONS = [
  { left: "37.5%", top: "16%" },
  { left: "62.5%", top: "16%" },
  { left: "87.5%", top: "50%" },
  { left: "62.5%", top: "84%" },
  { left: "37.5%", top: "84%" }
];


const LOG_COLORS: Record<string, string> = {
  '[Customer Intelligence':  'text-cyan-700 font-semibold',
  '[Segmentation':           'text-emerald-700 font-semibold',
  '[Content':                'text-violet-750 font-semibold',
  '[Channel':                'text-amber-700 font-semibold',
  '[Simulation':             'text-pink-650 font-semibold',
  '[Marketer':               'text-[var(--text-primary)] font-bold',
  '[System]':                'text-zinc-550',
  '[ERROR]':                 'text-red-600 font-bold',
  '[CRITICAL':               'text-red-600 font-bold',
};

function getLogColor(log: string): string {
  for (const [key, cls] of Object.entries(LOG_COLORS)) {
    if (log.includes(key)) return cls;
  }
  return 'text-zinc-600';
}

export default function CampaignStudioPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { formatCurrency } = useCurrency();

  const [goal, setGoal]                 = useState('Win back high-value customers inactive for 60 days');
  const [isRunning, setIsRunning]       = useState(false);
  const [activeStep, setActiveStep]     = useState<number | null>(null);
  const [logs, setLogs]                 = useState<string[]>([
    '[System] AI Campaign Studio initialized.',
    '[System] Enter a marketing goal above to trigger the 5-agent LangGraph workflow.',
  ]);
  const [results, setResults]           = useState<any | null>(null);
  const [editSubject, setEditSubject]   = useState('');
  const [editBody, setEditBody]         = useState('');
  const [isApproving, setIsApproving]   = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hoveredNode, setHoveredNode]         = useState<number | 'supervisor' | null>(null);
  const [viewMode, setViewMode]               = useState<'graph' | 'sequence'>('graph');


  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (results?.campaign_message) {
      const msg = results.campaign_message;
      const subjectMatch = msg.match(/Subject:\s*(.*)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Personalized Catalyst Outreach';
      const body    = msg.replace(/Subject:\s*(.*)/i, '').trim();
      setEditSubject(subject);
      setEditBody(body);
    }
  }, [results]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('sequence');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLaunchWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isRunning) return;

    setIsRunning(true);
    setResults(null);
    setActiveStep(0);
    setLogs([
      `[Marketer Goal Input] "${goal}"`,
      `[System] Initializing LangGraph campaign studio compilation…`,
    ]);

    try {
      const res = await api.runCampaignStudio(goal) as any;
      const agentLogs: string[] = res.action_logs || [];

      const playStep = (stepIndex: number) => {
        if (stepIndex >= STEPS.length) {
          setActiveStep(null);
          setResults(res);
          setLogs(prev => [
            ...prev,
            `[System] Workflow complete. Database synchronization verified.`,
            `[System] Ready for marketer review and approval.`,
          ]);
          setIsRunning(false);
          return;
        }
        setActiveStep(stepIndex);
        const agentName = STEPS[stepIndex].name;
        setLogs(prev => [...prev, `[System] Routing to [${agentName} Agent]…`]);

        const currentKey = STEPS[stepIndex].agent;
        const relevantLogs = agentLogs.filter(log =>
          log.toLowerCase().includes(currentKey.replace('_', '')) ||
          log.toLowerCase().includes(currentKey.split('_')[0])
        );

        setTimeout(() => {
          setLogs(prev => [
            ...prev,
            ...(relevantLogs.length > 0 ? relevantLogs : [`[${agentName}] Task completed successfully.`]),
          ]);
          playStep(stepIndex + 1);
        }, 1300);
      };

      playStep(0);
    } catch (err: any) {
      console.error(err);
      setLogs(prev => [
        ...prev,
        `[CRITICAL ERROR] Workflow failed: ${err.message}`,
        `[System] Rollback complete. Ready to retry.`,
      ]);
      setIsRunning(false);
      setActiveStep(null);
    }
  };

  const handleApproveCampaign = async () => {
    if (!results) return;
    if (!editBody.trim()) { setValidationError('Campaign body cannot be empty.'); return; }
    setValidationError('');
    setIsApproving(true);
    try {
      const fullMessage = editSubject ? `Subject: ${editSubject}\n\n${editBody}` : editBody;
      await api.approveStudioCampaign({
        marketing_goal:        goal,
        segment_name:          results.generated_segment_name || 'AI Generated Segment',
        segment_rules:         results.generated_segment_rules || [],
        channel:               results.recommended_channel || 'email',
        content_template:      fullMessage,
        description:           `Generated from goal: "${goal}"`,
      });
      success('Campaign saved! Redirecting to Campaigns…');
      setTimeout(() => router.push('/campaigns'), 1200);
    } catch (err: any) {
      toastError(err.message || 'Approval failed');
      setValidationError(err.message || 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  const presets = [
    'Win back high-value customers inactive for 60 days',
    'Invite VIP leads with score > 80 to CEO roundtable',
    'Re-engage churn risk clients with a 15% discount code',
  ];

  return (
    <LayoutWrapper>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="space-y-6 pb-12 text-[var(--text-primary)]"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1 animate-pulse">
            <Sparkles className="w-4 h-4" />
            AI Operations Space
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">AI Campaign Assistant</h1>
          <p className="text-zinc-555 text-sm mt-1 leading-normal">
            Enter a business goal (like winning back inactive customers). Our AI team will write the message, select the best channel, build target filters, and estimate performance.
          </p>
        </div>

        {/* Goal Input */}
        <div className="card glass border border-[var(--border)] shadow-sm space-y-4">
          <form onSubmit={handleLaunchWorkflow} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Describe your business goal</label>
              <div className="relative">
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  disabled={isRunning}
                  rows={2}
                  placeholder="Describe your campaign objective (e.g. Invite VIP leads to a CEO roundtable dinner)…"
                  className="input resize-none pr-24 text-sm"
                />
                <button
                  type="submit"
                  disabled={isRunning || !goal.trim()}
                  className="absolute right-3 bottom-3 btn btn-primary text-xs py-2 px-4 shadow-sm"
                >
                  {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Run</>}
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Example goals:</span>
              {presets.map((p, i) => (
                <button key={i} type="button" onClick={() => setGoal(p)} disabled={isRunning}
                  className="px-3.5 py-1.5 rounded-full bg-[var(--bg-overlay)] hover:bg-zinc-200/50 border border-[var(--border)] text-[10px] text-zinc-500 hover:text-zinc-700 cursor-pointer transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Graph + Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card glass border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-5">
            <style>{`
              @keyframes pulseGlow {
                0%, 100% { opacity: 0.3; stroke-width: 1.5px; }
                50% { opacity: 0.9; stroke-width: 3px; filter: drop-shadow(0 0 4px #4f46e5); }
              }
              @keyframes flowPulse {
                0% { offset-distance: 0%; }
                100% { offset-distance: 100%; }
              }
              .active-path {
                animation: pulseGlow 1.5s infinite ease-in-out;
              }
              .flow-dot {
                width: 7px;
                height: 7px;
                background-color: #6366f1;
                border-radius: 50%;
                filter: drop-shadow(0 0 6px #6366f1);
                position: absolute;
                z-index: 30;
                pointer-events: none;
                animation: flowPulse 1.6s infinite linear;
              }
            `}</style>

            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                AI Agent Network Flow
              </h3>
              <div className="hidden md:flex items-center bg-[var(--bg-overlay)] rounded-lg p-0.5 border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setViewMode('graph')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    viewMode === 'graph'
                      ? 'bg-white text-indigo-650 shadow-sm border border-zinc-200/40'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Graph View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sequence')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    viewMode === 'sequence'
                      ? 'bg-white text-indigo-655 shadow-sm border border-zinc-200/40'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Sequence View
                </button>
              </div>
            </div>

            {viewMode === 'graph' ? (
              /* Network Graph Mode */
              <div
                className="relative w-full h-[320px] rounded-2xl border border-[var(--border)]/40 overflow-hidden select-none bg-slate-50/50"
                style={{
                  backgroundImage: "radial-gradient(#e2e8f0 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px"
                }}
              >
                {/* SVG connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 320">
                  <defs>
                    <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  
                  {/* Sequence path loop */}
                  <path d="M 300 51.2 L 500 51.2" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" fill="none" strokeOpacity="0.4" />
                  <path d="M 500 51.2 Q 620 90, 700 160" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" fill="none" strokeOpacity="0.4" />
                  <path d="M 700 160 Q 620 230, 500 268.8" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" fill="none" strokeOpacity="0.4" />
                  <path d="M 500 268.8 L 300 268.8" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" fill="none" strokeOpacity="0.4" />
                  <path d="M 300 268.8 Q 220 160, 300 51.2" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" fill="none" strokeOpacity="0.4" />

                  {/* Hub-and-Spoke Orchestrator Connections */}
                  {STEPS.map((step, idx) => {
                    const isCompleted = activeStep === null ? !!results : idx < activeStep;
                    const isActive = activeStep === idx;
                    const path = SPOKE_PATHS[idx];
                    
                    let strokeColor = "#e2e8f0";
                    let opacity = 0.4;
                    let strokeWidth = 1.5;
                    
                    if (isActive) {
                      strokeColor = "url(#activeGradient)";
                      opacity = 0.9;
                      strokeWidth = 2.5;
                    } else if (isCompleted) {
                      strokeColor = "#10b981";
                      opacity = 0.7;
                      strokeWidth = 2;
                    }
                    
                    return (
                      <path
                        key={idx}
                        d={path}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        fill="none"
                        className={isActive ? "active-path" : ""}
                      />
                    );
                  })}
                </svg>

                {/* Pulsing traveling dot along active agent line */}
                {activeStep !== null && (
                  <div
                    className="flow-dot"
                    style={{
                      offsetPath: `path('${SPOKE_PATHS[activeStep]}')`,
                    }}
                  />
                )}

                {/* Supervisor Hub Node */}
                <div
                  onMouseEnter={() => setHoveredNode('supervisor')}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ left: "12.5%", top: "50%", transform: "translate(-50%, -50%)" }}
                  className={`absolute z-20 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 cursor-pointer ${
                    isRunning
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-150 animate-pulse'
                      : results
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md'
                      : 'bg-white border-zinc-200 text-zinc-500 shadow-sm hover:border-zinc-350 hover:shadow-md'
                  }`}
                >
                  <Bot className="w-7 h-7" />
                  <span className="text-[8px] font-extrabold uppercase mt-1 tracking-wider">Supervisor</span>
                </div>

                {/* Specialist Agent Nodes */}
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = activeStep === null ? !!results : idx < activeStep;
                  const isActive = activeStep === idx;
                  const position = SPOKE_POSITIONS[idx];
                  
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredNode(idx)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ left: position.left, top: position.top, transform: "translate(-50%, -50%)" }}
                      className="absolute z-20 flex flex-col items-center text-center cursor-pointer w-24"
                    >
                      <motion.div
                        animate={isActive ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 1.5 } } : { scale: 1 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-md'
                          : isActive   ? 'bg-indigo-50 border-indigo-650 text-indigo-600 shadow-lg'
                          :              'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-350'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </motion.div>
                      <p className={`text-[9px] font-extrabold mt-1.5 leading-tight ${isActive ? 'text-indigo-650 font-black' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        {step.name.split('. ')[1]}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Linear Sequence Progress Mode */
              <div className="relative flex flex-col md:flex-row justify-between items-center w-full gap-6 md:gap-2 px-4 py-3 min-h-[120px]">
                {/* Horizontal Connector Line for Desktop */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border)] -translate-y-1/2 hidden md:block z-0" />
                {activeStep !== null && (
                  <div
                    className="absolute top-1/2 left-0 h-px bg-indigo-500 -translate-y-1/2 hidden md:block z-0 transition-all duration-700"
                    style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
                  />
                )}
                {results && !isRunning && (
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500 -translate-y-1/2 hidden md:block z-0" />
                )}

                {/* Vertical Connector Line for Mobile */}
                <div className="absolute left-1/2 top-[24px] bottom-[24px] w-px bg-[var(--border)] -translate-x-1/2 md:hidden z-0" />
                {activeStep !== null && (
                  <div
                    className="absolute left-1/2 top-[24px] w-px bg-indigo-500 -translate-x-1/2 md:hidden z-0 transition-all duration-700"
                    style={{ height: `${(activeStep / (STEPS.length - 1)) * 82}%` }}
                  />
                )}
                {results && !isRunning && (
                  <div className="absolute left-1/2 top-[24px] bottom-[24px] w-px bg-emerald-500 -translate-x-1/2 md:hidden z-0" />
                )}

                {STEPS.map((step, idx) => {
                  const Icon       = step.icon;
                  const isCompleted = activeStep === null ? !!results : idx < activeStep;
                  const isActive    = activeStep === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredNode(idx)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="flex flex-col items-center text-center relative z-10 w-full md:w-auto cursor-pointer"
                    >
                      <motion.div
                        animate={isActive ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1.5 } } : { scale: 1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg'
                          : isActive   ? 'bg-indigo-50 border-indigo-650 text-indigo-600 shadow-xl'
                          :              'bg-[var(--bg-overlay)] border-[var(--border)] text-zinc-400 hover:border-zinc-350'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </motion.div>
                      <p className={`text-[10px] font-bold mt-2 ${isActive ? 'text-indigo-650 font-black' : isCompleted ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        {step.name}
                      </p>
                      <p className="text-[9px] text-zinc-400 max-w-[100px] leading-snug mt-0.5">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Real-time Agent Inspector Panel */}
            <div className="bg-slate-50/70 border border-[var(--border)] rounded-2xl p-4 min-h-[120px] flex flex-col justify-between shadow-inner">
              {hoveredNode !== null ? (
                hoveredNode === 'supervisor' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
                      <span className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-indigo-600" />
                        AI Supervisor Orchestrator
                      </span>
                      <span className="badge badge-lead">Hub Controller</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10.5px]">
                      <div>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">LLM Engine</p>
                        <p className="font-semibold text-zinc-700 mt-0.5">Groq Llama-3 70B</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Turn Latency</p>
                        <p className="font-semibold text-zinc-700 mt-0.5">~0.4s decision loop</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Agent Inputs</p>
                        <p className="text-zinc-600 mt-0.5 truncate" title="Goal definition context, execution logs, state variables">Goal context, execution logs, state variables</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/50 text-[10.5px]">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Task Status</p>
                      <p className="text-zinc-600 italic mt-0.5">
                        {isRunning ? "Orchestrating specialist nodes and monitoring state transitions..." : "State graph execution is currently idle. Ready to deploy."}
                      </p>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const step = STEPS[hoveredNode as number];
                    const isCompleted = activeStep === null ? !!results : (hoveredNode as number) < activeStep;
                    const isActive = activeStep === hoveredNode;
                    
                    let statusText = "Idle";
                    let statusBadge = "badge-draft";
                    if (isActive) {
                      statusText = "Running";
                      statusBadge = "badge-lead animate-pulse";
                    } else if (isCompleted) {
                      statusText = "Completed";
                      statusBadge = "badge-completed";
                    }
                    
                    let outputSummary = step.defaultOutput;
                    if (results) {
                      if (hoveredNode === 0) {
                        outputSummary = `Identified and compiled a list of ${results.audience_size} contacts fitting campaign parameters.`;
                      } else if (hoveredNode === 1) {
                        outputSummary = `Built custom customer group "${results.generated_segment_name}" with rules: ${results.generated_segment_rules?.map((r: any) => `${r.field} ${r.operator?.toUpperCase()} ${r.value}`).join(', ')}.`;
                      } else if (hoveredNode === 2) {
                        outputSummary = `Drafted personalized messages and email templates corresponding to marketing goals (preview on right).`;
                      } else if (hoveredNode === 3) {
                        outputSummary = `Mapped customer logs and designated ${results.recommended_channel.toUpperCase()} as the best engagement channel.`;
                      } else if (hoveredNode === 4) {
                        outputSummary = `Calculated conversion estimates: expected open rate ${results.predicted_outcomes?.open_rate}%, projected revenue ${formatCurrency(results.predicted_outcomes?.projected_revenue || 0)} (expected ROI: ${results.predicted_outcomes?.estimated_roi}%).`;
                      }
                    }
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
                          <span className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5">
                            {React.createElement(step.icon, { className: "w-4 h-4 text-indigo-600" })}
                            {step.name}
                          </span>
                          <span className={`badge ${statusBadge}`}>{statusText}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10.5px]">
                          <div>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">LLM Engine</p>
                            <p className="font-semibold text-zinc-700 mt-0.5">{step.model}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Avg Latency</p>
                            <p className="font-semibold text-zinc-700 mt-0.5">{step.latency}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Agent Inputs</p>
                            <p className="text-zinc-650 mt-0.5 truncate" title={step.inputs}>{step.inputs}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Agent Outputs</p>
                            <p className="text-zinc-650 mt-0.5 truncate" title={step.outputs}>{step.outputs}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-zinc-200/50 text-[10.5px]">
                          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Active Output Summary</p>
                          <p className="text-zinc-700 font-medium mt-0.5">{outputSummary}</p>
                        </div>
                      </div>
                    );
                  })()
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-4 text-zinc-450">
                  <Bot className="w-6 h-6 mb-1 text-zinc-400 animate-bounce" />
                  <p className="text-xs">Hover over any node in the agent network graph to inspect performance, inputs/outputs, and model metadata.</p>
                </div>
              )}
            </div>

            {/* Terminal */}
            <div className="bg-[var(--bg-overlay)] border border-[var(--border)] rounded-xl h-48 flex flex-col overflow-hidden font-mono text-[10.5px]">
              <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between shrink-0">
                <span className="text-zinc-550 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-zinc-400" /> AI Log Terminal
                </span>
                <span className="flex items-center gap-1.5 text-[9px] text-zinc-550 font-bold uppercase">
                  {isRunning ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" /><span className="text-indigo-600">Running</span></>
                  ) : results ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Complete</>
                  ) : 'Idle'}
                </span>
              </div>
              <div className="flex-1 p-3.5 overflow-y-auto scroll-area space-y-1.5 bg-[var(--bg-surface)]/20">
                {logs.map((log, i) => (
                  <div key={i} className={`leading-relaxed break-words ${getLogColor(log)}`}>{log}</div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

          {/* Monte Carlo Simulation */}
          <div className="card glass flex flex-col border border-[var(--border)] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              Projected Campaign Success
            </h3>

            {results?.predicted_outcomes ? (
              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[var(--bg-overlay)]/60 border border-[var(--border)] rounded-xl text-center shadow-inner">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Projected ROI</p>
                    <p className="text-2xl font-black text-pink-600 mt-1">{results.predicted_outcomes.estimated_roi}%</p>
                  </div>
                  <div className="p-3.5 bg-[var(--bg-overlay)]/60 border border-[var(--border)] rounded-xl text-center shadow-inner">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Projected Sales Value</p>
                    <p className="text-2xl font-black text-emerald-655 mt-1">{formatCurrency(results.predicted_outcomes.projected_revenue || 0)}</p>
                  </div>
                </div>
                {[
                  { label: 'Inbox Delivery', key: 'delivery_rate', color: 'bg-pink-500' },
                  { label: 'Read Rate',      key: 'open_rate',     color: 'bg-indigo-500' },
                  { label: 'Link Click Rate', key: 'click_rate',    color: 'bg-amber-500' },
                  { label: 'Action Completion', key: 'conversion_rate',color: 'bg-emerald-500' },
                ].map(m => (
                  <div key={m.key} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-zinc-500">{m.label}</span>
                      <span className="text-zinc-700 font-bold">{results.predicted_outcomes[m.key]}%</span>
                    </div>
                    <div className="w-full bg-[var(--bg-overlay)] h-1.5 rounded-full overflow-hidden">
                      <div className={`${m.color} h-full rounded-full transition-all duration-700`} style={{ width: `${results.predicted_outcomes[m.key]}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-2 p-3 bg-pink-50 border border-pink-100 rounded-xl text-[10px] text-pink-700 mt-auto shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-pink-650" />
                  Calculated based on past contact responses. Actual outcomes may differ.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <Bot className="w-10 h-10 text-zinc-200 animate-pulse mb-2" />
                <p className="text-xs text-zinc-400">Simulation outputs appear here after workflow execution.</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            >
              {/* Audience Segment */}
              <div className="card glass border border-[var(--border)] shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-650 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Selected Group Rules
                  </span>
                  <span className="text-[10px] text-zinc-450 font-bold uppercase">Matching Contacts</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-center border border-[var(--border)] bg-[var(--bg-overlay)]/50 px-5 py-3 rounded-2xl shrink-0 shadow-inner">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Audience Size</p>
                    <p className="text-3xl font-black text-emerald-650 mt-0.5">{results.audience_size}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{results.generated_segment_name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Criteria applied to your customer database.</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <p className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">Group Criteria Rules</p>
                  <div className="bg-[var(--bg-overlay)] border border-[var(--border)] p-3.5 rounded-xl font-mono text-[10.5px] space-y-1.5 shadow-inner">
                    {results.generated_segment_rules?.map((rule: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-indigo-650 font-bold">{rule.field}</span>
                        <span className="text-zinc-400">{rule.operator?.toUpperCase()}</span>
                        <span className="text-emerald-655 font-semibold">{Array.isArray(rule.value) ? `[${rule.value.join(', ')}]` : rule.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <div>
                    <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Outreach Method</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Selected based on audience history</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650 text-xs font-bold">
                    {results.recommended_channel === 'email'     ? <Mail className="w-4 h-4" />           : null}
                    {results.recommended_channel === 'whatsapp'  ? <MessageSquare className="w-4 h-4" />  : null}
                    {results.recommended_channel === 'sms'       ? <PhoneCall className="w-4 h-4" />      : null}
                    <span className="capitalize">{results.recommended_channel}</span>
                  </div>
                </div>
              </div>

              {/* Copywriter Card */}
              <div className="card glass border border-[var(--border)] shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> AI Drafted Message
                  </span>
                  <span className="text-[10px] text-zinc-455 font-bold flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Editable
                  </span>
                </div>

                <div className="space-y-3.5 flex-1">
                  {results.recommended_channel === 'email' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider">Email Subject Line</label>
                      <input type="text" value={editSubject} onChange={e => setEditSubject(e.target.value)} className="input text-xs" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider">Message Body</label>
                    <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={7}
                      className="input resize-none font-mono text-xs leading-relaxed" />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] space-y-2">
                  {validationError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {validationError}
                    </p>
                  )}
                  <button onClick={handleApproveCampaign} disabled={isApproving}
                    className="btn btn-primary w-full justify-center text-sm py-3 rounded-xl shadow-md">
                    {isApproving
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                      : <><ShieldCheck className="w-4 h-4" /> Approve &amp; Create Campaign</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </LayoutWrapper>
  );
}
