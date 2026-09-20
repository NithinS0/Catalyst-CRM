'use client';

import { useState, useEffect } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import { Company, SuperMetricsResponse, RecentActivityItem } from '@/services/super_admin';
import {
  Building, Users, Megaphone, HardDrive, Sparkles, Plus, Search,
  Power, Ban, Trash2, Shield, Play, AlertCircle, Check, Loader2,
  Calendar, Layers, TrendingUp, DollarSign, Activity, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';

export default function SuperAdminPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [metricsData, setMetricsData] = useState<SuperMetricsResponse | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  
  // Loading states
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  
  // UI operations
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingCompany, setSubmittingCompany] = useState(false);

  // Form State
  const [compName, setCompName] = useState('');
  const [compSlug, setCompSlug] = useState('');
  const [compIndustry, setCompIndustry] = useState('Technology');
  const [compPlan, setCompPlan] = useState('free');
  const [compColor, setCompColor] = useState('#4f46e5');
  const [compLogo, setCompLogo] = useState('');

  // Active override company
  const [activeOverride, setActiveOverride] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      setLoadingMetrics(true);
      const metrics = await api.superGetMetrics();
      setMetricsData(metrics);
    } catch (err: any) {
      console.error('Failed to load metrics', err);
      setError('Failed to fetch system metrics.');
    } finally {
      setLoadingMetrics(false);
    }

    try {
      setLoadingCompanies(true);
      const comps = await api.superGetCompanies();
      setCompanies(comps);
    } catch (err: any) {
      console.error('Failed to load companies', err);
      setError(prev => prev ? prev + ' Failed to load companies.' : 'Failed to load companies.');
    } finally {
      setLoadingCompanies(false);
    }

    try {
      setLoadingActivity(true);
      const acts = await api.superGetActivity();
      setActivity(acts);
    } catch (err: any) {
      console.error('Failed to load activity', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setActiveOverride(localStorage.getItem('catalyst_override_company'));
    }
    loadData();
  }, []);

  const handleSwitchCompany = (companyId: string, name: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('catalyst_override_company', companyId);
      localStorage.setItem('catalyst_override_company_name', name);
      window.location.reload();
    }
  };

  const handleExitImpersonation = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('catalyst_override_company');
      localStorage.removeItem('catalyst_override_company_name');
      window.location.reload();
    }
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = company.status === 'suspended' ? 'active' : 'suspended';
    setError(null);
    setSuccess(null);
    try {
      await api.superUpdateStatus(company.id, newStatus);
      setSuccess(`Company '${company.name}' is now ${newStatus}.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update company status.');
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    if (!confirm(`CAUTION: Are you absolutely sure you want to permanently delete company '${company.name}'? This will purge all associated users, customers, and campaign records immediately. This action CANNOT be undone.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await api.superDeleteCompany(company.id);
      setSuccess(`Company '${company.name}' and all associated records have been permanently deleted.`);
      
      // If we deleted the active override workspace, exit impersonation
      if (activeOverride === company.id) {
        localStorage.removeItem('catalyst_override_company');
        localStorage.removeItem('catalyst_override_company_name');
        window.location.reload();
      } else {
        loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete company.');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCompany(true);
    setError(null);
    setSuccess(null);
    try {
      await api.superCreateCompany({
        name: compName,
        slug: compSlug || undefined,
        industry: compIndustry,
        plan: compPlan,
        primary_color: compColor,
        logo_url: compLogo || undefined
      });
      setSuccess(`Company workspace '${compName}' created successfully.`);
      setShowCreateModal(false);
      setCompName('');
      setCompSlug('');
      setCompLogo('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create company.');
    } finally {
      setSubmittingCompany(false);
    }
  };

  // Filter companies list
  const filteredCompanies = companies.filter(c => {
    const searchLower = filterSearch.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(searchLower) || c.slug.toLowerCase().includes(searchLower) || (c.industry || '').toLowerCase().includes(searchLower);
    const matchPlan = filterPlan === 'all' || c.plan.toLowerCase() === filterPlan.toLowerCase();
    const matchStatus = filterStatus === 'all' || c.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchPlan && matchStatus;
  });

  // Recharts Simulated Data based on active companies counts
  const planData = [
    { name: 'Free Trial', value: companies.filter(c => c.plan === 'free').length, color: '#f59e0b' },
    { name: 'Pro Plan', value: companies.filter(c => c.plan === 'pro').length, color: '#0ea5e9' },
    { name: 'Enterprise', value: companies.filter(c => c.plan === 'enterprise').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const costHistoryData = [
    { name: 'Jan', requests: 4500, tokens: 9.8, cost: 19.6 },
    { name: 'Feb', requests: 5200, tokens: 11.4, cost: 22.8 },
    { name: 'Mar', requests: 7800, tokens: 17.2, cost: 34.4 },
    { name: 'Apr', requests: 9200, tokens: 20.2, cost: 40.4 },
    { name: 'May', requests: 12400, tokens: 27.3, cost: 54.6 },
    { name: 'Jun', requests: metricsData?.ai_usage.llm_requests || 15200, tokens: (metricsData?.ai_usage.tokens_consumed || 33400000) / 1000000, cost: metricsData?.ai_usage.cost_estimation || 66.8 },
  ];

  const getPlanBadge = (plan: string) => {
    const p = (plan || '').toLowerCase();
    if (p === 'enterprise') return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (p === 'pro') return 'bg-sky-100 text-sky-800 border border-sky-200';
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    return 'bg-rose-100 text-rose-800 border border-rose-200';
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6 pb-12 w-full text-[var(--text-primary)]">
        
        {/* Active Impersonation Warning Banner */}
        {activeOverride && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-800">Workspace Context Override Active</h3>
                <p className="text-xs text-amber-600">You are currently simulated in the workspace context. Global super admin query bypass is disabled.</p>
              </div>
            </div>
            <button
              onClick={handleExitImpersonation}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer text-center"
            >
              Exit Simulation & Restore Global View
            </button>
          </div>
        )}

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Super Admin Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Global platform metrics, tenant workspace directories, storage sizes, and AI billing metrics.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto btn btn-primary py-2.5 px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Provision Workspace
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-655 text-xs font-semibold p-4 rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 text-emerald-600 text-xs font-semibold p-4 rounded-xl border border-emerald-100 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Tenants', value: loadingMetrics ? null : metricsData?.metrics.total_companies, icon: Building, color: 'text-purple-650 bg-purple-50 border-purple-100' },
            { label: 'Active Tenants', value: loadingMetrics ? null : metricsData?.metrics.active_companies, icon: Play, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'Platform Users', value: loadingMetrics ? null : metricsData?.metrics.total_users, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            { label: 'Total Customers', value: loadingMetrics ? null : metricsData?.metrics.total_customers, icon: Users, color: 'text-sky-600 bg-sky-50 border-sky-100' },
            { label: 'Total Campaigns', value: loadingMetrics ? null : metricsData?.metrics.total_campaigns, icon: Megaphone, color: 'text-pink-650 bg-pink-50 border-pink-100' },
            { label: 'Messages Sent', value: loadingMetrics ? null : metricsData?.metrics.total_messages, icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="card glass border border-[var(--border)] p-4 flex flex-col justify-between h-28 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{card.label}</span>
                  <div className={`p-1.5 rounded-lg border ${card.color} shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                {card.value === null ? (
                  <div className="h-6 w-16 bg-zinc-100 animate-pulse rounded-md" />
                ) : (
                  <p className="text-2xl font-black text-zinc-800 leading-none">{card.value}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Analytics & Cost Metrics (Charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recharts AI Cost Area Chart */}
          <div className="lg:col-span-2 card glass border border-[var(--border)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  AI Request Usage & Billing Cost
                </h2>
                <p className="text-[11px] text-zinc-400">Total API request load and cost estimation trend over the past 6 months.</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-indigo-600">
                  ${loadingMetrics ? '...' : metricsData?.ai_usage.cost_estimation} Est.
                </p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">This Month</p>
              </div>
            </div>
            <div className="h-64">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="cost" name="Estimated Cost ($)" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCost)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Storage Gauges & Plan Distribution */}
          <div className="card glass border border-[var(--border)] p-6 space-y-6 flex flex-col justify-between">
            {/* Storage Progress bars */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-purple-500" />
                Storage Utilization
              </h2>
              
              <div className="space-y-4 py-2">
                {/* Database Storage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-650">PostgreSQL Relational DB</span>
                    <span className="text-zinc-800">
                      {loadingMetrics ? '...' : metricsData?.storage.database_usage_mb} MB / {loadingMetrics ? '...' : metricsData?.storage.total_limit_mb} MB
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className="bg-indigo-650 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${loadingMetrics ? 0 : ((metricsData?.storage.database_usage_mb || 0) / (metricsData?.storage.total_limit_mb || 500)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Vector Embeddings Storage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-650">pgvector Embedding Tables</span>
                    <span className="text-zinc-800">
                      {loadingMetrics ? '...' : metricsData?.storage.vector_usage_mb} MB / {loadingMetrics ? '...' : metricsData?.storage.total_limit_mb} MB
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${loadingMetrics ? 0 : ((metricsData?.storage.vector_usage_mb || 0) / (metricsData?.storage.total_limit_mb || 500)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Plan Distribution */}
            <div className="border-t border-[var(--border)] pt-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tenant Subscription Distribution</h3>
              <div className="h-28 flex items-center justify-center">
                {isMounted && planData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" fontSize={10} stroke="#a1a1aa" tickLine={false} />
                      <YAxis dataKey="name" type="category" fontSize={10} stroke="#a1a1aa" tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                        {planData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-zinc-400">Loading plan ratios...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Directories & Logs (Tables) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Company management Directory table */}
          <div className="lg:col-span-2 card glass border border-[var(--border)] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Tenant Workspace Directory</h2>
                <p className="text-xs text-zinc-400">Audit company billing tiers, toggle workspace contexts, or suspend active status.</p>
              </div>
            </div>

            {/* Quick Filters toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5F6878] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by company name, slug, or industry..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 pl-10 pr-4 text-xs text-[#1E222B] placeholder-[#5F6878] focus:outline-none transition-colors"
                  style={{ caretColor: '#0B85FC' }}
                />
              </div>

              {/* Plan dropdown */}
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 px-3.5 text-xs font-semibold text-[#1E222B] focus:outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Billing Plans</option>
                <option value="free">Free Trial</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise</option>
              </select>

              {/* Status dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 px-3.5 text-xs font-semibold text-[#1E222B] focus:outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Table */}
            {loadingCompanies ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 border border-[var(--border)] border-dashed rounded-2xl">
                <Building className="w-8 h-8 text-zinc-350 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-500">No company workspaces matches these filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-zinc-550 border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Workspace Identity</th>
                      <th className="pb-3 pr-4">Metrics</th>
                      <th className="pb-3 pr-4">Subscription</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((comp) => {
                      const isOverrideActive = activeOverride === comp.id;
                      return (
                        <tr key={comp.id} className={`border-b border-[var(--border)]/45 hover:bg-zinc-50/40 ${isOverrideActive ? 'bg-amber-50/20' : ''}`}>
                          {/* Identity */}
                          <td className="py-4 pr-4 font-semibold text-zinc-800">
                            <div className="flex items-center gap-3">
                              {comp.logo_url ? (
                                <img src={comp.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain border border-[var(--border)] bg-zinc-50 shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-[var(--border)] flex items-center justify-center text-zinc-400 font-black shrink-0 uppercase">
                                  {comp.name.slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-zinc-900 leading-tight">{comp.name}</p>
                                <p className="text-[10px] text-zinc-400 font-mono mt-0.5 leading-none">slug: {comp.slug}</p>
                              </div>
                            </div>
                          </td>

                          {/* Stats */}
                          <td className="py-4 pr-4">
                            <div className="space-y-0.5 text-zinc-500">
                              <p className="font-bold"><span className="text-zinc-800">{comp.users_count}</span> Users</p>
                              <p><span className="text-zinc-800">{comp.customers_count}</span> Customers</p>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-4 pr-4">
                            <span className={`badge text-[9.5px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${getPlanBadge(comp.plan)}`}>
                              {comp.plan}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 pr-4">
                            <span className={`badge text-[9.5px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${getStatusBadge(comp.status)}`}>
                              {comp.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Impersonate switch workspace */}
                              {isOverrideActive ? (
                                <button
                                  onClick={handleExitImpersonation}
                                  className="py-1.5 px-2.5 rounded-lg text-[10px] font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                                  title="Stop Simulation"
                                >
                                  Active Simulation
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSwitchCompany(comp.id, comp.name)}
                                  className="py-1.5 px-2.5 rounded-lg text-[10px] font-extrabold border border-zinc-250 text-zinc-650 hover:bg-zinc-50 flex items-center gap-1 cursor-pointer"
                                  title="Enter Workspace Context"
                                >
                                  Enter Workspace
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}

                              {/* Toggle Active/Suspend */}
                              <button
                                onClick={() => handleToggleStatus(comp)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  comp.status === 'suspended'
                                    ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                                    : 'border-rose-100 text-rose-500 hover:bg-rose-50'
                                }`}
                                title={comp.status === 'suspended' ? 'Activate Company' : 'Suspend Company'}
                              >
                                {comp.status === 'suspended' ? <Power className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteCompany(comp)}
                                className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Purge Workspace Records"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Log Feed */}
          <div className="card glass border border-[var(--border)] p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-indigo-500" />
                Live System activity feed
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Real-time audit log of company registrations, dispatches, and agent activities.</p>
            </div>

            {loadingActivity ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1 mt-1">
                      <div className="skeleton h-3 w-3/4 rounded" />
                      <div className="skeleton h-2 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-12">No recent system events logged.</p>
            ) : (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {activity.map((item) => {
                  let badgeColor = 'bg-zinc-50 border-zinc-200 text-zinc-500';
                  if (item.level === 'success') badgeColor = 'bg-emerald-50 border-emerald-100 text-emerald-600';
                  if (item.level === 'warning') badgeColor = 'bg-amber-50 border-amber-100 text-amber-600';
                  if (item.level === 'error') badgeColor = 'bg-rose-50 border-rose-100 text-rose-600';

                  return (
                    <div key={item.id} className="flex gap-3 text-xs leading-normal">
                      {/* Left icon circle */}
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 font-bold ${badgeColor}`}>
                        {item.type === 'company_created' ? <Building className="w-3.5 h-3.5" /> : item.type === 'campaign_created' ? <Megaphone className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-800 break-words leading-tight">{item.title}</p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1 leading-none">
                          <span className="truncate max-w-[120px]" title={item.company_name}>🏢 {item.company_name}</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provision Workspace Modal Dialog */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Provision Enterprise Workspace</h3>
                <p className="text-[11px] text-zinc-450 mt-0.5">Define tenant identifiers, billing limits, and primary branding layouts.</p>
              </div>

              <form onSubmit={handleCreateCompany} className="space-y-4">
                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1E222B] uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stark CRM Tenant"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 px-3 text-xs text-[#1E222B] placeholder-[#5F6878] focus:outline-none transition-colors"
                    style={{ caretColor: '#0B85FC' }}
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[#1E222B] uppercase tracking-wider">Custom slug</label>
                    <span className="text-[9px] text-[#5F6878]">(optional, auto-generated if empty)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. stark"
                    value={compSlug}
                    onChange={(e) => setCompSlug(e.target.value)}
                    className="w-full bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 px-3 text-xs text-[#1E222B] placeholder-[#5F6878] focus:outline-none transition-colors"
                    style={{ caretColor: '#0B85FC' }}
                  />
                </div>

                {/* Industry & Plan in Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Industry */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#1E222B] uppercase tracking-wider">Industry</label>
                    <select
                      value={compIndustry}
                      onChange={(e) => setCompIndustry(e.target.value)}
                      className="w-full bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 px-3 text-xs text-[#1E222B] focus:outline-none cursor-pointer transition-colors"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Defense">Defense</option>
                      <option value="Retail">Retail</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>

                  {/* Plan */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#1E222B] uppercase tracking-wider">Billing Tier</label>
                    <select
                      value={compPlan}
                      onChange={(e) => setCompPlan(e.target.value)}
                      className="w-full bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 px-3 text-xs text-[#1E222B] focus:outline-none cursor-pointer transition-colors"
                    >
                      <option value="free">Free Trial</option>
                      <option value="pro">Pro Plan</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                {/* Color Theme Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1E222B] uppercase tracking-wider">Primary Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={compColor}
                      onChange={(e) => setCompColor(e.target.value)}
                      className="w-8 h-8 border-0 p-0 cursor-pointer rounded-xl bg-transparent select-none shrink-0"
                    />
                    <div className="flex flex-wrap gap-1">
                      {['#4f46e5', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCompColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                            compColor === c ? 'border-zinc-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logo URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1E222B] uppercase tracking-wider">Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={compLogo}
                    onChange={(e) => setCompLogo(e.target.value)}
                    className="w-full bg-white border border-[#DDE2EA] focus:border-[#0B85FC] rounded-xl py-2 px-3 text-xs text-[#1E222B] placeholder-[#5F6878] focus:outline-none transition-colors"
                    style={{ caretColor: '#0B85FC' }}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="py-2 px-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-650 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCompany}
                    className="py-2 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingCompany ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Create Workspace
                      </>
                    )}
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
