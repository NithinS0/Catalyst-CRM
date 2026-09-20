'use client';

import { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import { Layers, Plus, Users, X, RefreshCw, Trash2, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';

const OPERATOR_LABELS: Record<string, string> = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  contains: 'contains',
  in: 'in'
};

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  lead_score: 'Interest Index',
  company: 'Company',
  email: 'Email Domain',
  days_since_last_activity: 'Days Inactive',
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
  const [form, setForm]                 = useState<SegmentForm>({
    name: '',
    description: '',
    rules: [{ field: 'status', operator: 'eq', value: 'active' }],
  });

  const loadSegments = async () => {
    try {
      const segs = await api.getSegments() as any[];
      setSegments(segs || []);
    } catch {
      toastError('Failed to load audience segments');
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
      toastError(err.message || 'Failed to calculate segment size');
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
    if (!form.name || form.rules.length === 0) {
      toastError('Segment title and at least one rule are required');
      return;
    }
    setSaving(true);
    try {
      await api.createSegment({ name: form.name, description: form.description, definition: form.rules });
      success('Audience segment created!');
      setShowModal(false);
      setForm({ name: '', description: '', rules: [{ field: 'status', operator: 'eq', value: 'active' }] });
      loadSegments();
    } catch (err: any) {
      toastError(err.message || 'Failed to create segment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSegment = async (id: string, name: string) => {
    if (!confirm(`Delete segment "${name}"?`)) return;
    try {
      await api.deleteSegment(id);
      success('Segment deleted');
      loadSegments();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete segment');
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-8 pb-10 font-mono">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0E141F 0%, #1E222B 50%, #2F3654 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">Audience Segments & Cohorts</h1>
            <p className="text-xs" style={{ color: '#AAB3C2' }}>
              Dynamic rule-based and vectorized cohorts isolated strictly to your workspace.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Cohort</span>
          </button>
        </div>

        {/* Segments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl animate-pulse" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))
          ) : segments.length === 0 ? (
            <div className="col-span-full py-16 text-center rounded-xl space-y-3"
              style={{ border: '1px dashed rgba(255,255,255,0.12)' }}>
              <Layers className="w-10 h-10 mx-auto" style={{ color: '#5F6878' }} />
              <h3 className="text-sm font-bold text-white">No segments created yet</h3>
              <p className="text-xs" style={{ color: '#AAB3C2' }}>Build rule-based cohorts or generate them via the AI Studio.</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-xs px-4 py-2 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Create Cohort
              </button>
            </div>
          ) : (
            segments.map((seg: any) => {
              const definition: RuleItem[] = typeof seg.definition === 'string'
                ? JSON.parse(seg.definition)
                : seg.definition;
              const matchCount = evalResults[seg.id];

              return (
                <div
                  key={seg.id}
                  className="p-5 rounded-xl flex flex-col justify-between gap-4 transition-all min-w-0 overflow-hidden"
                  style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(11,133,252,0.30)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="p-2 rounded-lg shrink-0 mt-0.5" style={{ background: 'rgba(86,96,243,0.12)', border: '1px solid rgba(86,96,243,0.22)' }}>
                          <Filter className="w-3.5 h-3.5" style={{ color: '#5660F3' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold truncate text-white" title={seg.name}>{seg.name}</h3>
                          {seg.description && (
                            <p
                              className="text-[11px] mt-1 line-clamp-2 leading-relaxed break-words"
                              title={seg.description}
                              style={{ color: '#AAB3C2' }}
                            >
                              {seg.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSegment(seg.id, seg.name)}
                        className="p-1 rounded transition-colors cursor-pointer shrink-0"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                        title="Delete segment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Rule Expressions */}
                    <div className="p-3 rounded-lg text-[11px] space-y-1.5 overflow-hidden"
                      style={{ background: 'rgba(14,20,31,0.60)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-[9px] uppercase font-bold block" style={{ color: '#5F6878' }}>Evaluation Criteria</span>
                      {(definition || []).map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap text-xs min-w-0">
                          <span className="font-semibold" style={{ color: '#F7F9FC' }}>{FIELD_LABELS[rule.field] || rule.field}</span>
                          <span style={{ color: '#5F6878' }}>{OPERATOR_LABELS[rule.operator] || rule.operator}</span>
                          <span className="px-1.5 py-0.5 rounded break-all max-w-full" style={{ background: 'rgba(11,133,252,0.12)', color: '#0B85FC', border: '1px solid rgba(11,133,252,0.22)' }}>
                            {Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)}
                          </span>
                          {idx < (definition || []).length - 1 && (
                            <span className="text-[9px] uppercase ml-auto shrink-0" style={{ color: '#5F6878' }}>AND</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Evaluation */}
                  <div className="pt-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-left min-w-0">
                      <p className="text-xs" style={{ color: '#5F6878' }}>
                        Audience: <strong className="text-white">{matchCount !== undefined ? matchCount : '—'}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => handleEvaluate(seg.id)}
                      disabled={evaluating === seg.id}
                      className="py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#AAB3C2', border: '1px solid rgba(255,255,255,0.10)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,133,252,0.10)'; e.currentTarget.style.color = '#0B85FC'; e.currentTarget.style.borderColor = 'rgba(11,133,252,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#AAB3C2'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                    >
                      {evaluating === seg.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      <span>{evaluating === seg.id ? 'Evaluating...' : 'Query Match'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Create Segment Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono"
            style={{ background: 'rgba(8,12,20,0.75)', backdropFilter: 'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-xl space-y-4"
              style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}
            >
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-sm font-bold text-white">Define Audience Cohort</h2>
                <button onClick={() => setShowModal(false)} className="transition-colors cursor-pointer" style={{ color: '#5F6878' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5F6878')}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold" style={{ color: '#5F6878' }}>Cohort Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Inactive Enterprise Tier 1"
                    className="catalyst-input-dark text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold" style={{ color: '#5F6878' }}>Cohort Objective</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Target criteria explanation..."
                    className="catalyst-input-dark text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold" style={{ color: '#5F6878' }}>Inclusion Filter Rules *</label>
                    <button
                      type="button"
                      onClick={addRule}
                      className="text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      style={{ color: '#0B85FC' }}
                    >
                      <Plus className="w-3 h-3" /> Add Rule
                    </button>
                  </div>

                  {form.rules.map((rule, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 rounded-lg items-center"
                      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,20,31,0.50)' }}>
                      <div className="col-span-4">
                        <select
                          value={rule.field}
                          onChange={e => updateRule(idx, 'field', e.target.value)}
                          className="catalyst-input-dark catalyst-select-dark text-xs"
                        >
                          <option value="status">Status</option>
                          <option value="lead_score">Interest Score</option>
                          <option value="company">Company</option>
                          <option value="email">Email</option>
                        </select>
                      </div>

                      <div className="col-span-3">
                        <select
                          value={rule.operator}
                          onChange={e => updateRule(idx, 'operator', e.target.value)}
                          className="catalyst-input-dark catalyst-select-dark text-xs"
                        >
                          <option value="eq">=</option>
                          <option value="neq">≠</option>
                          <option value="gt">&gt;</option>
                          <option value="gte">≥</option>
                          <option value="lt">&lt;</option>
                          <option value="lte">≤</option>
                          <option value="contains">contains</option>
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          value={Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)}
                          onChange={e => updateRule(idx, 'value', e.target.value)}
                          placeholder="Value"
                          className="catalyst-input-dark text-xs"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {form.rules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRule(idx)}
                            className="transition-colors cursor-pointer"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 rounded-lg text-xs transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#AAB3C2', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary text-xs py-2"
                  >
                    {saving ? 'Creating...' : 'Save Cohort'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </LayoutWrapper>
  );
}
