'use client';

import { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import { Layers, Plus, Play, Users, X, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { SkeletonCard } from '@/components/ui/skeleton';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item: any = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } } };

const OPERATOR_LABELS: Record<string, string> = {
  eq: 'is equal to',
  neq: 'is not equal to',
  gt: 'is greater than',
  gte: 'is greater than or equal to',
  lt: 'is less than',
  lte: 'is less than or equal to',
  contains: 'contains text',
  in: 'is in list'
};

const FIELD_LABELS: Record<string, string> = {
  status: 'status',
  lead_score: 'interest level',
  company: 'company name',
  email: 'email address',
  days_since_last_activity: 'days since last activity',
  last_active: 'last active'
};

interface RuleItem {
  field: string;
  operator: string;
  value: string | number | string[];
}

interface SegmentForm {
  name: string;
  description: string;
  rules: RuleItem[];
}

export default function SegmentsPage() {
  const { success, error: toastError } = useToast();
  const [segments, setSegments]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [evaluating, setEvaluating]     = useState<string | null>(null);
  const [evalResults, setEvalResults]   = useState<Record<string, number>>({});
  const [showModal, setShowModal]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState<SegmentForm>({ name: '', description: '', rules: [{ field: 'status', operator: 'eq', value: 'active' }] });

  const loadSegments = async () => {
    try {
      const segs = await api.getSegments() as any[];
      setSegments(segs);
    } catch (err) {
      toastError('Failed to load customer groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSegments(); }, []);

  const handleEvaluate = async (segmentId: string) => {
    setEvaluating(segmentId);
    try {
      const result = await api.evaluateSegment(segmentId) as any;
      setEvalResults(prev => ({ ...prev, [segmentId]: result.count }));
    } catch (err: any) {
      toastError(err.message || 'Failed to calculate group size');
    } finally {
      setEvaluating(null);
    }
  };

  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, { field: 'status', operator: 'eq', value: 'active' }] }));
  const removeRule = (idx: number) => setForm(f => ({ ...f, rules: f.rules.filter((_, i) => i !== idx) }));
  const updateRule = (idx: number, key: keyof RuleItem, val: string) => {
    setForm(f => {
      const rules = [...f.rules];
      rules[idx] = { ...rules[idx], [key]: key === 'value' && rules[idx].operator === 'in' ? val.split(',').map(s => s.trim()) : val };
      return { ...f, rules };
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.rules.length === 0) { toastError('Name and at least one rule are required'); return; }
    setSaving(true);
    try {
      await api.createSegment({ name: form.name, description: form.description, definition: form.rules });
      success('Customer group created!');
      setShowModal(false);
      setForm({ name: '', description: '', rules: [{ field: 'status', operator: 'eq', value: 'active' }] });
      loadSegments();
    } catch (err: any) {
      toastError(err.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LayoutWrapper>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-7 pb-8 text-[var(--text-primary)]">

        {/* Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Customer Groups</h1>
            <p className="text-zinc-500 text-sm mt-1">Create custom groups of contacts based on rules to send targeted messages.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary self-start sm:self-auto py-2.5 px-4 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </motion.div>

        {/* Segment Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : segments.map((seg: any) => {
                const definition: RuleItem[] = typeof seg.definition === 'string'
                  ? JSON.parse(seg.definition) : seg.definition;
                const matchCount = evalResults[seg.id];

                return (
                  <motion.div key={seg.id} whileHover={{ y: -3 }} className="card glass card-hover flex flex-col gap-4 border border-[var(--border)] shadow-sm justify-between">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-150 shrink-0">
                          <Layers className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[var(--text-primary)]">{seg.name}</h3>
                          {seg.description && <p className="text-[10px] text-zinc-400 mt-0.5">{seg.description}</p>}
                        </div>
                      </div>
                      {matchCount !== undefined && (
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-emerald-600">{matchCount}</p>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase">matching people</p>
                        </div>
                      )}
                    </div>

                    {/* Rules */}
                    <div className="space-y-1.5 flex-1 mt-2">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Group Rules</p>
                      <div className="bg-[var(--bg-overlay)] border border-[var(--border)] rounded-xl p-3.5 space-y-1.5 font-mono text-[10.5px]">
                        {(definition || []).map((rule, ridx) => (
                          <div key={ridx} className="flex items-center gap-2 flex-wrap">
                            <span className="text-indigo-600 font-bold">{FIELD_LABELS[rule.field] || rule.field}</span>
                            <span className="text-zinc-400 font-medium">{OPERATOR_LABELS[rule.operator] || rule.operator}</span>
                            <span className="text-emerald-600 font-semibold">
                              {Array.isArray(rule.value) ? `[${rule.value.join(', ')}]` : String(rule.value)}
                            </span>
                            {ridx < (definition || []).length - 1 && (
                              <span className="text-zinc-400 ml-auto font-bold text-[9px] bg-zinc-200/50 px-1 py-0.5 rounded">AND</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evaluate button */}
                    <button
                      onClick={() => handleEvaluate(seg.id)}
                      disabled={evaluating === seg.id}
                      className="btn btn-secondary w-full text-xs py-2 rounded-xl mt-3"
                    >
                      {evaluating === seg.id ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Calculating…</>
                      ) : (
                        <><Users className="w-3.5 h-3.5 text-zinc-500" /> Calculate Group Size</>
                      )}
                    </button>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* Empty State */}
        {!loading && segments.length === 0 && (
          <motion.div variants={item} className="card glass text-center py-16 border border-[var(--border)] shadow-sm">
            <Layers className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-400">No customer groups created yet</h3>
            <p className="text-sm text-zinc-500 mt-1">Groups are automatically created by your AI assistant, or you can create one yourself.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary mt-5 mx-auto py-2.5 px-4 rounded-xl shadow-md">
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </motion.div>
        )}

      </motion.div>

      {/* Create Segment Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="card w-full max-w-lg glass max-h-[85vh] overflow-y-auto scroll-area border border-[var(--border)] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Create Group</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Group Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Active VIP Customers" className="input text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="e.g. Customers who engage frequently and have high scores" className="input text-xs" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rules for who gets in *</label>
                    <button type="button" onClick={addRule} className="btn btn-ghost text-xs py-1 px-2 text-indigo-600 hover:bg-indigo-50 rounded"><Plus className="w-3 h-3" /> Add Rule</button>
                  </div>
                  {form.rules.map((rule, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2.5 items-center p-2.5 bg-slate-50/40 border border-slate-200/60 rounded-xl shadow-sm">
                      <div className="col-span-12 sm:col-span-4">
                        <select
                          value={rule.field}
                          onChange={e => updateRule(idx, 'field', e.target.value)}
                          className="input text-xs py-2 bg-white cursor-pointer"
                        >
                          <option value="status">status</option>
                          <option value="lead_score">interest level</option>
                          <option value="company">company name</option>
                          <option value="email">email address</option>
                        </select>
                      </div>
                      <div className="col-span-12 sm:col-span-4">
                        <select
                          value={rule.operator}
                          onChange={e => updateRule(idx, 'operator', e.target.value)}
                          className="input text-xs py-2 bg-white cursor-pointer"
                        >
                          <option value="eq">is equal to</option>
                          <option value="neq">is not equal to</option>
                          <option value="gt">is greater than</option>
                          <option value="gte">is greater or equal</option>
                          <option value="lt">is less than</option>
                          <option value="lte">is less or equal</option>
                          <option value="contains">contains text</option>
                          <option value="in">is in list</option>
                        </select>
                      </div>
                      <div className="col-span-10 sm:col-span-3">
                        <input
                          value={Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)}
                          onChange={e => updateRule(idx, 'value', e.target.value)}
                          placeholder="value"
                          className="input text-xs py-2 bg-white"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-center">
                        {form.rules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRule(idx)}
                            className="text-zinc-400 hover:text-red-500 cursor-pointer p-1.5 hover:bg-red-50/50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {form.rules.length > 1 && (
                    <p className="text-[10px] text-zinc-500 font-medium">All rules must be met for a contact to be added to this group.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1 py-2.5 rounded-xl">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2.5 rounded-xl shadow-md">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Group</>}
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
