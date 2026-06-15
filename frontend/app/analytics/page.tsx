'use client';

import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  TrendingUp, Mail, Sparkles, ArrowUpRight, CheckCircle, DollarSign,
  AlertTriangle, Lightbulb, Radio, Clock, Layers, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { SkeletonCard } from '@/components/ui/skeleton';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: any = {
  hidden: { opacity: 0, y: 14 },
  show:  { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

const EVENT_COLORS: Record<string, string> = {
  sent:      'text-indigo-650',
  delivered: 'text-blue-600',
  opened:    'text-emerald-650',
  read:      'text-teal-600',
  clicked:   'text-amber-600',
  converted: 'text-pink-600',
  failed:    'text-red-600',
};

const EVENT_BADGES: Record<string, string> = {
  sent:      'bg-indigo-50 text-indigo-600 border border-indigo-100',
  delivered: 'bg-blue-50 text-blue-600 border border-blue-100',
  opened:    'bg-emerald-50 text-emerald-600 border border-emerald-100',
  read:      'bg-teal-50 text-teal-600 border border-teal-100',
  clicked:   'bg-amber-50 text-amber-600 border border-amber-100',
  converted: 'bg-pink-50 text-pink-600 border border-pink-100',
  failed:    'bg-red-50 text-red-650 border border-red-100',
};

const EVENT_TRANSLATIONS: Record<string, string> = {
  sent:      'Sent',
  delivered: 'Delivered',
  opened:    'Opened',
  read:      'Read',
  clicked:   'Clicked',
  converted: 'Finished',
  failed:    'Failed',
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

export default function AnalyticsPage() {
  const [stats, setStats]           = useState<any>(null);
  const [summary, setSummary]       = useState<any>(null);
  const [events, setEvents]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [eventsLoading, setEventsLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getAnalyticsStats() as any;
      setStats(data);
    } catch (err) { console.error('Analytics stats error:', err); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const data = await api.getAnalyticsSummary() as any;
      setSummary(data);
    } catch (err) { console.error('Analytics summary error:', err); }
    finally { setSummaryLoading(false); }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const data = await api.getRealtimeEvents(25) as any[];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Events error:', err); }
    finally { setEventsLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchSummary();
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchEvents()]);
    setRefreshing(false);
  };

  const kpiCards = stats ? [
    { label: 'Total Messages Sent', value: stats.sent || 0,      icon: Mail,         color: 'text-indigo-650', bg: 'bg-indigo-50 border-indigo-100 shadow-sm' },
    { label: 'Read',               value: stats.opened || 0,    icon: CheckCircle,  color: 'text-emerald-650',bg: 'bg-emerald-50 border-emerald-100 shadow-sm' },
    { label: 'Clicked Link',       value: stats.clicked || 0,   icon: ArrowUpRight, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100 shadow-sm' },
    { label: 'Actions Completed',  value: stats.converted || 0, icon: TrendingUp,   color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-100 shadow-sm' },
    { label: 'Estimated Earnings', value: `$${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-650', bg: 'bg-emerald-50 border-emerald-100 shadow-sm' },
    { label: 'Message Campaigns',  value: stats.campaigns_count || 0, icon: Layers,  color: 'text-violet-650', bg: 'bg-violet-50 border-violet-100 shadow-sm' },
  ] : [];

  const openRate = stats && stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : '0.0';
  const clickRate = stats && stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : '0.0';
  const convRate = stats && stats.clicked > 0 ? ((stats.converted / stats.clicked) * 100).toFixed(1) : '0.0';

  return (
    <LayoutWrapper>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-7 pb-8 text-[var(--text-primary)]">

        {/* Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Performance Reports</h1>
            <p className="text-zinc-500 text-sm mt-1">Detailed charts and AI analysis of how your sent messages are performing.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary self-start sm:self-auto py-2.5 px-4 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : kpiCards.map((k, i) => {
                const Icon = k.icon;
                return (
                  <motion.div
                    key={i}
                    whileHover={{ y: -3 }}
                    className={`card border ${k.bg} text-center p-4`}
                  >
                    <Icon className={`w-5 h-5 ${k.color} mx-auto mb-2`} />
                    <p className="text-2xl font-black text-[var(--text-primary)]">{k.value}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">{k.label}</p>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* Rate Cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Read Rate',  value: `${openRate}%`,  desc: 'Sent → Read',   color: 'text-emerald-650' },
            { label: 'Link Click Rate', value: `${clickRate}%`, desc: 'Read → Clicked Link', color: 'text-amber-600' },
            { label: 'Action Completion Rate', value: `${convRate}%`,  desc: 'Clicked Link → Action Completed', color: 'text-pink-600' },
          ].map((r, i) => (
            <div key={i} className="card glass text-center border border-[var(--border)] shadow-sm">
              <p className={`text-3xl font-black ${r.color}`}>{r.value}</p>
              <p className="text-xs font-bold text-zinc-550 mt-1">{r.label}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Daily Performance */}
          <motion.div variants={item} className="card glass border border-[var(--border)] shadow-sm">
            <h3 className="font-bold text-[var(--text-primary)] text-sm mb-5">Daily message activity over 7 days</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.daily_performance || []} margin={{ left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="openG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clickG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, color: '#0f172a' }} cursor={{ stroke: 'rgba(0,0,0,0.04)' }} />
                  <Area type="monotone" dataKey="sent"    name="Sent"    stroke="#4f46e5" strokeWidth={2.5} fill="url(#sentG)"  dot={false} />
                  <Area type="monotone" dataKey="opened"  name="Read"  stroke="#0ea5e9" strokeWidth={2.5} fill="url(#openG)"  dot={false} />
                  <Area type="monotone" dataKey="clicked" name="Clicked Link" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#clickG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Channel Comparison */}
          <motion.div variants={item} className="card glass border border-[var(--border)] shadow-sm">
            <h3 className="font-bold text-[var(--text-primary)] text-sm mb-5">Channel Comparison</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.channel_comparison || []} margin={{ left: -22, bottom: 0 }} barSize={16} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" vertical={false} />
                  <XAxis dataKey="channel" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, color: '#0f172a' }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
                  <Bar dataKey="sent"    name="Sent"    fill="#4f46e5" radius={[4,4,0,0]} />
                  <Bar dataKey="opened"  name="Read"  fill="#0ea5e9" radius={[4,4,0,0]} />
                  <Bar dataKey="clicked" name="Clicked Link" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* AI Summary + Realtime Events */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* AI Summary */}
          <motion.div variants={item} className="card glass glass-glow border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
              <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                <Sparkles className="w-4 h-4 text-violet-650" />
              </div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">AI Performance Report</h3>
              {summaryLoading && <div className="w-3 h-3 rounded-full border border-indigo-600 border-t-transparent animate-spin ml-auto" />}
            </div>
            {summaryLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card h-16" />)}
              </div>
            ) : summary ? (
              <div className="space-y-3">
                {[
                  { key: 'worked',      label: 'Success Points',  icon: CheckCircle, color: 'text-emerald-650', bg: 'bg-emerald-50 border-emerald-100' },
                  { key: 'failed',      label: 'Areas to Improve',icon: AlertTriangle,color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100'   },
                  { key: 'next_action', label: 'AI Suggestions',  icon: Lightbulb,   color: 'text-indigo-650', bg: 'bg-indigo-50 border-indigo-100'  },
                ].map(({ key, label, icon: Icon, color, bg }) => (
                  <div key={key} className={`p-4 rounded-2xl border ${bg} flex gap-3.5`}>
                    <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${color} mb-1`}>{label}</p>
                      <p className="text-xs text-zinc-600 leading-normal">{summary[key]}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-6">AI report details are currently loading.</p>
            )}
          </motion.div>

          {/* Realtime Events */}
          <motion.div variants={item} className="card glass-darker flex flex-col border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Live Event Feed</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-updating every 15 seconds
              </div>
            </div>

            {eventsLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center py-1">
                    <div className="skeleton w-14 h-4 rounded" />
                    <div className="skeleton w-16 h-4 rounded-full" />
                    <div className="skeleton flex-1 h-4 rounded" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-xs text-zinc-500 text-center">No outreach events generated yet.<br />Trigger a message campaign to see live updates.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-1.5 overflow-y-auto scroll-area max-h-72 font-mono text-[10.5px]">
                {events.map((ev: any, i: number) => (
                  <motion.div
                    key={ev.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="flex items-center gap-2.5 py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-zinc-500 shrink-0 flex items-center gap-1 font-semibold">
                      <Clock className="w-2.5 h-2.5 text-zinc-400" />
                      {formatTime(ev.created_at)}
                    </span>
                    <span className={`badge text-[9px] shrink-0 ${EVENT_BADGES[ev.event_type] || 'bg-zinc-100 text-zinc-500'}`}>
                      {EVENT_TRANSLATIONS[ev.event_type] || ev.event_type}
                    </span>
                    <span className="text-zinc-650 truncate">
                      {ev.recipient_name || ev.recipient_email} · {ev.subject || ev.channel}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

      </motion.div>
    </LayoutWrapper>
  );
}
