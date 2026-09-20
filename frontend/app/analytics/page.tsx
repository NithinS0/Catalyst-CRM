'use client';

import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  TrendingUp, Mail, Sparkles, ArrowUpRight, CheckCircle, DollarSign,
  AlertTriangle, Lightbulb, Radio, Clock, Layers, RefreshCw, IndianRupee,
  Activity, BarChart3
} from 'lucide-react';
import { useCurrency } from '@/context/currency-context';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

export default function AnalyticsPage() {
  const { formatCurrency, currency } = useCurrency();
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
    } catch (err) {
      console.error('Analytics stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const data = await api.getAnalyticsSummary() as any;
      setSummary(data);
    } catch (err) {
      console.error('Analytics summary error:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const data = await api.getRealtimeEvents(25) as any[];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Events error:', err);
    } finally {
      setEventsLoading(false);
    }
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
    await Promise.all([fetchStats(), fetchEvents(), fetchSummary()]);
    setRefreshing(false);
  };

  const kpiCards = stats ? [
    { label: 'Dispatched',    value: stats.sent || 0,             icon: Mail       },
    { label: 'Opened',        value: stats.opened || 0,           icon: CheckCircle },
    { label: 'Clicked',       value: stats.clicked || 0,          icon: ArrowUpRight },
    { label: 'Converted',     value: stats.converted || 0,        icon: TrendingUp  },
    { label: 'Attributed Rev',value: formatCurrency(stats.revenue || 0), icon: currency === 'INR' ? IndianRupee : DollarSign },
    { label: 'Campaigns',     value: stats.campaigns_count || 0,  icon: Layers      },
  ] : [];

  const openRate  = stats && stats.sent    > 0 ? ((stats.opened    / stats.sent)    * 100).toFixed(1) : '0.0';
  const clickRate = stats && stats.opened  > 0 ? ((stats.clicked   / stats.opened)  * 100).toFixed(1) : '0.0';
  const convRate  = stats && stats.clicked > 0 ? ((stats.converted / stats.clicked) * 100).toFixed(1) : '0.0';

  return (
    <LayoutWrapper>
      <div className="space-y-8 pb-10 font-mono">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0E141F 0%, #1E222B 50%, #2F3654 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono mb-1"
              style={{ background: 'rgba(13,184,250,0.10)', border: '1px solid rgba(13,184,250,0.22)', color: '#0DB8FA' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0DB8FA', boxShadow: '0 0 6px rgba(13,184,250,0.7)' }} />
              Live Analytics Pipeline
            </div>
            <h1 className="text-2xl font-bold text-white">Performance & Deliverability Analytics</h1>
            <p className="text-xs" style={{ color: '#AAB3C2' }}>
              End-to-end attribution, engagement velocity, and event-stream telemetry scoped to your workspace.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer self-start sm:self-auto"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#AAB3C2' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,133,252,0.10)'; e.currentTarget.style.color = '#0B85FC'; e.currentTarget.style.borderColor = 'rgba(11,133,252,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#AAB3C2'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Metrics</span>
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))
          ) : (
            kpiCards.map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={i} className="p-4 rounded-xl text-center space-y-1 transition-all"
                  style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(11,133,252,0.30)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: '#0B85FC' }} />
                  <p className="text-xl font-bold text-white">{k.value}</p>
                  <p className="text-[10px] uppercase" style={{ color: '#5F6878' }}>{k.label}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Funnel Conversion Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Open / Read Rate',       value: openRate,   sub: 'Delivered → Opened',   color: '#0B85FC' },
            { label: 'Click-Through Rate',     value: clickRate,  sub: 'Opened → Link Tapped',  color: '#0DB8FA' },
            { label: 'Action Completion Rate', value: convRate,   sub: 'Clicked → Converted',   color: '#5660F3' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="p-5 rounded-xl text-center space-y-1"
              style={{ background: '#1E222B', border: `1px solid ${color}22` }}>
              <p className="text-3xl font-bold" style={{ color }}>{value}%</p>
              <p className="text-xs font-semibold" style={{ color: '#F7F9FC' }}>{label}</p>
              <p className="text-[10px]" style={{ color: '#5F6878' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Daily Performance */}
          <div className="p-6 rounded-xl space-y-4" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">7-Day Engagement Velocity</h3>
              <span className="text-[10px] uppercase" style={{ color: '#5F6878' }}>Deliverability Curve</span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.daily_performance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueGradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0B85FC" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0B85FC" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="cyanGradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0DB8FA" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0DB8FA" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="indigoGradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#5660F3" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#5660F3" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#5F6878', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5F6878', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0E141F', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', color: '#F7F9FC' }} itemStyle={{ color: '#AAB3C2' }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', color: '#AAB3C2' }} />
                  <Area type="monotone" dataKey="sent"    name="Sent"    stroke="#0B85FC" strokeWidth={2}   fill="url(#blueGradA)"   dot={false} />
                  <Area type="monotone" dataKey="opened"  name="Opened"  stroke="#0DB8FA" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#cyanGradA)"   dot={false} />
                  <Area type="monotone" dataKey="clicked" name="Clicked" stroke="#5660F3" strokeWidth={1.5} fill="url(#indigoGradA)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Comparison */}
          <div className="p-6 rounded-xl space-y-4" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Channel Deliverability Breakdown</h3>
              <span className="text-[10px] uppercase" style={{ color: '#5F6878' }}>Distribution</span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.channel_comparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="channel" tick={{ fill: '#5F6878', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5F6878', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0E141F', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', color: '#F7F9FC' }} itemStyle={{ color: '#AAB3C2' }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', color: '#AAB3C2' }} />
                  <Bar dataKey="sent"    name="Sent"    fill="#0B85FC" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opened"  name="Opened"  fill="#0DB8FA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicked" name="Clicked" fill="#5660F3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* AI Performance Evaluation & Live Realtime Event Stream */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* AI Report */}
          <div className="p-6 rounded-xl space-y-4" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#6B5CF6' }} />
                <h3 className="text-sm font-bold text-white">AI Performance Synthesis</h3>
              </div>
              {summaryLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: '#5F6878' }} />}
            </div>

            {summaryLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
              </div>
            ) : summary ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg space-y-1" style={{ background: 'rgba(11,133,252,0.06)', border: '1px solid rgba(11,133,252,0.15)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: '#0B85FC' }}>High-Performing Vectors</p>
                  <p className="leading-relaxed" style={{ color: '#AAB3C2' }}>{summary.worked}</p>
                </div>
                <div className="p-3.5 rounded-lg space-y-1" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: '#EF4444' }}>Optimization Targets</p>
                  <p className="leading-relaxed" style={{ color: '#AAB3C2' }}>{summary.failed}</p>
                </div>
                <div className="p-3.5 rounded-lg space-y-1" style={{ background: 'rgba(86,96,243,0.08)', border: '1px solid rgba(86,96,243,0.18)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: '#5660F3' }}>Recommended Campaign Step</p>
                  <p className="leading-relaxed" style={{ color: '#AAB3C2' }}>{summary.next_action}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-center py-6" style={{ color: '#5F6878' }}>Telemetry data aggregating...</p>
            )}
          </div>

          {/* Realtime Event Stream */}
          <div className="p-6 rounded-xl space-y-4 flex flex-col justify-between" style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 animate-pulse" style={{ color: '#0DB8FA' }} />
                  <h3 className="text-sm font-bold text-white">Real-Time Dispatch Feed</h3>
                </div>
                <span className="text-[10px]" style={{ color: '#5F6878' }}>Polling active (15s)</span>
              </div>

              {eventsLoading && events.length === 0 ? (
                <div className="py-8 text-center text-xs" style={{ color: '#5F6878' }}>
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Loading realtime event feed...
                </div>
              ) : events.length === 0 ? (
                <div className="py-10 text-center text-xs" style={{ color: '#5F6878' }}>
                  No delivery events logged yet in this workspace.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pt-2">
                  {events.map((ev: any, i: number) => (
                    <div key={ev.id || i} className="p-2.5 rounded flex items-center justify-between text-[11px]"
                      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(47,54,84,0.40)' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] shrink-0" style={{ color: '#5F6878' }}>{formatTime(ev.created_at)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0"
                          style={{ background: 'rgba(13,184,250,0.12)', color: '#0DB8FA' }}>
                          {ev.event_type}
                        </span>
                        <span className="truncate" style={{ color: '#AAB3C2' }}>{ev.recipient_name || ev.recipient_email || 'Recipient'}</span>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: '#5F6878' }}>{ev.channel || 'email'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 text-[10px] text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: '#5F6878' }}>
              All events verified and mapped to workspace company_id
            </div>
          </div>

        </div>

      </div>
    </LayoutWrapper>
  );
}
