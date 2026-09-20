'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap, RefreshCw, ChevronRight, Users, TrendingUp,
  Sparkles, ArrowRight, CheckCircle2, X,
} from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface CampaignTemplate {
  name: string;
  type: string;
  description: string;
  content_template: string;
  marketing_goal: string;
  segment_name: string;
}

interface Opportunity {
  id: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  audience_size: number;
  potential_revenue: number;
  potential_revenue_formatted: string;
  confidence_score: number;
  suggested_action: string;
  segment_rules: any[];
  campaign_template: CampaignTemplate;
}

function ConfidenceRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <motion.circle
          cx="24" cy="24" r={r} fill="none"
          stroke="#0B85FC" strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: '#0B85FC' }}>{score}%</span>
      </div>
    </div>
  );
}

function OpportunityCard({
  opp, index, onLaunch, launching,
}: {
  opp: Opportunity;
  index: number;
  onLaunch: (opp: Opportunity) => void;
  launching: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLaunching = launching === opp.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.2 }}
      className="relative overflow-hidden rounded-xl p-4 transition-all"
      style={{
        background: '#2F3654',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(11,133,252,0.35)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(11,133,252,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.20)'; }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: 'rgba(11,133,252,0.12)', border: '1px solid rgba(11,133,252,0.22)' }}>
            {opp.icon || '⚡'}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold truncate" style={{ color: '#F7F9FC' }}>{opp.title}</h4>
            <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: '#AAB3C2' }}>{opp.description}</p>

            {/* Metrics */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono">
              <div className="flex items-center gap-1 font-bold" style={{ color: '#F7F9FC' }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#0B85FC' }} />
                <span>{opp.potential_revenue_formatted}</span>
                <span className="text-[10px] font-normal" style={{ color: '#5F6878' }}>potential</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: '#AAB3C2' }}>
                <Users className="w-3.5 h-3.5" style={{ color: '#5F6878' }} />
                <span>{opp.audience_size.toLocaleString()}</span>
                <span className="text-[10px]" style={{ color: '#5F6878' }}>contacts</span>
              </div>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(86,96,243,0.14)', color: '#8B96FF', border: '1px solid rgba(86,96,243,0.25)' }}>
                {opp.type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        <ConfidenceRing score={opp.confidence_score} />
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-3 flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer"
        style={{ color: '#5F6878' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#0B85FC')}
        onMouseLeave={e => (e.currentTarget.style.color = '#5F6878')}
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <span>{expanded ? 'Hide recommendation details' : 'View AI rationale & rules'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 rounded-lg text-xs font-mono space-y-1.5"
              style={{ background: 'rgba(14,20,31,0.70)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] uppercase font-bold" style={{ color: '#5660F3' }}>Recommended Execution Plan:</p>
              <p className="leading-relaxed" style={{ color: '#AAB3C2' }}>{opp.suggested_action}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Footer */}
      <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-[10px] font-mono" style={{ color: '#5F6878' }}>
          {opp.campaign_template.type.toUpperCase()} · {opp.campaign_template.segment_name}
        </span>
        <button
          onClick={() => onLaunch(opp)}
          disabled={isLaunching}
          className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
        >
          {isLaunching ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          <span>{isLaunching ? 'Creating...' : 'Launch Campaign'}</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function AIOpportunitiesWidget() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const loadOpportunities = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.getOpportunities() as Opportunity[];
      setOpportunities(res || []);
    } catch (e: any) {
      console.error('Failed to load opportunities:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);

  const handleLaunch = async (opp: Opportunity) => {
    setLaunching(opp.id);
    try {
      const tmpl = opp.campaign_template;
      await api.approveStudioCampaign({
        marketing_goal: tmpl.marketing_goal,
        segment_name: tmpl.segment_name,
        segment_rules: opp.segment_rules,
        channel: tmpl.type,
        content_template: tmpl.content_template,
        description: tmpl.description,
      });
      success(`Campaign "${tmpl.name}" created successfully!`);
      router.push('/campaigns');
    } catch (e: any) {
      toastError(e.message || 'Failed to create campaign');
    } finally {
      setLaunching(null);
    }
  };

  return (
    <div className="p-6 rounded-xl space-y-4"
      style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #5660F3, #6B5CF6)', boxShadow: '0 4px 12px rgba(86,96,243,0.30)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono flex items-center gap-2" style={{ color: '#F7F9FC' }}>
              AI Opportunities
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(86,96,243,0.14)', color: '#8B96FF', border: '1px solid rgba(86,96,243,0.25)' }}>
                Proactive Intelligence
              </span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#AAB3C2' }}>
              High-confidence cohort interventions detected by LangGraph swarms
            </p>
          </div>
        </div>
        <button
          onClick={() => loadOpportunities(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#AAB3C2', border: '1px solid rgba(255,255,255,0.09)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,133,252,0.10)'; e.currentTarget.style.color = '#0B85FC'; e.currentTarget.style.borderColor = 'rgba(11,133,252,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#AAB3C2'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Rescan</span>
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && opportunities.length === 0 && (
        <div className="py-10 text-center space-y-2 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.10)' }}>
          <p className="text-xs font-mono" style={{ color: '#AAB3C2' }}>No urgent interventions detected.</p>
          <p className="text-[11px]" style={{ color: '#5F6878' }}>The AI continuously scans customer engagement and transactional vectors.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && opportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp, i) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              index={i}
              onLaunch={handleLaunch}
              launching={launching}
            />
          ))}
        </div>
      )}
    </div>
  );
}
