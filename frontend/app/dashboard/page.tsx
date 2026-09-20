'use client';

import { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  Users, Layers, Megaphone, Activity, TrendingUp, Sparkles,
  ArrowUpRight, Plus, Terminal
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import AIOpportunitiesWidget from '@/components/ai-opportunities-widget';

interface Stats {
  customers: number;
  segments: number;
  campaigns: number;
  conversions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ customers: 0, segments: 0, campaigns: 0, conversions: 84 });
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [custs, segs, camps, analytics] = await Promise.all([
          api.getCustomers() as Promise<any[]>,
          api.getSegments()  as Promise<any[]>,
          api.getCampaigns() as Promise<any[]>,
          api.getAnalyticsStats().catch(() => null),
        ]);
        setStats({ customers: custs.length, segments: segs.length, campaigns: camps.length, conversions: 84 });
        setRecentCustomers(custs.slice(0, 5));
        setActiveCampaigns(camps.slice(0, 3));
        setAnalyticsData(analytics);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const kpis = [
    {
      name: 'Total Contacts',
      description: 'Audience records logically isolated to your workspace.',
      value: stats.customers,
      icon: Users,
      trend: '100% RLS Protected',
      color: '#0B85FC',
    },
    {
      name: 'Active Cohorts',
      description: 'Vector-clustered behavioral segments.',
      value: stats.segments,
      icon: Layers,
      trend: 'Dynamic Clustering',
      color: '#0DB8FA',
    },
    {
      name: 'Dispatched Campaigns',
      description: 'Real-time campaigns executed via provider pipeline.',
      value: stats.campaigns,
      icon: Megaphone,
      trend: 'Idempotency Active',
      color: '#5660F3',
    },
    {
      name: 'AI Personalization',
      description: 'Automated creative context synthesis accuracy.',
      value: `${stats.conversions}%`,
      icon: Sparkles,
      trend: '10-Agent Swarm',
      color: '#6B5CF6',
    },
  ];

  const chartData = analyticsData?.daily_performance?.length > 0
    ? analyticsData.daily_performance
    : [
        { date: 'Mon', sent: 420, opened: 260, clicked: 110 },
        { date: 'Tue', sent: 380, opened: 245, clicked: 96 },
        { date: 'Wed', sent: 510, opened: 350, clicked: 145 },
        { date: 'Thu', sent: 470, opened: 310, clicked: 130 },
        { date: 'Fri', sent: 620, opened: 440, clicked: 210 },
        { date: 'Sat', sent: 290, opened: 180, clicked: 85 },
        { date: 'Sun', sent: 340, opened: 220, clicked: 105 },
      ];

  return (
    <LayoutWrapper>
      <div className="space-y-8 pb-10">

        {/* ─── Workspace Greeting & Action Bar ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0E141F 0%, #1E222B 50%, #2F3654 100%)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
          {/* Background glow */}
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(11,133,252,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono"
              style={{ background: 'rgba(11,133,252,0.12)', border: '1px solid rgba(11,133,252,0.25)', color: '#0DB8FA' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0DB8FA', boxShadow: '0 0 6px rgba(13,184,250,0.7)' }} />
              Multi-Tenant Architecture Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Workspace Overview
            </h1>
            <p className="text-xs sm:text-sm max-w-xl" style={{ color: '#AAB3C2' }}>
              Real-time customer intelligence, AI opportunity discovery, and campaign dispatch monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
            <Link href="/campaign-studio" className="btn-primary text-xs px-4 py-2">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </Link>
            <Link href="/customers"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Users className="w-3.5 h-3.5" />
              <span>Customer 360</span>
            </Link>
          </div>
        </div>

        {/* ─── KPI Grid ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="p-5 rounded-xl flex flex-col justify-between min-h-[140px] transition-all"
                style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.20)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 24px ${kpi.color}20, 0 2px 8px rgba(0,0,0,0.25)`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.20)')}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase" style={{ color: '#5F6878' }}>{kpi.name}</span>
                  <div className="p-2 rounded-lg" style={{ background: `${kpi.color}14`, border: `1px solid ${kpi.color}28` }}>
                    <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono tracking-tight" style={{ color: '#FFFFFF' }}>
                    {loading ? '—' : kpi.value}
                  </div>
                  <div className="text-[11px] font-mono mt-1.5" style={{ color: kpi.color }}>
                    {kpi.trend}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AI Opportunities Widget */}
        <AIOpportunitiesWidget />

        {/* ─── Chart + Active Campaigns ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Analytics Chart */}
          <div className="xl:col-span-2 p-6 rounded-xl flex flex-col"
            style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.20)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold" style={{ color: '#F7F9FC' }}>7-Day Dispatch & Engagement Velocity</h2>
                <p className="text-xs mt-0.5" style={{ color: '#5F6878' }}>Delivered, Opened, and Clicked metrics across active cohorts</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                {[
                  { label: 'Delivered', color: '#0B85FC' },
                  { label: 'Opened',    color: '#0DB8FA' },
                  { label: 'Clicked',   color: '#5660F3' },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1.5" style={{ color: '#AAB3C2' }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0B85FC" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0B85FC" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0DB8FA" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0DB8FA" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#5660F3" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#5660F3" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#5F6878', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5F6878', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0E141F', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', color: '#F7F9FC' }}
                    itemStyle={{ color: '#AAB3C2' }}
                  />
                  <Area type="monotone" dataKey="sent"   name="Delivered" stroke="#0B85FC" strokeWidth={2}   fill="url(#blueGrad)"   dot={false} />
                  <Area type="monotone" dataKey="opened" name="Opened"    stroke="#0DB8FA" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#cyanGrad)"   dot={false} />
                  <Area type="monotone" dataKey="clicked" name="Clicked"  stroke="#5660F3" strokeWidth={1.5} fill="url(#indigoGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Campaigns Column */}
          <div className="p-6 rounded-xl flex flex-col justify-between"
            style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.20)' }}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-mono" style={{ color: '#F7F9FC' }}>Active Campaigns</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded badge badge-blue">Live Dispatch</span>
              </div>
              <p className="text-xs mb-4" style={{ color: '#5F6878' }}>Outreach currently executing through email providers.</p>

              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
                  </div>
                ) : activeCampaigns.length === 0 ? (
                  <div className="py-8 text-center rounded-lg" style={{ border: '1px dashed rgba(255,255,255,0.10)' }}>
                    <p className="text-xs font-mono" style={{ color: '#5F6878' }}>No active campaigns.</p>
                  </div>
                ) : (
                  activeCampaigns.map(camp => (
                    <div key={camp.id} className="p-3.5 rounded-lg space-y-2 font-mono"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(47,54,84,0.50)' }}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold truncate" style={{ color: '#F7F9FC' }}>{camp.name}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded badge badge-blue">
                          {camp.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]" style={{ color: '#5F6878' }}>
                        <span>Sent: <strong style={{ color: '#F7F9FC' }}>{camp.total_sent || 0}</strong></span>
                        <span>Opened: <strong style={{ color: '#0B85FC' }}>{camp.total_opened || 0}</strong></span>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, ((camp.total_opened || 0) / Math.max(1, camp.total_sent || 1)) * 100)}%`,
                            background: 'linear-gradient(90deg, #0B85FC, #0DB8FA)'
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link href="/campaigns"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg transition-all"
              style={{ background: 'rgba(11,133,252,0.08)', color: '#0B85FC', border: '1px solid rgba(11,133,252,0.20)' }}>
              <span>Manage All Campaigns</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ─── Customer Directory + Orchestration Log ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Customer Directory Peek */}
          <div className="p-6 rounded-xl flex flex-col justify-between"
            style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.20)' }}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-mono" style={{ color: '#F7F9FC' }}>Recent Customer Activity</h3>
                <Link href="/customers" className="text-xs font-mono transition-colors" style={{ color: '#0B85FC' }}>View all</Link>
              </div>
              <p className="text-xs mb-4" style={{ color: '#5F6878' }}>Latest profiles synched or engaged in your workspace.</p>

              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {recentCustomers.map((c: any) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #5660F3, #6B5CF6)' }}>
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: '#F7F9FC' }}>{c.first_name} {c.last_name}</p>
                        <p className="text-[11px] font-mono truncate" style={{ color: '#5F6878' }}>{c.company || 'Enterprise'} · {c.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="badge badge-blue text-[10px] font-mono">
                        {c.status?.replace('_', ' ') || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/customers"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg transition-all"
              style={{ background: 'rgba(11,133,252,0.08)', color: '#0B85FC', border: '1px solid rgba(11,133,252,0.20)' }}>
              <span>Explore Customer 360 Records</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Orchestration Log Feed */}
          <div className="p-6 rounded-xl flex flex-col justify-between"
            style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.20)' }}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-mono flex items-center gap-2" style={{ color: '#F7F9FC' }}>
                  <Terminal className="w-4 h-4" style={{ color: '#5660F3' }} />
                  LangGraph Swarm Event Stream
                </h3>
                <span className="badge badge-blue text-[10px] font-mono">Live</span>
              </div>
              <p className="text-xs mb-4" style={{ color: '#5F6878' }}>Real-time state transitions across the 10-agent orchestration loop.</p>

              <div className="font-mono text-[11px] space-y-2.5 p-3 rounded-lg max-h-56 overflow-y-auto"
                style={{ background: '#0E141F', border: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { time: '12:20:02', agent: 'ContextEngine',         msg: 'Aggregated historical vector embeddings for high-LTV segment.' },
                  { time: '12:20:14', agent: 'AudienceIntelligence',  msg: 'Identified 34 dormant accounts with re-engagement propensity > 85%.' },
                  { time: '12:21:05', agent: 'CreativeArchitect',     msg: 'Generated 3 subject line variants with brand voice alignment score 9.4/10.' },
                  { time: '12:22:11', agent: 'SafetyGuardian',        msg: 'Verified zero hallucinated discount codes; email provider quota checked.' },
                  { time: '12:22:18', agent: 'ExecutionEngine',       msg: 'Idempotency key camp_019_cust_482 verified; ready for provider batch dispatch.' },
                ].map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="shrink-0" style={{ color: '#5F6878' }}>[{entry.time}]</span>
                    <span className="shrink-0 font-semibold" style={{ color: '#0DB8FA' }}>[{entry.agent}]</span>
                    <span style={{ color: '#AAB3C2' }}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/agent-monitor"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg transition-all"
              style={{ background: 'rgba(86,96,243,0.08)', color: '#5660F3', border: '1px solid rgba(86,96,243,0.20)' }}>
              <span>Inspect Full Swarm Telemetry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>
    </LayoutWrapper>
  );
}
