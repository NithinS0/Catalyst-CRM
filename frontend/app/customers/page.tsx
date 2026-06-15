'use client';

import { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  Users, Search, Phone, Mail, Building2, Plus, Bot, Sparkles,
  ChevronRight, RefreshCw, X, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';

const STATUS_STYLES: Record<string, string> = {
  active:        'badge-active',
  churn_risk:    'badge-churn',
  inactive:      'badge-inactive',
  lead:          'badge-lead',
  contact_ready: 'badge-lead',
};

const INTERACTION_COLORS: Record<string, string> = {
  support: 'bg-red-500',
  call:    'bg-amber-500',
  email:   'bg-blue-500',
  meeting: 'bg-violet-500',
  note:    'bg-zinc-400',
};

export default function CustomersPage() {
  const { success, error: toastError } = useToast();
  const [customers, setCustomers]           = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer]     = useState<any | null>(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [semanticSearch, setSemanticSearch] = useState('');
  const [showAddForm, setShowAddForm]       = useState(false);
  const [noteType, setNoteType]             = useState('note');
  const [noteSummary, setNoteSummary]       = useState('');
  const [noteDetails, setNoteDetails]       = useState('');
  const [formLoading, setFormLoading]       = useState(false);
  const [loadingList, setLoadingList]       = useState(true);
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [aiPrompt, setAiPrompt]             = useState('');
  const [aiDrafting, setAiDrafting]         = useState(false);

  // Add contact modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [newCustomer, setNewCustomer]         = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', status: 'lead', lead_score: 0 });
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');

  async function loadCustomers() {
    try {
      const res = await api.getCustomers() as any[];
      setCustomers(res);
      if (res.length > 0 && !selectedCustomerId) setSelectedCustomerId(res[0].id);
    } catch { toastError('Failed to load contacts'); }
    finally { setLoadingList(false); }
  }

  async function loadCustomerDetails(id: string, semQuery?: string) {
    setLoadingDetail(true);
    try {
      const res = await api.getCustomer(`${id}${semQuery ? `?search_query=${encodeURIComponent(semQuery)}` : ''}`) as any;
      setSelectedCustomer(res);
    } catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  }

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => { if (selectedCustomerId) loadCustomerDetails(selectedCustomerId); }, [selectedCustomerId]);

  const handleSemanticSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerId) loadCustomerDetails(selectedCustomerId, semanticSearch);
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !noteSummary) return;
    setFormLoading(true);
    try {
      await api.addInteraction(selectedCustomerId, { type: noteType, summary: noteSummary, details: noteDetails });
      success('Interaction logged and saved to AI memory!');
      setNoteSummary(''); setNoteDetails(''); setShowAddForm(false);
      await loadCustomerDetails(selectedCustomerId);
      await loadCustomers();
    } catch (err: any) { toastError(err.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleAiDraft = async () => {
    if (!selectedCustomerId) return;
    setAiDrafting(true);
    try {
      const promptQuery = `Draft a ${noteType} message: ${aiPrompt.trim() || 'personalized outreach'}`;
      const res = await api.chatWithAgent(promptQuery, selectedCustomerId) as any;
      if (res && res.proposed_content) {
        const details = res.proposed_content;
        if (details.startsWith('Subject:')) {
          const parts = details.split('\n\n');
          const subjectLine = parts[0].replace('Subject:', '').trim();
          const restOfBody = parts.slice(1).join('\n\n').trim();
          setNoteSummary(subjectLine);
          setNoteDetails(restOfBody);
        } else {
          setNoteDetails(details);
          if (!noteSummary) {
            setNoteSummary(`AI Drafted ${noteType}`);
          }
        }
        success('Draft generated successfully!');
      } else {
        toastError('Failed to generate draft: No content returned');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to generate draft');
    } finally {
      setAiDrafting(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCustomer(newCustomer as any);
      success('Contact created and saved to memory!');
      setShowCreateModal(false);
      setNewCustomer({ first_name: '', last_name: '', email: '', phone: '', company: '', status: 'lead', lead_score: 0 });
      loadCustomers();
    } catch (err: any) { toastError(err.message || 'Failed to create contact'); }
    finally { setSaving(false); }
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q);
  });

  const translateCustomerStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Active Customer';
      case 'churn_risk': return 'At Risk';
      case 'inactive': return 'Inactive';
      case 'lead':
      case 'contact_ready':
        return 'New Lead';
      default: return status?.replace('_', ' ') || '';
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-5 h-[calc(100vh-100px)] flex flex-col pb-4 text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">People Directory</h1>
            <p className="text-zinc-500 text-sm mt-1">Browse contact timelines, log new interactions, and search their conversation memory in plain text.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary self-start sm:self-auto shrink-0 py-2.5 px-4 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>

        {/* Split Panel */}
        <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-h-0">

          {/* Left: Customer List */}
          <div className={`w-full lg:w-72 xl:w-80 card glass flex-col overflow-hidden p-0 shrink-0 border border-[var(--border)] shadow-sm ${mobileActiveView === 'list' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="p-3 border-b border-[var(--border)] shrink-0 bg-[var(--bg-overlay)]/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search contacts by name or company..."
                  className="input text-xs py-2"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-area divide-y divide-[var(--border)]/60">
              {loadingList ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton skeleton-text w-2/3" />
                      <div className="skeleton skeleton-text w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredCustomers.length === 0 ? (
                <p className="p-6 text-xs text-zinc-500 text-center">No contacts match your search.</p>
              ) : (
                filteredCustomers.map(c => {
                  const isSelected = selectedCustomerId === c.id;
                  return (
                    <motion.div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setMobileActiveView('detail');
                      }}
                      whileHover={{ x: isSelected ? 0 : 2 }}
                      className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/60 border-l-2 border-indigo-600' : 'border-l-2 border-transparent hover:bg-[var(--bg-overlay)]/40'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-overlay)] text-zinc-500 border border-[var(--border)]'}`}>
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-[var(--text-primary)]'}`}>{c.first_name} {c.last_name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{c.company || 'Independent'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold tabular-nums ${(c.lead_score || 0) >= 80 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                          Interest: {c.lead_score || 0}%
                        </span>
                        <ChevronRight className="w-3 h-3 text-zinc-300" />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-[var(--border)] shrink-0 bg-[var(--bg-overlay)]/20">
              <p className="text-[10px] text-zinc-500 text-center font-bold">{filteredCustomers.length} contacts found</p>
            </div>
          </div>

          {/* Right: Customer Detail */}
          <div className={`flex-1 card glass flex-col overflow-hidden p-0 min-w-0 border border-[var(--border)] shadow-sm ${mobileActiveView === 'detail' ? 'flex' : 'hidden lg:flex'}`}>
            {!selectedCustomer || loadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                {loadingDetail ? (
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                ) : (
                  <div className="text-center text-zinc-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                    <p className="text-sm">Select a contact to view their details</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Profile header */}
                <div className="p-5 border-b border-[var(--border)] shrink-0 bg-[var(--bg-overlay)]/40">
                  {/* Mobile Back Button */}
                  <div className="lg:hidden mb-4">
                    <button
                      type="button"
                      onClick={() => setMobileActiveView('list')}
                      className="btn btn-secondary py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180 text-zinc-500" />
                      Back to Directory
                    </button>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/10">
                        {selectedCustomer.customer.first_name?.[0]}{selectedCustomer.customer.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[var(--text-primary)]">{selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`badge ${STATUS_STYLES[selectedCustomer.customer.status] || 'badge-draft'}`}>
                            {translateCustomerStatus(selectedCustomer.customer.status)}
                          </span>
                          {selectedCustomer.customer.company && (
                            <span className="text-[10px] text-zinc-500"><Building2 className="w-2.5 h-2.5 inline mr-1 text-zinc-400" /><span className="font-medium">{selectedCustomer.customer.company}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-emerald-600">{selectedCustomer.customer.lead_score}%</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Interest Level</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border)] text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-zinc-400" /><span className="truncate">{selectedCustomer.customer.email}</span></div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-zinc-400" /><span>{selectedCustomer.customer.phone || 'No phone recorded'}</span></div>
                  </div>
                </div>

                {/* RAG Search */}
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-overlay)]/20 shrink-0">
                  <form onSubmit={handleSemanticSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500" />
                      <input type="text" value={semanticSearch} onChange={e => setSemanticSearch(e.target.value)}
                        placeholder="Search customer memory in plain English..."
                        className="input text-xs py-2"
                        style={{ paddingLeft: '2.25rem' }} />
                    </div>
                    <button type="submit" className="btn btn-secondary text-xs py-2 px-4 rounded-lg">Search</button>
                  </form>
                  <AnimatePresence>
                    {selectedCustomer.relevant_memories?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 animate-pulse" /> AI Memory Search Results
                        </div>
                        {selectedCustomer.relevant_memories.map((m: any, idx: number) => (
                          <p key={idx} className="text-[11px] text-zinc-600 border-l-2 border-indigo-400 pl-2 leading-relaxed">
                            "{m.content}" <span className="text-zinc-400 font-mono">(score: {(1 - parseFloat(m.distance)).toFixed(2)})</span>
                          </p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto scroll-area p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Timeline of Interactions</h4>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary text-xs py-2 px-3 rounded-lg shadow-sm">
                      <Plus className="w-3.5 h-3.5" /> Log Interaction
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddInteraction}
                        className="card bg-[var(--bg-surface)] border border-[var(--border)] p-4 space-y-3.5 overflow-hidden shadow-sm"
                      >
                        <div className="flex gap-1.5 flex-wrap">
                          {['note', 'call', 'meeting', 'email', 'support'].map(t => (
                            <button key={t} type="button" onClick={() => setNoteType(t)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-colors ${noteType === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-[var(--bg-overlay)] text-zinc-500 hover:text-zinc-800'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="p-3 bg-indigo-50/40 border border-indigo-100/60 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" /> AI Draft Assistant
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={aiPrompt}
                              onChange={e => setAiPrompt(e.target.value)}
                              placeholder={`Prompt (optional, e.g. "offer discount", "apologize for delay")`}
                              className="input text-xs flex-1 bg-white border-zinc-200"
                            />
                            <button
                              type="button"
                              disabled={aiDrafting}
                              onClick={handleAiDraft}
                              className="btn btn-secondary text-xs py-2 px-3.5 shrink-0 flex items-center gap-1.5 border border-indigo-100 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/80 transition-colors"
                            >
                              {aiDrafting ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Bot className="w-3.5 h-3.5" />
                              )}
                              Draft with AI
                            </button>
                          </div>
                        </div>
                        <input required value={noteSummary} onChange={e => setNoteSummary(e.target.value)} placeholder="Summary of what happened…" className="input text-xs" />
                        <textarea value={noteDetails} onChange={e => setNoteDetails(e.target.value)} rows={2} placeholder="Write details here (the AI will remember this context later)…" className="input text-xs resize-none" />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-ghost text-xs py-2">Cancel</button>
                          <button type="submit" disabled={formLoading} className="btn btn-primary text-xs py-2 px-4 rounded-lg">
                            {formLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save to Memory'}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {selectedCustomer.timeline?.length === 0 ? (
                    <p className="text-xs text-zinc-450 italic">No timeline events logged yet.</p>
                  ) : (
                    <div className="relative pl-5 space-y-4 border-l border-[var(--border)]">
                      {selectedCustomer.timeline?.map((ev: any) => (
                        <div key={ev.id} className="relative">
                          <div className={`absolute top-1.5 left-[-21px] w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-card)] ${INTERACTION_COLORS[ev.type] || 'bg-zinc-400'}`} />
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">
                            <span>{ev.type}</span>
                            <span>·</span>
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{ev.summary}</p>
                          {ev.details && <p className="text-xs text-zinc-500 leading-relaxed mt-0.5 pl-2 border-l border-[var(--border)]">{ev.details}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Contact Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="card w-full max-w-md glass border border-[var(--border)] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Add New Contact</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider">First Name *</label>
                    <input required value={newCustomer.first_name} onChange={e => setNewCustomer(p => ({...p, first_name: e.target.value}))} className="input text-xs" placeholder="e.g. Jane" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Last Name *</label>
                    <input required value={newCustomer.last_name} onChange={e => setNewCustomer(p => ({...p, last_name: e.target.value}))} className="input text-xs" placeholder="e.g. Smith" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Email *</label>
                  <input required type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({...p, email: e.target.value}))} className="input text-xs" placeholder="jane.smith@company.com" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Phone</label>
                    <input value={newCustomer.phone} onChange={e => setNewCustomer(p => ({...p, phone: e.target.value}))} className="input text-xs" placeholder="+1 (555) 019-2834" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Status</label>
                    <select value={newCustomer.status} onChange={e => setNewCustomer(p => ({...p, status: e.target.value}))} className="input text-xs py-2.5">
                      <option value="lead">New Lead</option>
                      <option value="contact_ready">Ready to Contact</option>
                      <option value="active">Active Customer</option>
                      <option value="churn_risk">At Risk</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Company</label>
                  <input value={newCustomer.company} onChange={e => setNewCustomer(p => ({...p, company: e.target.value}))} className="input text-xs" placeholder="Company name..." />
                </div>
                <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1 py-2.5 rounded-xl">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5 rounded-xl shadow-md">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Contact</>}
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
