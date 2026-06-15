'use client';

import { useEffect, useRef, useState } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  Megaphone, Plus, Play, Mail, MessageSquare, Phone,
  CheckCircle, FileText, RefreshCw, X, Download, Sparkles,
  TrendingUp, BarChart2, Lightbulb, ArrowRight, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { SkeletonCard } from '@/components/ui/skeleton';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item: any = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } } };

const CHANNEL_ICONS: Record<string, React.FC<any>> = { email: Mail, sms: Phone, whatsapp: MessageSquare };

const STATUS_STYLES: Record<string, string> = {
  active:    'badge-active',
  draft:     'badge-draft',
  completed: 'badge-completed',
  scheduled: 'badge-inactive',
};

interface NewCampaign {
  name: string;
  type: string;
  content_template: string;
  description: string;
  segment_id: string;
}

import ReactMarkdown from 'react-markdown';

/* ─────────────── Campaign Report Modal ─────────────── */
interface ReportModalProps {
  campaign: any;
  reportContent: string;
  isGeneratingReport: boolean;
  onClose: () => void;
}

function ReportModal({ campaign, reportContent, isGeneratingReport, onClose }: ReportModalProps) {
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      if (!element) return;

      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `campaign-report-${campaign.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const openRate = campaign.total_sent > 0 ? Math.round((campaign.total_opened / campaign.total_sent) * 100) : 0;
  const clickRate = campaign.total_sent > 0 ? Math.round((campaign.total_clicked / campaign.total_sent) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="card w-full max-w-2xl glass border border-[var(--border)] shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">AI-Generated Report</span>
              </div>
              <h2 className="font-extrabold text-[var(--text-primary)] leading-tight">{campaign.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick KPI strip */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 shrink-0">
          {[
            { label: 'Sent', value: campaign.total_sent || 0, color: 'text-indigo-600', icon: BarChart2 },
            { label: 'Read Rate', value: `${openRate}%`, color: 'text-emerald-600', icon: TrendingUp },
            { label: 'Click Rate', value: `${clickRate}%`, color: 'text-amber-600', icon: TrendingUp },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="text-center p-2 sm:p-3 rounded-xl bg-[var(--bg-overlay)]/60 border border-[var(--border)]">
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${k.color} mx-auto mb-1`} />
                <p className={`text-sm sm:text-lg font-black ${k.color}`}>{k.value}</p>
                <p className="text-[8px] sm:text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none">{k.label}</p>
              </div>
            );
          })}
        </div>

        {/* Report body (scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1 scrollbar-thin">
          {isGeneratingReport ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[var(--text-primary)] text-sm">Generating AI Report…</p>
                <p className="text-xs text-zinc-400 mt-1">Analyzing campaign performance data</p>
              </div>
            </div>
          ) : (
            <div
              ref={reportRef}
              className="px-1 pb-2"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
            >
              {/* PDF-only header (hidden in UI, visible in PDF) */}
              <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-black text-slate-900">{campaign.name}</h1>
                <p className="text-sm text-slate-500">Campaign Report — Generated by Catalyst CRM</p>
              </div>
              <div className="text-[var(--text-primary)]">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-black text-[var(--text-primary)] mt-4 mb-2 pb-2 border-b border-[var(--border)]">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-[var(--text-primary)] mt-5 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-bold text-[var(--text-primary)] mt-4 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1.5 my-2 pl-1 list-none">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal space-y-1.5 my-2 pl-5 text-sm text-[var(--text-secondary)]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-[var(--text-primary)]">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {reportContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-5 mt-4 border-t border-[var(--border)] shrink-0">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1 py-2.5 rounded-xl text-sm"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingReport || downloading}
            className="btn btn-primary flex-1 py-2.5 rounded-xl text-sm shadow-md disabled:opacity-50"
          >
            {downloading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Preparing PDF…</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF Report</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────── Main Page ─────────────── */
export default function CampaignsPage() {
  const { success, error: toastError } = useToast();
  const [campaigns, setCampaigns]   = useState<any[]>([]);
  const [segments, setSegments]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [form, setForm]             = useState<NewCampaign>({ name: '', type: 'email', content_template: '', description: '', segment_id: '' });
  const [saving, setSaving]         = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportCampaign, setSelectedReportCampaign] = useState<any | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleOpenReport = async (camp: any) => {
    setSelectedReportCampaign(camp);
    setReportModalOpen(true);
    setIsGeneratingReport(true);
    setReportContent('');
    try {
      const data = await api.getCampaignReport(camp.id);
      setReportContent(data.report);
    } catch (err: any) {
      console.error(err);
      setReportContent(`# Campaign Report: ${camp.name}\n\n*Could not generate AI report. Please try again.*`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const loadData = async () => {
    try {
      const [camps, segs] = await Promise.all([
        api.getCampaigns() as Promise<any[]>,
        api.getSegments()  as Promise<any[]>,
      ]);
      setCampaigns(camps);
      setSegments(segs);
    } catch (err) {
      console.error(err);
      toastError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content_template) { toastError('Name and content are required'); return; }
    setSaving(true);
    try {
      await api.createCampaign(form as any);
      success('Campaign created successfully!');
      setShowModal(false);
      setForm({ name: '', type: 'email', content_template: '', description: '', segment_id: '' });
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
      await api.triggerCampaign(campaignId);
      success(`Campaign "${name}" triggered successfully!`);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to trigger campaign');
    } finally {
      setTriggering(null);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteCampaign(id);
      success('Campaign deleted');
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete campaign');
    }
  };

  const translateCampaignStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Sending';
      case 'completed': return 'Finished';
      case 'draft': return 'Draft';
      case 'scheduled': return 'Scheduled';
      default: return status || '';
    }
  };

  const translateChannelType = (type: string) => {
    switch (type) {
      case 'email': return 'Email message';
      case 'sms': return 'SMS text message';
      case 'whatsapp': return 'WhatsApp message';
      default: return type;
    }
  };

  const stats = {
    total:  campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    draft:  campaigns.filter(c => c.status === 'draft').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
  };

  return (
    <LayoutWrapper>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-7 pb-8 text-[var(--text-primary)]">

        {/* Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Message Campaigns</h1>
            <p className="text-zinc-500 text-sm mt-1">Send targeted messages at scale via Email, SMS, or WhatsApp.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary self-start sm:self-auto py-2.5 px-4 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Messages', value: stats.total,     color: 'text-zinc-700' },
            { label: 'Sending',       value: stats.active,    color: 'text-indigo-600' },
            { label: 'Drafts',        value: stats.draft,     color: 'text-zinc-500' },
            { label: 'Sent',          value: stats.completed, color: 'text-emerald-650' },
          ].map((s, i) => (
            <div key={i} className="card glass text-center border border-[var(--border)] shadow-sm">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Campaign Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : campaigns.map((camp: any) => {
                const ChannelIcon = CHANNEL_ICONS[camp.type] || Mail;
                const openRate = camp.total_sent > 0 ? Math.round((camp.total_opened / camp.total_sent) * 100) : 0;
                return (
                  <motion.div
                    key={camp.id}
                    whileHover={{ y: -3 }}
                    className="card glass card-hover flex flex-col gap-3 border border-[var(--border)] shadow-sm justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-150 shrink-0">
                            <ChannelIcon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{camp.name}</h3>
                            <p className="text-[10px] text-zinc-400 font-medium">{translateChannelType(camp.type)}</p>
                          </div>
                        </div>
                        <span className={`badge shrink-0 ${STATUS_STYLES[camp.status] || 'badge-draft'}`}>
                          {translateCampaignStatus(camp.status)}
                        </span>
                      </div>

                      {/* Description */}
                      {camp.description && (
                        <p className="text-xs text-zinc-500 leading-normal truncate-2">{camp.description}</p>
                      )}

                      {/* Delivery Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[
                          { label: 'Sent',    value: camp.total_sent    || 0, color: 'text-indigo-650' },
                          { label: 'Read',    value: camp.total_opened  || 0, color: 'text-emerald-650' },
                          { label: 'Clicked', value: camp.total_clicked || 0, color: 'text-amber-600' },
                        ].map((stat, i) => (
                          <div key={i} className="text-center p-2 rounded-xl bg-[var(--bg-overlay)]/40 border border-[var(--border)]">
                            <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Open rate bar */}
                      {(camp.total_sent || 0) > 0 && (
                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase">
                            <span>Read Rate</span>
                            <span>{openRate}%</span>
                          </div>
                          <div className="w-full bg-[var(--bg-overlay)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, ((camp.total_opened||0) / (camp.total_sent||1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Segment */}
                      {camp.segment_name && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium mt-1">
                          <Megaphone className="w-3.5 h-3.5 text-indigo-550 shrink-0" />
                          <span>Send to group: <span className="text-zinc-650 font-bold">{camp.segment_name}</span></span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={() => handleTrigger(camp.id, camp.name)}
                        disabled={!!triggering || camp.status === 'completed'}
                        className={`flex-1 btn text-xs py-2 rounded-xl ${camp.status === 'completed' ? 'btn-ghost opacity-40' : 'btn-primary shadow-sm'}`}
                      >
                        {triggering === camp.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : camp.status === 'completed' ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> Sent</>
                        ) : (
                          <><Play className="w-3.5 h-3.5" /> Send Messages Now</>
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenReport(camp)}
                        className="btn btn-secondary text-xs py-2 px-3 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                        title="View AI Campaign Report"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                        className="btn btn-secondary text-xs py-2 px-3 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
          }
        </motion.div>

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <motion.div variants={item} className="card glass text-center py-16 border border-[var(--border)] shadow-sm">
            <Megaphone className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-400">No message campaigns yet</h3>
            <p className="text-sm text-zinc-500 mt-1">Create your first outreach message or use the AI Campaign Studio to generate one.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-5 mx-auto py-2.5 px-4 rounded-xl shadow-md">
              <Plus className="w-4 h-4" /> Create Message Campaign
            </button>
          </motion.div>
        )}

      </motion.div>

      {/* ── AI Campaign Report Modal ── */}
      <AnimatePresence>
        {reportModalOpen && selectedReportCampaign && (
          <ReportModal
            campaign={selectedReportCampaign}
            reportContent={reportContent}
            isGeneratingReport={isGeneratingReport}
            onClose={() => {
              setReportModalOpen(false);
              setSelectedReportCampaign(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Create Campaign Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="card w-full max-w-lg glass border border-[var(--border)] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Create Message Campaign</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Message Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Inactive Customer Discount Offer" className="input text-xs" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-555 uppercase tracking-wider">How to send (Email, SMS, WhatsApp) *</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input text-xs py-2.5">
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Send to Group</label>
                    <select value={form.segment_id} onChange={e => setForm(f => ({ ...f, segment_id: e.target.value }))} className="input text-xs py-2.5">
                      <option value="">All Contacts</option>
                      {segments.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief summary of what this outreach is for..." className="input text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-555 uppercase tracking-wider">Message Body *</label>
                  <textarea
                    required rows={5}
                    value={form.content_template}
                    onChange={e => setForm(f => ({ ...f, content_template: e.target.value }))}
                    placeholder={'Hello {{first_name}},\n\nWe would love to welcome you back...\n\nBest,\nYour Business Team'}
                    className="input resize-none font-mono text-xs"
                  />
                  <p className="text-[10px] text-zinc-500">Use {`{{first_name}}`}, {`{{last_name}}`}, {`{{company}}`} to auto-fill contact details.</p>
                </div>
                <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1 py-2.5 rounded-xl">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5 rounded-xl shadow-md">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Campaign</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutWrapper>
  );
}
