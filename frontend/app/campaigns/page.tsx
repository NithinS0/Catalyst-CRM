'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  Megaphone, Plus, Play, Mail, MessageSquare, Phone,
  CheckCircle, FileText, RefreshCw, X, Download, Sparkles,
  TrendingUp, BarChart2, Lightbulb, ArrowRight, Trash2,
  Send, Smartphone, Monitor, Activity, ShieldCheck, Clock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import ReactMarkdown from 'react-markdown';

interface NewCampaign {
  name: string;
  type: string;
  content_template: string;
  description: string;
  segment_id: string;
}

const CHANNELS = [
  { id: 'email', name: 'Email', active: true, badge: 'Live Execution' },
  { id: 'sms', name: 'SMS', active: false, badge: 'Coming Soon' },
  { id: 'whatsapp', name: 'WhatsApp', active: false, badge: 'Coming Soon' },
  { id: 'phone', name: 'AI Voice', active: false, badge: 'Coming Soon' },
  { id: 'rcs', name: 'RCS Business', active: false, badge: 'Coming Soon' },
  { id: 'push', name: 'Push Web/App', active: false, badge: 'Coming Soon' },
];

export default function CampaignsPage() {
  const { success, error: toastError } = useToast();
  const [campaigns, setCampaigns]   = useState<any[]>([]);
  const [segments, setSegments]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  // Email Provider Connection State
  const [emailProviderStatus, setEmailProviderStatus] = useState<'connected' | 'not_configured' | null>(null);

  // Form State
  const [form, setForm] = useState<NewCampaign>({
    name: '',
    type: 'email',
    content_template: 'Subject: Exclusive update for {{first_name}}\n\nHello {{first_name}},\n\nWe wanted to share a personalized update regarding your recent activity at {{company}}.\n\nBest regards,\nThe Team',
    description: '',
    segment_id: '',
  });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Campaign Builder Test Email State
  const [builderTestRecipient, setBuilderTestRecipient] = useState('');
  const [sendingBuilderTest, setSendingBuilderTest] = useState(false);
  const [builderTestFeedback, setBuilderTestFeedback] = useState<string | null>(null);

  // Test Email Modal
  const [testEmailModal, setTestEmailModal] = useState<{ open: boolean; campaignId: string; name: string } | null>(null);
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Real-Time Execution Monitor Modal
  const [monitorCampaignId, setMonitorCampaignId] = useState<string | null>(null);
  const [monitorData, setMonitorData] = useState<any>(null);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportCampaign, setSelectedReportCampaign] = useState<any | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [camps, segs, emailCfg] = await Promise.all([
        api.getCampaigns() as Promise<any[]>,
        api.getSegments()  as Promise<any[]>,
        api.getEmailSettings().catch(() => null),
      ]);
      setCampaigns(camps || []);
      setSegments(segs || []);
      if (emailCfg) {
        setEmailProviderStatus(emailCfg.status === 'connected' ? 'connected' : 'not_configured');
      }
    } catch (err: any) {
      console.error(err);
      toastError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { loadData(); }, [loadData]);

  // Monitor polling loop when active
  useEffect(() => {
    if (!monitorCampaignId) return;

    const fetchMonitor = async () => {
      try {
        const res = await api.getExecutionMonitor(monitorCampaignId);
        setMonitorData(res);
      } catch (err) {
        console.error('Failed to fetch monitor telemetry:', err);
      }
    };

    fetchMonitor();
    const interval = setInterval(fetchMonitor, 2500);
    return () => clearInterval(interval);
  }, [monitorCampaignId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content_template) {
      toastError('Campaign name and email content are required');
      return;
    }
    setSaving(true);
    try {
      await api.createCampaign(form as any);
      success('Campaign created successfully!');
      setShowModal(false);
      setForm({
        name: '',
        type: 'email',
        content_template: 'Subject: Update for {{first_name}}\n\nHello {{first_name}},\n\nBest,\nThe Team',
        description: '',
        segment_id: '',
      });
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async (campaignId: string, name: string) => {
    setTriggering(campaignId);
    try {
      const res = await api.triggerCampaign(campaignId) as any;
      success(`Campaign "${name}" dispatched! ${res?.sent_count || 0} emails queued.`);
      setMonitorCampaignId(campaignId);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to launch campaign');
    } finally {
      setTriggering(null);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailModal) return;
    setSendingTest(true);
    try {
      const res = await api.sendTestEmail(testEmailModal.campaignId, testRecipient.trim() || undefined) as any;
      success(`Test email dispatched via ${res?.provider || 'Email Provider'} to ${res?.recipient || 'your account email'}! Message ID: ${res?.provider_message_id || 'OK'}`);
      setTestEmailModal(null);
      setTestRecipient('');
    } catch (err: any) {
      toastError(err.message || 'Failed to send test email. Check settings.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendBuilderTestEmail = async () => {
    if (!form.content_template) {
      toastError('Enter email content template first');
      return;
    }
    setSendingBuilderTest(true);
    setBuilderTestFeedback(null);
    try {
      const subjectMatch = form.content_template.match(/Subject:\s*(.*)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : (form.name || 'Test Preview');
      const res = await api.sendAdhocTestEmail(subject, form.content_template, builderTestRecipient.trim() || undefined) as any;
      const msg = `Dispatched via ${res?.provider || 'Email Provider'} to ${res?.recipient || 'account email'}! ID: ${res?.provider_message_id || 'OK'}`;
      setBuilderTestFeedback(msg);
      success(msg);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to dispatch test email. Check settings.';
      setBuilderTestFeedback(`Failed: ${errMsg}`);
      toastError(errMsg);
    } finally {
      setSendingBuilderTest(false);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Permanently delete campaign "${name}"?`)) return;
    try {
      await api.deleteCampaign(id);
      success('Campaign removed');
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete campaign');
    }
  };

  const handleOpenReport = async (camp: any) => {
    setSelectedReportCampaign(camp);
    setReportModalOpen(true);
    setIsGeneratingReport(true);
    setReportContent('');
    try {
      const data = await api.getCampaignReport(camp.id);
      setReportContent(data.report);
    } catch (err: any) {
      setReportContent(`# Campaign Performance Report: ${camp.name}\n\n*Unable to generate report at this time.*`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-8 pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654]">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-mono text-white">Campaigns & Outreach</h1>
            <p className="text-xs text-[#5F6878]">
              Real-time multi-tenant campaign execution with provider-backed deliverability and idempotency.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white font-mono text-xs font-semibold shadow-lg shadow-[#0B85FC]/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>

        {/* Channel Status Matrix */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#1E222B] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#5F6878] font-semibold">Channel Execution Matrix</span>
            <span className="text-[11px] font-mono text-white">Email Engine: Resend / SMTP Active</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CHANNELS.map(ch => (
              <div
                key={ch.id}
                className={`p-3 rounded-lg border flex flex-col justify-between min-h-[70px] ${
                  ch.active
                    ? 'border-[#0B85FC] bg-[rgba(11,133,252,0.06)]'
                    : 'border-white/10 bg-[#0E141F]/10 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{ch.name}</span>
                  {ch.active ? <Mail className="w-3.5 h-3.5 text-white" /> : <Clock className="w-3.5 h-3.5 text-[#5F6878]" />}
                </div>
                <span className={`text-[9px] font-mono mt-2 uppercase ${ch.active ? 'text-white font-bold' : 'text-[#5F6878]'}`}>
                  {ch.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))
          ) : campaigns.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-xl space-y-3">
              <Megaphone className="w-10 h-10 text-[#5F6878] mx-auto" />
              <h3 className="text-sm font-mono text-white">No campaigns created yet</h3>
              <p className="text-xs text-[#5F6878]">Create an email campaign or generate one with the AI Campaign Studio.</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white font-mono text-xs font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Create Campaign
              </button>
            </div>
          ) : (
            campaigns.map((camp: any) => {
              const openRate = camp.total_sent > 0 ? Math.round((camp.total_opened / camp.total_sent) * 100) : 0;
              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-xl border border-white/10 bg-[#1E222B] hover:border-[#0B85FC]/40 transition-colors flex flex-col justify-between gap-4 font-mono shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{camp.name}</h3>
                        <p className="text-[10px] text-[#5F6878] mt-0.5 uppercase tracking-wider">{camp.type || 'Email'}</p>
                      </div>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border border-[#B3B3B3]/20 shrink-0">
                        {camp.status || 'Draft'}
                      </span>
                    </div>

                    {camp.description && (
                      <p className="text-xs text-[#5F6878] line-clamp-2 leading-relaxed">{camp.description}</p>
                    )}

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10">
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">{camp.total_sent || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">{camp.total_opened || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase">Opened</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">{openRate}%</p>
                        <p className="text-[9px] text-[#5F6878] uppercase">Rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTrigger(camp.id, camp.name)}
                        disabled={!!triggering}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-md shadow-[#0B85FC]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {triggering === camp.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>{triggering === camp.id ? 'Queueing...' : 'Launch Live'}</span>
                      </button>

                      <button
                        onClick={() => setTestEmailModal({ open: true, campaignId: camp.id, name: camp.name })}
                        className="py-2 px-3 rounded-lg bg-white/7 hover:bg-[rgba(11,133,252,0.08)] text-[#0B85FC] hover:text-white border border-white/10 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Send Real Test Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Test</span>
                      </button>

                      <button
                        onClick={() => setMonitorCampaignId(camp.id)}
                        className="py-2 px-2.5 rounded-lg bg-white/7 hover:bg-[rgba(11,133,252,0.08)] text-[#0B85FC] hover:text-white border border-white/10 text-xs transition-colors"
                        title="Live Execution Telemetry"
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5F6878]">
                      <button
                        onClick={() => handleOpenReport(camp)}
                        className="hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" /> Performance Report
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                        className="hover:text-red-400 p-1 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ── Real-Time Execution Monitor Modal ── */}
      <AnimatePresence>
        {monitorCampaignId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setMonitorCampaignId(null); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] shadow-2xl font-mono text-white space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Campaign Execution Monitor</h3>
                    <p className="text-[10px] text-[#5F6878]">Live dispatch telemetry & recipient delivery ledger</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (monitorCampaignId) {
                        try {
                          const res = await api.getExecutionMonitor(monitorCampaignId);
                          setMonitorData(res);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white/7 hover:bg-[rgba(11,133,252,0.08)] text-[#0B85FC] hover:text-white text-xs transition-colors"
                    title="Refresh Now"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setMonitorCampaignId(null)} className="p-1.5 text-[#5F6878] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {monitorData ? (
                <div className="space-y-5">
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="text-xs text-[#5F6878]">Campaign: <strong className="text-white">{monitorData.campaign_name || monitorData.campaign_id}</strong></p>
                      <p className="text-[10px] text-[#5F6878] mt-0.5">ID: <span className="font-mono text-white">{monitorData.campaign_id}</span></p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Provider connection badge */}
                      {emailProviderStatus === 'connected' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border border-[#B3B3B3]/30">
                          <ShieldCheck className="w-3 h-3 text-white" /> Email provider connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border border-white/10">
                          <AlertTriangle className="w-3 h-3 text-white" /> Email provider not configured
                        </span>
                      )}

                      {/* Campaign status badge */}
                      {monitorData.status === 'sending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(11,133,252,0.15)] text-[#0B85FC] border border-[#0B85FC]/30">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Sending...
                        </span>
                      ) : monitorData.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(11,133,252,0.15)] text-[#0B85FC] border border-[#0B85FC]/30">
                          <CheckCircle className="w-3 h-3" /> Campaign completed
                        </span>
                      ) : monitorData.status === 'partially_failed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border border-[#FFFFFF]/40">
                          <AlertTriangle className="w-3 h-3" /> Some emails failed
                        </span>
                      ) : monitorData.status === 'queued' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border border-white/10">
                          <Clock className="w-3 h-3" /> Queued
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border border-white/10 uppercase">
                          {monitorData.status || 'Draft'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 9 Metrics Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#5F6878] uppercase font-bold tracking-wider">Live Delivery & Engagement Ledger</span>
                      <span className="text-[10px] text-[#5F6878]">Channel: {monitorData.channel?.toUpperCase() || 'EMAIL'} (Resend)</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 text-center">
                      <div className="p-3 rounded-lg bg-white/6 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.total_recipients || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Total</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.queued_count || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Queued</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.sending_count || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Sending</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/6 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.sent_count || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Sent</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/7 border border-[#B3B3B3]/40">
                        <p className="text-lg font-bold text-white">{monitorData.delivered_count || 0}</p>
                        <p className="text-[9px] text-white uppercase font-semibold mt-0.5">Delivered</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/6 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.opened_count || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Opened</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/6 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.clicked_count || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Clicked</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.bounced_count || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Bounced</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-lg font-bold text-white">{monitorData.failed_count || 0}</p>
                        <p className="text-[9px] text-[#5F6878] uppercase font-semibold mt-0.5">Failed</p>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Standards Callout */}
                  <div className="p-3 rounded-lg bg-[#0E141F] border border-white/10 text-[11px] text-[#5F6878] leading-relaxed">
                    <span className="text-white font-bold">Telemetry Standards: </span>
                    <strong className="text-white">Sent</strong> indicates the provider socket accepted the message. <strong className="text-white">Delivered</strong> is verified strictly when the recipient mail server acknowledges delivery via Resend webhook. <strong className="text-white">Opened</strong> and <strong className="text-white">Clicked</strong> represent confirmed inbox actions.
                  </div>

                  {/* Pipeline Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#5F6878]">
                      <span>Execution Pipeline Completion</span>
                      <span>
                        {monitorData.total_recipients > 0
                          ? Math.round(((monitorData.sent_count + monitorData.failed_count) / monitorData.total_recipients) * 100)
                          : 100}%
                      </span>
                    </div>
                    <div className="w-full bg-[#0E141F] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0B85FC] to-[#0DB8FA] h-full transition-all duration-300"
                        style={{
                          width: `${
                            monitorData.total_recipients > 0
                              ? Math.min(100, ((monitorData.sent_count + monitorData.failed_count) / monitorData.total_recipients) * 100)
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recipient Ledger Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#5F6878] uppercase font-bold tracking-wider">Recipient Delivery Ledger</span>
                      <span className="text-[10px] text-[#5F6878]">{monitorData.recipients?.length || 0} recorded</span>
                    </div>

                    <div className="border border-white/10 rounded-lg overflow-hidden bg-[#0E141F]">
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 bg-white/8 backdrop-blur-sm border-b border-white/10 text-[10px] text-[#5F6878] uppercase tracking-wider">
                            <tr>
                              <th className="py-2 px-3">Recipient</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Provider ID</th>
                              <th className="py-2 px-3">Timestamps</th>
                              <th className="py-2 px-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DDE2EA]/40 text-[11px]">
                            {monitorData.recipients && monitorData.recipients.length > 0 ? (
                              monitorData.recipients.map((r: any) => (
                                <tr key={r.id || r.idempotency_key} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-3 font-medium text-white truncate max-w-[160px]">
                                    {r.email || r.customer_id || 'Unknown'}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                        r.status === 'delivered'
                                          ? 'bg-[rgba(13,184,250,0.15)] text-[#0DB8FA] border-[#0DB8FA]/40'
                                          : r.status === 'opened' || r.status === 'clicked'
                                          ? 'bg-[rgba(86,96,243,0.15)] text-[#8B96FF] border-[#5660F3]/40'
                                          : r.status === 'sent'
                                          ? 'bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border-[#B3B3B3]/40'
                                          : r.status === 'failed' || r.status === 'bounced'
                                          ? 'bg-[rgba(11,133,252,0.08)] text-[#0B85FC] border-white/10'
                                          : 'bg-white/7 text-[#5F6878] border-white/10'
                                      }`}
                                    >
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-[#5F6878] font-mono text-[10px] truncate max-w-[140px]" title={r.provider_message_id}>
                                    {r.provider_message_id || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-[#5F6878] text-[10px]">
                                    {r.delivered_at
                                      ? `Delivered: ${new Date(r.delivered_at).toLocaleTimeString()}`
                                      : r.sent_at
                                      ? `Sent: ${new Date(r.sent_at).toLocaleTimeString()}`
                                      : r.failed_at
                                      ? `Failed: ${new Date(r.failed_at).toLocaleTimeString()}`
                                      : 'Queued'}
                                  </td>
                                  <td className="py-2 px-3 text-white text-[10px] truncate max-w-[150px]" title={r.error_message}>
                                    {r.error_message ? (
                                      <span className="text-white">{r.error_message}</span>
                                    ) : (
                                      <span className="text-[#5F6878]">OK</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-xs text-[#5F6878]">
                                  No recipient records registered yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#5F6878] space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-white" />
                  <p>Connecting to real-time dispatch telemetry...</p>
                </div>
              )}

              <button
                onClick={() => setMonitorCampaignId(null)}
                className="w-full py-2.5 rounded-lg bg-[rgba(11,133,252,0.08)] text-[#0B85FC] text-xs font-semibold hover:bg-[#0E141F]/80 transition-colors"
              >
                Close Monitor
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Test Email Modal ── */}
      <AnimatePresence>
        {testEmailModal?.open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setTestEmailModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] shadow-2xl font-mono text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold">Send Real Test Email</h3>
                </div>
                <button onClick={() => setTestEmailModal(null)} className="text-[#5F6878] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5F6878] leading-relaxed">
                Sends an actual rendered email for <strong className="text-white">&ldquo;{testEmailModal.name}&rdquo;</strong> using your configured Email Provider (Resend or SMTP) to verify inbox delivery.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#5F6878] uppercase font-bold">Recipient Email Address</label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="your-email@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestEmailModal(null)}
                  className="flex-1 py-2 rounded-lg bg-white/7 hover:bg-[#0E141F] text-[#5F6878] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testRecipient.trim()}
                  className="flex-1 py-2 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-md shadow-[#0B85FC]/20 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{sendingTest ? 'Dispatching...' : 'Send Test Now'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create Campaign & Preview Modal ── */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-4xl p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] shadow-2xl font-mono text-white max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-base font-bold text-white">Campaign Builder & Dispatch Pipeline</h2>
                    <p className="text-[10px] text-[#5F6878]">Design email content, verify with test dispatch, and launch</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-[#5F6878] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Campaign Launch Flow Stepper */}
                <div className="grid grid-cols-4 gap-2 text-[10px] py-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B85FC] text-white font-bold">
                    <span className="w-4 h-4 rounded-full bg-[#0E141F] text-white flex items-center justify-center text-[9px]">1</span>
                    <span>Draft</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 text-white border border-white/10">
                    <span className="w-4 h-4 rounded-full bg-[rgba(11,133,252,0.08)] text-[#0B85FC] flex items-center justify-center text-[9px]">2</span>
                    <span>Review</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 text-white border border-white/10">
                    <span className="w-4 h-4 rounded-full bg-[rgba(11,133,252,0.08)] text-[#0B85FC] flex items-center justify-center text-[9px]">3</span>
                    <span>Test Email</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/6 text-[#5F6878] border border-white/10">
                    <span className="w-4 h-4 rounded-full bg-[#0E141F] text-[#5F6878] flex items-center justify-center text-[9px]">4</span>
                    <span>Launch</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form fields */}
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#5F6878] uppercase font-bold">Campaign Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Q4 Executive Outreach"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#5F6878] uppercase font-bold">Target Cohort / Segment</label>
                    <select
                      value={form.segment_id}
                      onChange={(e) => setForm((f) => ({ ...f, segment_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                    >
                      <option value="">All Verified Workspace Contacts</option>
                      {segments.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#5F6878] uppercase font-bold">Channel</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: 'email' }))}
                        className="py-1.5 rounded-lg border border-[#0B85FC] bg-[rgba(11,133,252,0.06)] text-xs font-bold text-white"
                      >
                        Email (Active)
                      </button>
                      <button
                        type="button"
                        disabled
                        className="py-1.5 rounded-lg border border-white/10 bg-[#0E141F]/10 text-xs text-[#5F6878] opacity-60 cursor-not-allowed"
                      >
                        SMS (Soon)
                      </button>
                      <button
                        type="button"
                        disabled
                        className="py-1.5 rounded-lg border border-white/10 bg-[#0E141F]/10 text-xs text-[#5F6878] opacity-60 cursor-not-allowed"
                      >
                        WhatsApp (Soon)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#5F6878] uppercase font-bold">Summary Description</label>
                    <input
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Goal of this campaign..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#5F6878] uppercase font-bold">Content Template *</label>
                    <textarea
                      required
                      rows={6}
                      value={form.content_template}
                      onChange={(e) => setForm((f) => ({ ...f, content_template: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-[#5F6878]">
                      Variables: &#123;&#123;first_name&#125;&#125;, &#123;&#123;last_name&#125;&#125;, &#123;&#123;company&#125;&#125;. First line starting with &ldquo;Subject:&rdquo; defines email subject.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2 rounded-lg bg-white/7 text-xs text-[#5F6878]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-2 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-md shadow-[#0B85FC]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{saving ? 'Creating...' : 'Save Campaign'}</span>
                    </button>
                  </div>
                </form>

                {/* Live Device Preview & Test Email Dispatch */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#5F6878] uppercase font-bold">Rendered Email Preview</span>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/7 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-1 rounded ${previewMode === 'desktop' ? 'bg-[#0B85FC] text-white font-bold' : 'text-[#5F6878]'}`}
                        title="Desktop Preview"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-1 rounded ${previewMode === 'mobile' ? 'bg-[#0B85FC] text-white font-bold' : 'text-[#5F6878]'}`}
                        title="Mobile Preview"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`mx-auto rounded-xl border border-white/10 bg-[#0E141F] p-4 text-xs space-y-3 transition-all ${
                      previewMode === 'mobile' ? 'max-w-xs' : 'w-full'
                    }`}
                  >
                    <div className="border-b border-white/10 pb-2 space-y-1 text-[11px] text-[#5F6878]">
                      <p><strong className="text-white">From:</strong> notifications@yourdomain.com</p>
                      <p><strong className="text-white">To:</strong> alex.taylor@acme.com</p>
                      <p>
                        <strong className="text-white">Subject:</strong>{' '}
                        {form.content_template.match(/Subject:\s*(.*)/i)?.[1] || 'Important Update'}
                      </p>
                    </div>
                    <div className="pt-2 text-white whitespace-pre-wrap leading-relaxed text-xs">
                      {form.content_template
                        .replace(/Subject:\s*.*\n*/i, '')
                        .replace(/\{\{first_name\}\}/g, 'Alex')
                        .replace(/\{\{last_name\}\}/g, 'Taylor')
                        .replace(/\{\{company\}\}/g, 'Acme Corp')}
                    </div>
                  </div>

                  {/* Send Test Email from Builder */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-bold text-white">Send Test Email to Inbox</span>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0E141F] text-[#5F6878]">
                        Step 3 of Flow
                      </span>
                    </div>

                    <p className="text-[11px] text-[#5F6878] leading-relaxed">
                      Verify actual delivery formatting in your mail client before launching to customer recipients.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={builderTestRecipient}
                        onChange={(e) => setBuilderTestRecipient(e.target.value)}
                        placeholder="Leave empty to send to account email"
                        className="flex-1 px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleSendBuilderTestEmail}
                        disabled={sendingBuilderTest || !form.content_template}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {sendingBuilderTest ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>{sendingBuilderTest ? 'Sending...' : 'Send Test'}</span>
                      </button>
                    </div>

                    {builderTestFeedback && (
                      <p className="text-[10px] text-white truncate font-mono bg-[#0E141F] p-1.5 rounded border border-white/10">
                        {builderTestFeedback}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AI Report Modal ── */}
      <AnimatePresence>
        {reportModalOpen && selectedReportCampaign && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setReportModalOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] shadow-2xl font-mono text-white max-h-[85vh] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold">Campaign Telemetry Report</h3>
                </div>
                <button onClick={() => setReportModalOpen(false)} className="text-[#5F6878] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 text-xs leading-relaxed text-white scrollbar-thin">
                {isGeneratingReport ? (
                  <div className="py-12 text-center space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-white" />
                    <p className="text-xs text-[#5F6878]">Analyzing campaign telemetry with AI...</p>
                  </div>
                ) : (
                  <ReactMarkdown>{reportContent}</ReactMarkdown>
                )}
              </div>

              <button
                onClick={() => setReportModalOpen(false)}
                className="w-full py-2 rounded-lg bg-[rgba(11,133,252,0.08)] text-[#0B85FC] text-xs hover:bg-[#0E141F]/80 shrink-0"
              >
                Close Report
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </LayoutWrapper>
  );
}
