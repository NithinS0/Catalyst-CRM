'use client';

import React, { useState, useEffect, useRef } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Send, Bot, Layers, FileText, Megaphone, TrendingUp,
  Terminal, Activity, Check, Edit, Mail, ShieldCheck, RefreshCw,
  User, Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { useCurrency } from '@/context/currency-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  proposedCampaign?: any;
  campaignId?: string | null;
  state?: string;
  isStreaming?: boolean;
}

interface AgentLog {
  agent: string;
  message: string;
  timestamp: string;
}

interface AgentNode {
  id: string;
  name: string;
  description: string;
}

const AGENTS: AgentNode[] = [
  { id: 'customer_intelligence', name: 'Context Engine', description: 'Aggregates vector embeddings & buyer affinity' },
  { id: 'segmentation', name: 'Segmentation Agent', description: 'Generates SQL & JSON filter rules' },
  { id: 'content', name: 'Creative Architect', description: 'Synthesizes personalized copy variants' },
  { id: 'channel', name: 'Channel Dispatcher', description: 'Selects optimal deliverability route (Email priority)' },
  { id: 'simulation', name: 'Monte Carlo Simulator', description: 'Projects open, click, and conversion distributions' },
];

const PRESETS = [
  'Increase repeat purchases for active accounts this month',
  'Identify dormant enterprise accounts and craft win-back offer',
  'Target high-LTV accounts with a VIP executive invitation',
];

export default function AIStudioPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { formatCurrency } = useCurrency();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I am your Catalyst LangGraph Campaign Orchestrator. State your business objective (e.g. "Identify dormant accounts and create an incentive offer"), and the 10-agent swarm will build, simulate, and queue your campaign.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [studioState, setStudioState] = useState<string>('idle');
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [proposedCampaign, setProposedCampaign] = useState<any | null>(null);

  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (proposedCampaign) {
      const template = proposedCampaign.content_template || '';
      const subjectMatch = template.match(/Subject:\s*(.*)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : '';
      const body = template.replace(/Subject:\s*(.*)/i, '').trim();
      setEditedSubject(subject || 'Executive Update');
      setEditedBody(body || template);
    } else {
      setEditedSubject('');
      setEditedBody('');
    }
  }, [proposedCampaign]);

  const addLog = (agent: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { agent, message, timestamp }]);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    const updatedMessages = [
      ...messages,
      { id: userMsgId, role: 'user' as const, content: textToSend }
    ];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    setMessages(prev => [
      ...prev,
      { id: assistantMsgId, role: 'assistant' as const, content: '', isStreaming: true }
    ]);

    let textContent = '';
    let stateUpdate = studioState;
    let createdCampaignId = campaignId;
    let createdProposal = proposedCampaign;

    let activeProposal = proposedCampaign;
    if (activeProposal && (editedSubject || editedBody)) {
      const mergedTemplate = editedSubject ? `Subject: ${editedSubject}\n\n${editedBody}` : editedBody;
      activeProposal = { ...activeProposal, content_template: mergedTemplate };
      setProposedCampaign(activeProposal);
    }

    try {
      const res = await api.streamChatStudio(
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        studioState,
        campaignId,
        activeProposal
      );

      if (!res.ok) throw new Error('API server returned an error connection');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(cleanLine.slice(6));
              if (parsed.type === 'log') {
                addLog(parsed.agent, parsed.message);
                setActiveAgent(parsed.agent);
              } else if (parsed.type === 'text') {
                textContent += parsed.content;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId ? { ...m, content: textContent } : m
                  )
                );
              } else if (parsed.type === 'result') {
                if (parsed.next_state) {
                  stateUpdate = parsed.next_state;
                  setStudioState(parsed.next_state);
                }
                if (parsed.campaign_id) {
                  createdCampaignId = parsed.campaign_id;
                  setCampaignId(parsed.campaign_id);
                }
                if (parsed.proposed_campaign) {
                  createdProposal = parsed.proposed_campaign;
                  setProposedCampaign(parsed.proposed_campaign);
                }
              }
            } catch (e) {
              console.error('SSE chunk parsing error', e);
            }
          }
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                isStreaming: false,
                proposedCampaign: createdProposal,
                campaignId: createdCampaignId,
                state: stateUpdate
              }
            : m
        )
      );

      if (stateUpdate === 'launched') {
        success('Campaign dispatched successfully via execution pipeline!');
        setProposedCampaign(null);
        setCampaignId(null);
        setStudioState('idle');
      }

    } catch (err: any) {
      console.error(err);
      toastError(err.message || 'Workflow step failed');
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `Error processing request: ${err.message}. Please retry.`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveAgent(null);
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-130px)] text-white">
        
        {/* Left: Chat Studio */}
        <div className="flex-1 p-5 rounded-xl border border-white/10 bg-[#1E222B] flex flex-col justify-between overflow-hidden shadow-xl">
          
          {/* Header */}
          <div className="pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#0E141F] border border-[#B3B3B3]/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold font-mono">AI Campaign Studio</h1>
                <p className="text-[10px] text-[#5F6878] font-mono uppercase tracking-wider mt-0.5">
                  Swarm State: {studioState.toUpperCase().replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([{
                  id: 'welcome',
                  role: 'assistant',
                  content: 'I am your Catalyst LangGraph Campaign Orchestrator. State your business objective, and the 10-agent swarm will build, simulate, and queue your campaign.'
                }]);
                setLogs([]);
                setStudioState('idle');
                setCampaignId(null);
                setProposedCampaign(null);
              }}
              className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border border-white/10 transition-colors"
            >
              Reset Session
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-xs scrollbar-thin">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded bg-[#0E141F] border border-white/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-3">
                    <div
                      className={`p-3.5 rounded-xl border leading-relaxed ${
                        isUser
                          ? 'bg-[#0B85FC] text-white border-[#0B85FC] shadow-md shadow-[#0B85FC]/20'
                          : 'bg-[#0E141F] text-white border-white/10'
                      }`}
                    >
                      {m.content}
                      {m.isStreaming && (
                        <span className="inline-block w-2 h-3 bg-[#0DB8FA] ml-1 animate-pulse" />
                      )}
                    </div>

                    {/* Proposed Campaign Blueprint Card */}
                    {!isUser && m.proposedCampaign && (
                      <div className="p-4 rounded-xl border border-white/10 bg-[#0E141F] space-y-4 shadow-inner">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[rgba(11,133,252,0.08)] text-[#0B85FC]">
                            Cohort: {m.proposedCampaign.segment_name}
                          </span>
                          <span className="text-[11px] text-[#5F6878]">
                            Audience: <strong className="text-white">{m.proposedCampaign.audience_size}</strong>
                          </span>
                        </div>

                        {/* Editable subject and body */}
                        {m.state === 'awaiting_campaign_approval' ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#5F6878] uppercase font-bold">Email Subject</label>
                              <input
                                type="text"
                                value={editedSubject}
                                onChange={(e) => setEditedSubject(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:border-[#0B85FC] focus:outline-none transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#5F6878] uppercase font-bold">Message Draft</label>
                              <textarea
                                value={editedBody}
                                onChange={(e) => setEditedBody(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:border-[#0B85FC] focus:outline-none transition-colors resize-none leading-relaxed"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded bg-white/5 border border-white/10 text-xs space-y-1">
                            {editedSubject && <p className="font-bold text-white">Subject: {editedSubject}</p>}
                            <p className="text-[#5F6878] whitespace-pre-wrap">{editedBody}</p>
                          </div>
                        )}

                        {/* Monte Carlo Simulation Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded bg-white/5 border border-white/10">
                            <p className="text-[9px] uppercase text-[#5F6878]">Projected ROI</p>
                            <p className="text-sm font-bold text-white">{m.proposedCampaign.predicted_outcomes?.estimated_roi}%</p>
                          </div>
                          <div className="p-2 rounded bg-white/5 border border-white/10">
                            <p className="text-[9px] uppercase text-[#5F6878]">Est. Revenue</p>
                            <p className="text-sm font-bold text-white">{formatCurrency(m.proposedCampaign.predicted_revenue)}</p>
                          </div>
                          <div className="p-2 rounded bg-white/5 border border-white/10">
                            <p className="text-[9px] uppercase text-[#5F6878]">Open Rate</p>
                            <p className="text-sm font-bold text-white">{m.proposedCampaign.predicted_outcomes?.open_rate}%</p>
                          </div>
                          <div className="p-2 rounded bg-white/5 border border-white/10">
                            <p className="text-[9px] uppercase text-[#5F6878]">Conversion</p>
                            <p className="text-sm font-bold text-white">{m.proposedCampaign.predicted_outcomes?.conversion_rate}%</p>
                          </div>
                        </div>

                        {/* Workflow Buttons */}
                        {m.state === 'awaiting_campaign_approval' && (
                          <button
                            onClick={() => handleSendMessage('Yes')}
                            disabled={isStreaming}
                            className="w-full py-2.5 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white font-bold text-xs shadow-lg shadow-[#0B85FC]/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Approve Blueprint &amp; Generate Segment</span>
                          </button>
                        )}

                        {m.state === 'awaiting_launch_approval' && (
                          <button
                            onClick={() => handleSendMessage('Yes')}
                            disabled={isStreaming}
                            className="w-full py-2.5 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white font-bold text-xs shadow-lg shadow-[#0B85FC]/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Megaphone className="w-4 h-4" />
                            <span>Confirm &amp; Launch Campaign via Provider</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-[#2F3654] text-white font-bold flex items-center justify-center shrink-0 border border-white/10">
                      U
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Goal Presets & Input Bar */}
          <div className="pt-3 border-t border-white/10 space-y-3 shrink-0">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[9px] font-mono uppercase text-[#5F6878]">Suggested Goals:</span>
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(p);
                      handleSendMessage(p);
                    }}
                    disabled={isStreaming}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#0E141F] border border-white/10 text-[11px] font-mono text-white hover:text-white transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                placeholder={
                  studioState === 'awaiting_campaign_approval'
                    ? 'Type "Yes" to approve, or specify copy modifications...'
                    : studioState === 'awaiting_launch_approval'
                    ? 'Type "Yes" to dispatch campaign immediately...'
                    : 'Describe your marketing objective...'
                }
                className="flex-1 px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs font-mono text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="px-4 py-2 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white font-mono text-xs font-semibold shadow-md shadow-[#0B85FC]/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isStreaming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Swarm Pipeline & Live Terminal Console */}
        <div className="w-full xl:w-96 rounded-xl border border-white/10 bg-[#1E222B] flex flex-col justify-between overflow-hidden shadow-xl">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-[#5F6878] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-white" />
              10-Agent LangGraph Swarm
            </h3>
            <span className="text-[10px] font-mono text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0DB8FA] animate-ping" />
              Active
            </span>
          </div>

          {/* Swarm Nodes List */}
          <div className="p-3 border-b border-white/10 space-y-1.5 font-mono text-xs">
            {AGENTS.map((node) => {
              const isActive = activeAgent === node.id;
              return (
                <div
                  key={node.id}
                  className={`p-2 rounded-lg border transition-colors ${
                    isActive
                      ? 'border-[#FFFFFF] bg-white/5 text-white'
                      : 'border-white/10 bg-white/5 text-[#5F6878]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{node.name}</span>
                    {isActive && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0B85FC] text-white font-bold">Running</span>}
                  </div>
                  <p className="text-[10px] text-[#5F6878] mt-0.5 truncate">{node.description}</p>
                </div>
              );
            })}
          </div>

          {/* Autoscrolling Terminal Console */}
          <div className="flex-1 p-3 bg-[#0E141F] font-mono text-[11px] flex flex-col overflow-hidden text-[#AAB3C2]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] uppercase font-bold text-[#5F6878]">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Telemetry Feed</span>
              <span>UTC</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] scrollbar-thin">
              {logs.map((log, i) => (
                <div key={i} className="border-l border-white/10 pl-2 space-y-0.5">
                  <div className="flex items-center gap-2 text-[9px] text-[#5F6878]">
                    <span>{log.timestamp}</span>
                    <span className="uppercase text-white">[{log.agent}]</span>
                  </div>
                  <p className="text-white leading-relaxed">{log.message}</p>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-12 text-center text-xs text-[#5F6878]/60 italic">
                  Awaiting instruction prompt to begin swarm telemetry stream...
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

      </div>
    </LayoutWrapper>
  );
}
