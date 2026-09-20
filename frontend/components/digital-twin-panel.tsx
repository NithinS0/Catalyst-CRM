'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, RefreshCw, TrendingUp, ShoppingBag,
  AlertTriangle, Star, Calendar, Target, ChevronDown, ChevronUp,
  Sparkles, Activity, Clock, DollarSign, BarChart3,
} from 'lucide-react';
import { api } from '@/services/api';

interface DigitalTwin {
  id: string;
  customer_id: string;
  behavioral_summary: string;
  purchase_frequency_days: number | null;
  preferred_categories: string[];
  avg_order_value: number;
  total_lifetime_value: number;
  preferred_channel: string;
  churn_risk_score: number;
  churn_risk_label: 'low' | 'medium' | 'high' | 'critical';
  predicted_next_purchase_date: string | null;
  recommended_action: string;
  recommended_product: string;
  generated_at: string;
}

export default function DigitalTwinPanel({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [twin, setTwin] = useState<DigitalTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchTwin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDigitalTwin(customerId) as DigitalTwin;
      setTwin(res);
    } catch {
      // Not yet generated for this contact — ready for synthesis
      setTwin(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.generateDigitalTwin(customerId) as DigitalTwin;
      setTwin(res);
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, [fetchTwin]);

  const getChurnRiskBadge = (score: number, label: string) => {
    const l = (label || '').toLowerCase();
    if (l === 'critical' || score >= 75) {
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
        text: `${score}/100 (critical)`,
      };
    }
    if (l === 'high' || score >= 50) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        text: `${score}/100 (elevated)`,
      };
    }
    return {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      text: `${score}/100 (low)`,
    };
  };

  return (
    <div className="space-y-3 font-mono text-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2F3654]">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-[#5660F3]/15 border border-[#5660F3]/30 flex items-center justify-center text-[#5660F3] group-hover:scale-105 transition-transform">
            <Brain className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#0DB8FA] transition-colors">
            AI Customer Digital Twin
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#AAB3C2]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#AAB3C2]" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          {twin && (
            <span className="text-[10px] text-[#AAB3C2] font-mono">
              {new Date(twin.generated_at).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || loading}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#0B85FC]/15 hover:bg-[#0B85FC]/25 text-[#0B85FC] border border-[#0B85FC]/30 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{twin ? 'Resynthesize' : 'Synthesize Twin'}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4"
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-[#0B85FC]" />
              </div>
            )}

            {!loading && !twin && (
              <div className="p-6 rounded-2xl border border-dashed border-[#2F3654] bg-[#0E141F]/60 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B85FC]/10 border border-[#0B85FC]/20 flex items-center justify-center text-[#0B85FC] mx-auto">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">No Synthesized Digital Twin Found</p>
                  <p className="text-[11px] text-[#AAB3C2] max-w-sm mx-auto">
                    Generate an autonomous behavioral twin to compute vector affinity, lifetime value, and purchase cadence for {customerName}.
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 rounded-xl bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-bold shadow-lg shadow-[#0B85FC]/20 transition-all cursor-pointer"
                >
                  {generating ? 'Synthesizing...' : 'Synthesize Profile'}
                </button>
              </div>
            )}

            {!loading && twin && (
              <div className="space-y-3.5 text-xs">
                {/* 1. Behavioral Summary Box */}
                <div className="p-4 rounded-xl border border-[#2F3654] bg-[#0E141F]/80 space-y-2 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#0DB8FA] tracking-wider">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Vector Behavioral Synthesis</span>
                  </div>
                  <p className="text-xs text-[#F7F9FC] leading-relaxed font-sans font-normal">
                    {twin.behavioral_summary}
                  </p>
                </div>

                {/* 2. Metrics Grid (Dark high-contrast cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Lifetime Value */}
                  <div className="p-3 rounded-xl border border-[#2F3654] bg-[#1E222B] shadow-sm">
                    <p className="text-[10px] text-[#AAB3C2] uppercase font-bold tracking-wider">Lifetime Value</p>
                    <p className="text-base font-extrabold text-white mt-1">
                      ₹{(twin.total_lifetime_value || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Avg Order Value */}
                  <div className="p-3 rounded-xl border border-[#2F3654] bg-[#1E222B] shadow-sm">
                    <p className="text-[10px] text-[#AAB3C2] uppercase font-bold tracking-wider">Avg Order Value</p>
                    <p className="text-base font-extrabold text-white mt-1">
                      ₹{(twin.avg_order_value || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Purchase Cadence */}
                  <div className="p-3 rounded-xl border border-[#2F3654] bg-[#1E222B] shadow-sm">
                    <p className="text-[10px] text-[#AAB3C2] uppercase font-bold tracking-wider">Purchase Cadence</p>
                    <p className="text-base font-extrabold text-[#0DB8FA] mt-1">
                      {twin.purchase_frequency_days ? `${twin.purchase_frequency_days} days` : 'N/A'}
                    </p>
                  </div>

                  {/* Churn Risk */}
                  {(() => {
                    const badge = getChurnRiskBadge(twin.churn_risk_score, twin.churn_risk_label);
                    return (
                      <div className="p-3 rounded-xl border border-[#2F3654] bg-[#1E222B] shadow-sm">
                        <p className="text-[10px] text-[#AAB3C2] uppercase font-bold tracking-wider">Churn Risk</p>
                        <p className="text-sm font-extrabold mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.text}
                          </span>
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Preferred Categories */}
                {twin.preferred_categories && twin.preferred_categories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap py-1">
                    <span className="text-[10px] text-[#AAB3C2] uppercase font-bold tracking-wider">
                      Categories:
                    </span>
                    {twin.preferred_categories.map(cat => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 rounded-lg bg-[#2F3654]/70 text-[11px] font-semibold text-white border border-[#2F3654]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* 4. Recommended Action Box */}
                <div className="p-4 rounded-xl border border-[#0B85FC]/30 bg-gradient-to-r from-[#0B85FC]/10 to-[#5660F3]/10 space-y-1.5 shadow-sm">
                  <p className="text-[11px] uppercase font-bold text-[#0DB8FA] flex items-center gap-1.5 tracking-wider">
                    <Target className="w-3.5 h-3.5" />
                    <span>Next Recommended Engagement Action</span>
                  </p>
                  <p className="text-xs text-white leading-relaxed font-sans font-medium">
                    {twin.recommended_action}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
