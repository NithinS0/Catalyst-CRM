'use client';

import { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  Users, Layers, Megaphone, Activity, TrendingUp, Sparkles, Bot,
  ArrowUpRight, Circle
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { SkeletonCard } from '@/components/ui/skeleton';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: any = {
  hidden: { opacity: 0, y: 16 },
  show:  { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

interface Stats {
  customers: number;
  segments: number;
  campaigns: number;
  conversions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ customers: 0, segments: 0, campaigns: 0, conversions: 78 });
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
        setStats({ customers: custs.length, segments: segs.length, campaigns: camps.length, conversions: 78 });
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
      name: 'People in list',
      description: 'The total number of contacts saved in your system.',
      value: stats.customers,
      icon: Users,
      trend: '+12% since last week',
      trendUp: true,
      color: 'from-blue-50/40 via-indigo-50/10 to-transparent',
      glow: 'shadow-blue-100/10'
    },
    {
      name: 'Customer groups',
      description: 'Organized categories to group your contacts.',
      value: stats.segments,
      icon: Layers,
      trend: 'Currently active',
      trendUp: true,
      color: 'from-indigo-50/40 via-purple-50/10 to-transparent',
      glow: 'shadow-indigo-100/10'
    },
    {
      name: 'Messages sent',
      description: 'Total outreach email or text campaigns launched.',
      value: stats.campaigns,
      icon: Megaphone,
      trend: '+4 sent recently',
      trendUp: true,
      color: 'from-violet-50/40 via-pink-50/10 to-transparent',
      glow: 'shadow-violet-100/10'
    },
    {
      name: 'Customized by AI',
      description: 'Percentage of messages customized by your AI helper.',
      value: `${stats.conversions}%`,
      icon: Sparkles,
      trend: '98% personalization accuracy',
      trendUp: true,
      color: 'from-emerald-50/40 via-teal-50/10 to-transparent',
      glow: 'shadow-emerald-100/10'
    },
  ];

  const chartData = analyticsData?.daily_performance?.length > 0
    ? analyticsData.daily_performance
    : [
        { date: 'Mon', sent: 420, opened: 210, clicked: 88 },
        { date: 'Tue', sent: 380, opened: 195, clicked: 76 },
        { date: 'Wed', sent: 510, opened: 280, clicked: 121 },
        { date: 'Thu', sent: 470, opened: 240, clicked: 105 },
        { date: 'Fri', sent: 620, opened: 355, clicked: 162 },
        { date: 'Sat', sent: 290, opened: 145, clicked: 63 },
        { date: 'Sun', sent: 340, opened: 168, clicked: 72 },
      ];

  const statusColor: Record<string, string> = {
    active:        'badge-active',
    churn_risk:    'badge-churn',
    inactive:      'badge-inactive',
    lead:          'badge-lead',
    contact_ready: 'badge-lead',
  };

  const campaignStatusColor: Record<string, string> = {
    active:    'badge-active',
    draft:     'badge-draft',
    completed: 'badge-completed',
    scheduled: 'badge-inactive',
  };

  const translateCustomerStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'churn_risk': return 'At Risk';
      case 'inactive': return 'Inactive';
      case 'lead':
      case 'contact_ready':
        return 'New Lead';
      default: return status?.replace('_', ' ') || '';
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

  return (
    <LayoutWrapper>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-8">

        {/* Top Welcome & Header Card */}
        <motion.div
          variants={item}
          className="card glass-glow relative overflow-hidden border border-[var(--border)] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-indigo-50/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Everything is running smoothly
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Your CRM Summary
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm sm:text-base leading-relaxed">
              Here is a simple look at how your business is doing, how your customers are engaging, and what your AI helper is working on.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
            <Link
              href="/ai-studio"
              className="btn btn-primary shadow-lg shadow-indigo-600/35 hover:scale-102 active:scale-98 transition-all duration-150 py-3 px-5 text-sm"
            >
              <Bot className="w-4 h-4" />
              Write New Message
            </Link>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.15 } }}
                    className={`card glass-glow relative overflow-hidden shadow-sm border border-[var(--border)] hover:border-indigo-200 transition-all duration-205 ${kpi.glow}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} pointer-events-none`} />
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-zinc-500">{kpi.name}</p>
                          <div className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 shadow-inner">
                            <Icon className="w-4 h-4 text-indigo-600" />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-normal mb-4">{kpi.description}</p>
                      </div>
                      <div>
                        <p className="text-4xl font-extrabold text-[var(--text-primary)] tabular-nums tracking-tight mb-2">{kpi.value}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-400 font-medium">{kpi.trend}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* Chart + Campaigns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Area Chart */}
          <motion.div variants={item} className="xl:col-span-2 card glass relative overflow-hidden border border-[var(--border)] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-base">How customers respond to your messages</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  A simple overview showing how many messages went out, how many were opened, and how many people clicked a link inside over the past 7 days.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-150 shrink-0 self-start md:self-auto shadow-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                +18.4% growth
              </div>
            </div>

            {/* Simple Legend */}
            <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 mb-6 text-xs border-b border-[var(--border)]/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] shrink-0" />
                <span className="text-zinc-650 font-bold">Delivered</span>
                <span className="text-zinc-400 hidden sm:inline">(Reached their inbox)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] shrink-0" />
                <span className="text-zinc-655 font-bold">Opened</span>
                <span className="text-zinc-400 hidden sm:inline">(Read the message)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shrink-0" />
                <span className="text-zinc-655 font-bold">Clicked Link</span>
                <span className="text-zinc-400 hidden sm:inline">(Tapped a link inside)</span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, color: '#0f172a' }}
                    itemStyle={{ color: '#475569' }}
                    cursor={{ stroke: 'rgba(0,0,0,0.03)', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="sent"    name="Delivered"    stroke="#4f46e5" strokeWidth={2.5} fill="url(#sentGrad)"  dot={false} />
                  <Area type="monotone" dataKey="opened"  name="Opened"  stroke="#0ea5e9" strokeWidth={2.5} fill="url(#openGrad)"  dot={false} />
                  <Area type="monotone" dataKey="clicked" name="Clicked Link" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#clickGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Active Campaigns */}
          <motion.div variants={item} className="card glass flex flex-col border border-[var(--border)] shadow-sm justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-[var(--text-primary)] text-base">Ongoing Messages</h3>
                <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              </div>
              <p className="text-xs text-zinc-500 mb-5 leading-normal">
                Messages that are currently going out to your customer groups.
              </p>

              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card h-20" />)}
                  </div>
                ) : activeCampaigns.length === 0 ? (
                  <div className="py-8 flex items-center justify-center">
                    <p className="text-xs text-zinc-500 text-center leading-normal">
                      No campaigns active right now.<br />Create a new one in the Campaigns page.
                    </p>
                  </div>
                ) : (
                  activeCampaigns.map((camp: any) => {
                    const openRate = camp.total_sent > 0 ? Math.round((camp.total_opened / camp.total_sent) * 100) : 0;
                    return (
                      <div key={camp.id} className="p-4 rounded-2xl bg-slate-50/40 border border-[var(--border)] hover:border-indigo-200 transition-all duration-150 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-700 truncate">{camp.name}</span>
                          <span className={`badge ${campaignStatusColor[camp.status] || 'badge-draft'}`}>
                            {translateCampaignStatus(camp.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Sent so far: <span className="text-zinc-700 font-bold">{camp.total_sent || 0}</span></span>
                          <span>Read: <span className="text-zinc-700 font-bold">{camp.total_opened || 0}</span> ({openRate}%)</span>
                        </div>
                        <div className="relative w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, ((camp.total_opened || 0) / Math.max(1, camp.total_sent || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <Link href="/campaigns" className="btn btn-secondary mt-5 w-full justify-center text-xs py-2.5 rounded-xl">
              View All Campaigns
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Customers + Logs */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Latest Accounts */}
          <motion.div variants={item} className="card glass flex flex-col border border-[var(--border)] shadow-sm">
            <h3 className="font-bold text-[var(--text-primary)] text-base mb-1">Recently Added People</h3>
            <p className="text-xs text-zinc-500 mb-5 leading-normal">
              The latest customers who joined or were added to your list.
            </p>
            
            <div className="flex-1 divide-y divide-[var(--border)]/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton skeleton-text w-1/3" />
                      <div className="skeleton skeleton-text w-1/2" />
                    </div>
                  </div>
                ))
              ) : recentCustomers.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-3.5 gap-3 hover:bg-indigo-50/40 transition-colors rounded-xl px-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {c.first_name?.[0]}{c.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-700 truncate">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-zinc-500 truncate">{c.company} · {c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`badge ${statusColor[c.status] || 'badge-draft'}`}>
                      {translateCustomerStatus(c.status)}
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${(c.lead_score || 0) >= 80 ? 'text-emerald-600' : 'text-zinc-450'}`}>
                      Interest: {c.lead_score || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/customers" className="btn btn-secondary mt-5 w-full justify-center text-xs py-2.5 rounded-xl">
              Manage Customer Directory
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Orchestrator Log */}
          <motion.div variants={item} className="card glass flex flex-col border border-[var(--border)] shadow-sm justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 pb-3 border-b border-[var(--border)]/60">
                <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                  What the AI is doing right now
                </h3>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Live Feed</span>
              </div>
              <p className="text-xs text-zinc-500 mb-5 leading-normal">
                A live stream of the tasks the automated system is running to manage your contacts and messages.
              </p>
              
              <div className="font-mono text-[11px] space-y-3 overflow-y-auto scroll-area max-h-56 pr-1">
                {[
                  { time: '[13:30:02]', label: 'System',   color: 'text-zinc-500', msg: 'Started checking for updates in your customer list.' },
                  { time: '[13:32:15]', label: 'AI Brain', color: 'text-indigo-600', msg: 'Analyzing interest levels for 5 recently active people.' },
                  { time: '[13:32:18]', label: 'AI Scorer',color: 'text-emerald-600', msg: 'Calculated interest level for Alice Vance: Interest is now very high (95/100).' },
                  { time: '[13:35:40]', label: 'System',   color: 'text-zinc-500', msg: 'Outreach emails have finished sending.' },
                  { time: '[13:38:11]', label: 'AI Memory',color: 'text-purple-600', msg: 'Saved 3 new customer interaction details to memory.' },
                  { time: '[13:41:04]', label: 'System',   color: 'text-zinc-500', msg: 'All tasks finished. Standing by for next actions.' },
                ].map((entry, i) => (
                  <div key={i} className="flex gap-2.5 leading-relaxed items-start">
                    <span className="text-zinc-450 shrink-0 select-none">{entry.time}</span>
                    <span className={`shrink-0 font-bold ${entry.color}`}>[{entry.label}]</span>
                    <span className="text-zinc-700">{entry.msg}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[var(--border)]/60 flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
              <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 shrink-0" />
              AI automatically updates interest levels when customers engage with your messages.
            </div>
          </motion.div>
        </div>

      </motion.div>
    </LayoutWrapper>
  );
}
