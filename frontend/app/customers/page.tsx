'use client';

import { useEffect, useState, useMemo } from 'react';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  Users, Search, Phone, Mail, Building2, Plus, Bot, Sparkles,
  ChevronRight, RefreshCw, X, Calendar, Trash2, ShieldCheck, Target,
  Table as TableIcon, Columns, Download, Edit3, Filter, CheckSquare, Square,
  ArrowUpDown, ChevronLeft, SlidersHorizontal, Eye, ArrowUpRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import DigitalTwinPanel from '@/components/digital-twin-panel';

export default function CustomersPage() {
  const { success, error: toastError } = useToast();

  // Core data states
  const [customers, setCustomers]                     = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId]   = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer]       = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen]                   = useState(false);
  const [viewMode, setViewMode]                       = useState<'table' | 'split'>('table');

  // Search, filter, sorting, pagination
  const [searchQuery, setSearchQuery]                 = useState('');
  const [statusFilter, setStatusFilter]               = useState('all');
  const [scoreFilter, setScoreFilter]                 = useState('all');
  const [sortBy, setSortBy]                           = useState<'score-desc' | 'score-asc' | 'name-asc' | 'name-desc' | 'recent'>('recent');
  const [currentPage, setCurrentPage]                 = useState(1);
  const [pageSize, setPageSize]                       = useState(15);
  const [selectedIds, setSelectedIds]                 = useState<string[]>([]);

  // Interaction / Timeline states
  const [semanticSearch, setSemanticSearch]           = useState('');
  const [showAddForm, setShowAddForm]                 = useState(false);
  const [noteType, setNoteType]                       = useState('note');
  const [noteSummary, setNoteSummary]                 = useState('');
  const [noteDetails, setNoteDetails]                 = useState('');
  const [formLoading, setFormLoading]                 = useState(false);
  const [loadingList, setLoadingList]                 = useState(true);
  const [loadingDetail, setLoadingDetail]             = useState(false);
  const [aiPrompt, setAiPrompt]                       = useState('');
  const [aiDrafting, setAiDrafting]                   = useState(false);

  // Add Contact Modal
  const [showCreateModal, setShowCreateModal]         = useState(false);
  const [saving, setSaving]                           = useState(false);
  const [newCustomer, setNewCustomer]                 = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    lead_score: 50,
  });

  // Edit Contact Modal
  const [showEditModal, setShowEditModal]             = useState(false);
  const [editingCustomer, setEditingCustomer]         = useState<any | null>(null);
  const [updating, setUpdating]                       = useState(false);

  // 1. Load All Customers
  async function loadCustomers() {
    setLoadingList(true);
    try {
      const res = await api.getCustomers() as any[];
      setCustomers(res || []);
      if (res && res.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(res[0].id);
      }
    } catch {
      toastError('Failed to load contacts');
    } finally {
      setLoadingList(false);
    }
  }

  // 2. Load Single Customer 360 Dossier
  async function loadCustomerDetails(id: string, semQuery?: string) {
    setLoadingDetail(true);
    try {
      const res = await api.getCustomer(`${id}${semQuery ? `?search_query=${encodeURIComponent(semQuery)}` : ''}`) as any;
      if (res && res.customer) {
        setSelectedCustomer(res);
      } else if (res) {
        // Fallback structure
        setSelectedCustomer({ customer: res, timeline: [], relevant_memories: [] });
      }
    } catch (e: any) {
      console.error('Failed to load customer details', e);
      // Fallback: look up in local customers list so the right pane doesn't spin forever
      const localCust = customers.find(c => c.id === id);
      if (localCust) {
        setSelectedCustomer({
          customer: localCust,
          timeline: [],
          relevant_memories: [],
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDetails(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Handle open drawer for 360 view
  const handleOpen360 = (customer: any) => {
    setSelectedCustomerId(customer.id);
    setDrawerOpen(true);
  };

  // 3. Filtered & Sorted Customer Set
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const company = (c.company || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return fullName.includes(q) || email.includes(q) || company.includes(q) || phone.includes(q);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => (c.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    // Score tier filter
    if (scoreFilter === 'high') {
      result = result.filter(c => (c.lead_score || 0) >= 70);
    } else if (scoreFilter === 'medium') {
      result = result.filter(c => (c.lead_score || 0) >= 40 && (c.lead_score || 0) < 70);
    } else if (scoreFilter === 'low') {
      result = result.filter(c => (c.lead_score || 0) < 40);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'score-desc') return (b.lead_score || 0) - (a.lead_score || 0);
      if (sortBy === 'score-asc') return (a.lead_score || 0) - (b.lead_score || 0);
      if (sortBy === 'name-asc') {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name-desc') {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
        return nameB.localeCompare(nameA);
      }
      // 'recent' by default (created_at desc)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return result;
  }, [customers, searchQuery, statusFilter, scoreFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Adjust page if out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // KPI Metrics calculation
  const stats = useMemo(() => {
    const total = customers.length;
    const leads = customers.filter(c => (c.lead_score || 0) >= 70).length;
    const active = customers.filter(c => (c.status || '').toLowerCase() === 'active').length;
    const avgScore = total > 0
      ? Math.round(customers.reduce((sum, c) => sum + (c.lead_score || 0), 0) / total)
      : 0;
    return { total, leads, active, avgScore };
  }, [customers]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedCustomers.length && paginatedCustomers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCustomers.map(c => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Semantic Search handler
  const handleSemanticSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerId) {
      loadCustomerDetails(selectedCustomerId, semanticSearch);
    }
  };

  // Add Interaction Handler
  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !noteSummary) return;
    setFormLoading(true);
    try {
      await api.addInteraction(selectedCustomerId, { type: noteType, summary: noteSummary, details: noteDetails });
      success('Interaction logged and committed to pgvector memory!');
      setNoteSummary('');
      setNoteDetails('');
      setShowAddForm(false);
      await loadCustomerDetails(selectedCustomerId);
      await loadCustomers();
    } catch (err: any) {
      toastError(err.message || 'Failed to save interaction');
    } finally {
      setFormLoading(false);
    }
  };

  // AI Draft Handler
  const handleAiDraft = async () => {
    if (!selectedCustomerId) return;
    setAiDrafting(true);
    try {
      const promptQuery = `Draft a ${noteType} message: ${aiPrompt.trim() || 'personalized executive outreach'}`;
      const res = await api.chatWithAgent(promptQuery, selectedCustomerId) as any;
      if (res && res.proposed_content) {
        const details = res.proposed_content;
        if (details.startsWith('Subject:')) {
          const parts = details.split('\n\n');
          setNoteSummary(parts[0].replace('Subject:', '').trim());
          setNoteDetails(parts.slice(1).join('\n\n').trim());
        } else {
          setNoteDetails(details);
          if (!noteSummary) setNoteSummary(`AI Drafted ${noteType}`);
        }
        success('Draft generated from customer context!');
      } else {
        toastError('Failed to generate draft: No content returned');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to draft content');
    } finally {
      setAiDrafting(false);
    }
  };

  // Create Customer Handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCustomer(newCustomer as any);
      success('Customer record added with tenant isolation!');
      setShowCreateModal(false);
      setNewCustomer({ first_name: '', last_name: '', email: '', phone: '', company: '', status: 'lead', lead_score: 50 });
      await loadCustomers();
    } catch (err: any) {
      toastError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  // Edit Customer Handler
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setUpdating(true);
    try {
      await api.updateCustomer(editingCustomer.id, {
        first_name: editingCustomer.first_name,
        last_name: editingCustomer.last_name,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        company: editingCustomer.company,
        status: editingCustomer.status,
        lead_score: Number(editingCustomer.lead_score) || 0,
      });
      success('Contact details updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      await loadCustomers();
      if (selectedCustomerId === editingCustomer.id) {
        await loadCustomerDetails(editingCustomer.id);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update contact');
    } finally {
      setUpdating(false);
    }
  };

  // Delete Customer Handler
  const handleDeleteCustomer = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete contact "${name}"? This action cannot be undone.`)) return;
    try {
      await api.deleteCustomer(id);
      success('Contact removed from workspace');
      setSelectedIds(prev => prev.filter(item => item !== id));
      if (selectedCustomerId === id) {
        setSelectedCustomerId(null);
        setSelectedCustomer(null);
        setDrawerOpen(false);
      }
      await loadCustomers();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete contact');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected contacts? This cannot be undone.`)) return;
    try {
      for (const id of selectedIds) {
        await api.deleteCustomer(id).catch(() => null);
      }
      success(`Removed ${selectedIds.length} contacts.`);
      setSelectedIds([]);
      await loadCustomers();
    } catch {
      toastError('Bulk deletion encountered an issue.');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const listToExport = selectedIds.length > 0
      ? customers.filter(c => selectedIds.includes(c.id))
      : filteredCustomers;

    if (listToExport.length === 0) {
      toastError('No contacts available to export');
      return;
    }

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Status', 'Lead Score', 'Created At'];
    const rows = listToExport.map(c => [
      `"${c.first_name || ''}"`,
      `"${c.last_name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.company || ''}"`,
      `"${c.status || ''}"`,
      c.lead_score ?? 0,
      `"${c.created_at || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalyst_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Exported ${listToExport.length} contacts to CSV.`);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
        </span>
      );
    }
    if (s === 'contact_ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Ready
        </span>
      );
    }
    if (s === 'churn_risk') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> At Risk
        </span>
      );
    }
    if (s === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Inactive
        </span>
      );
    }
    // Default 'lead'
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> Lead
      </span>
    );
  };

  // Score Bar Color
  const getScoreColor = (score: number) => {
    if (score >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
    if (score >= 40) return { bar: 'bg-[#0B85FC]', text: 'text-[#0DB8FA]' };
    return { bar: 'bg-amber-500', text: 'text-amber-400' };
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6 pb-12 text-white">

        {/* 1. Header Banner */}
        <div className="p-6 rounded-2xl border border-[#2F3654] bg-gradient-to-r from-[#1E222B] to-[#2F3654] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Customer 360 & Directory
              </h1>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0B85FC]/10 text-[#0B85FC] border border-[#0B85FC]/30">
                CRM V2
              </span>
            </div>
            <p className="text-xs text-[#AAB3C2] max-w-2xl">
              Enterprise customer directory with real-time digital twins, affinity scoring, pgvector interaction memory, and targeted autonomous interventions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#2F3654] bg-[#1E222B] hover:bg-[#2F3654] text-xs font-semibold text-[#AAB3C2] hover:text-white transition-all cursor-pointer shadow-sm"
              title="Export filtered contacts to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-bold shadow-lg shadow-[#0B85FC]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[#2F3654] bg-[#1E222B] flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#AAB3C2] uppercase tracking-wider">Total Contacts</span>
              <p className="text-2xl font-black text-white">{loadingList ? '...' : stats.total.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-400 font-medium">100% tenant isolated</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0B85FC]/10 border border-[#0B85FC]/20 flex items-center justify-center text-[#0B85FC]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#2F3654] bg-[#1E222B] flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#AAB3C2] uppercase tracking-wider">High Affinity Leads</span>
              <p className="text-2xl font-black text-white">{loadingList ? '...' : stats.leads.toLocaleString()}</p>
              <span className="text-[10px] text-[#0DB8FA] font-medium">Score &ge; 70% threshold</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#2F3654] bg-[#1E222B] flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#AAB3C2] uppercase tracking-wider">Active Customers</span>
              <p className="text-2xl font-black text-white">{loadingList ? '...' : stats.active.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-400 font-medium">Active Lifecycle Tier</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#2F3654] bg-[#1E222B] flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#AAB3C2] uppercase tracking-wider">Avg Lead Score</span>
              <p className="text-2xl font-black text-white">{loadingList ? '...' : `${stats.avgScore}%`}</p>
              <div className="w-24 bg-[#0E141F] h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-[#0B85FC] h-full rounded-full" style={{ width: `${stats.avgScore}%` }} />
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 3. Toolbar: Search, Filters, Sorters & View Switcher */}
        <div className="p-4 rounded-2xl border border-[#2F3654] bg-[#1E222B] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-md">
          {/* Left filters: Search + Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAB3C2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, company, email, or phone..."
                className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                style={{ caretColor: '#0B85FC' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAB3C2] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="lead">Leads</option>
              <option value="active">Active Customers</option>
              <option value="contact_ready">Contact Ready</option>
              <option value="churn_risk">At Risk</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Score Tier Filter */}
            <select
              value={scoreFilter}
              onChange={e => { setScoreFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors cursor-pointer"
            >
              <option value="all">All Affinity Tiers</option>
              <option value="high">High (&ge; 70%)</option>
              <option value="medium">Medium (40-69%)</option>
              <option value="low">Low (&lt; 40%)</option>
            </select>

            {/* Sorter */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors cursor-pointer"
            >
              <option value="recent">Sort: Recently Added</option>
              <option value="score-desc">Score: Highest First</option>
              <option value="score-asc">Score: Lowest First</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-1.5 self-end lg:self-auto border border-[#2F3654] rounded-xl p-1 bg-[#0E141F]">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#0B85FC] text-white shadow-sm'
                  : 'text-[#AAB3C2] hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-[#0B85FC] text-white shadow-sm'
                  : 'text-[#AAB3C2] hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split 360</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 rounded-xl border border-[#0B85FC]/40 bg-[#0B85FC]/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#0B85FC]" />
                <span className="text-xs font-bold text-white">
                  {selectedIds.length} {selectedIds.length === 1 ? 'contact' : 'contacts'} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-lg border border-[#2F3654] bg-[#1E222B] hover:bg-[#2F3654] text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Export Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#AAB3C2] hover:text-white cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. MAIN CONTENT AREA (Table View or Split View) */}
        {viewMode === 'table' ? (
          /* ============================================================
             FULL DATA TABLE VIEW (Primary Customer Directory Grid)
             ============================================================ */
          <div className="rounded-2xl border border-[#2F3654] bg-[#1E222B] overflow-hidden shadow-xl flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2F3654] bg-[#0E141F]/60 text-[11px] font-bold text-[#AAB3C2] uppercase tracking-wider">
                    <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedCustomers.length > 0 && selectedIds.length === paginatedCustomers.length}
                        onChange={handleSelectAll}
                        className="rounded border-[#2F3654] bg-[#1E222B] text-[#0B85FC] cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4">Customer Contact</th>
                    <th className="py-3.5 px-4">Company</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Affinity Score</th>
                    <th className="py-3.5 px-4">Added Date</th>
                    <th className="py-3.5 pr-4 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2F3654]/60 text-xs">
                  {loadingList ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4 text-center"><div className="w-4 h-4 bg-[#0E141F] rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-40 bg-[#0E141F] rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 bg-[#0E141F] rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 bg-[#0E141F] rounded" /></td>
                        <td className="py-4 px-4"><div className="h-5 w-16 bg-[#0E141F] rounded-md" /></td>
                        <td className="py-4 px-4"><div className="h-3 w-28 bg-[#0E141F] rounded-full" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-[#0E141F] rounded" /></td>
                        <td className="py-4 px-4 text-right"><div className="h-6 w-16 bg-[#0E141F] rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-[#AAB3C2]">
                        <Users className="w-10 h-10 mx-auto text-[#5F6878] mb-3" />
                        <p className="text-sm font-semibold text-white">No contacts match your criteria</p>
                        <p className="text-xs text-[#AAB3C2] mt-1">Try relaxing your search terms or filter selection.</p>
                        <button
                          onClick={() => { setSearchQuery(''); setStatusFilter('all'); setScoreFilter('all'); }}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#0B85FC] text-white text-xs font-semibold cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map(customer => {
                      const isChecked = selectedIds.includes(customer.id);
                      const score = customer.lead_score ?? 0;
                      const scoreStyle = getScoreColor(score);
                      const initials = `${(customer.first_name || 'U')[0]}${(customer.last_name || '')[0] || ''}`.toUpperCase();

                      return (
                        <tr
                          key={customer.id}
                          onClick={() => handleOpen360(customer)}
                          className={`transition-colors cursor-pointer group ${
                            isChecked
                              ? 'bg-[#0B85FC]/10 hover:bg-[#0B85FC]/15'
                              : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3.5 pl-4 pr-2 text-center"
                            onClick={e => { e.stopPropagation(); handleToggleSelect(customer.id); }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-[#2F3654] bg-[#1E222B] text-[#0B85FC] cursor-pointer"
                            />
                          </td>

                          {/* Customer Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B85FC]/20 to-[#5660F3]/30 border border-[#0B85FC]/30 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white group-hover:text-[#0DB8FA] transition-colors truncate">
                                  {customer.first_name} {customer.last_name}
                                </p>
                                <p className="text-[11px] text-[#AAB3C2] truncate mt-0.5">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Company */}
                          <td className="py-3.5 px-4 text-[#AAB3C2]">
                            {customer.company ? (
                              <span className="font-medium text-white">{customer.company}</span>
                            ) : (
                              <span className="text-[#5F6878] italic">Independent</span>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#AAB3C2]">
                            {customer.phone || <span className="text-[#5F6878]">—</span>}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {getStatusBadge(customer.status)}
                          </td>

                          {/* Affinity / Lead Score */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className={scoreStyle.text}>{score}%</span>
                              </div>
                              <div className="w-full bg-[#0E141F] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${scoreStyle.bar}`}
                                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Created Date */}
                          <td className="py-3.5 px-4 text-[#AAB3C2] font-mono text-[11px]">
                            {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 pr-4 pl-2 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpen360(customer)}
                                className="px-2.5 py-1 rounded-lg bg-[#0B85FC]/10 hover:bg-[#0B85FC]/20 text-[#0B85FC] font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                title="View Customer 360 Dossier"
                              >
                                <Eye className="w-3 h-3" />
                                <span>360</span>
                              </button>
                              <button
                                onClick={() => { setEditingCustomer({ ...customer }); setShowEditModal(true); }}
                                className="p-1.5 rounded-lg border border-[#2F3654] hover:bg-[#2F3654] text-[#AAB3C2] hover:text-white transition-colors cursor-pointer"
                                title="Edit Contact"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={e => handleDeleteCustomer(e, customer.id, `${customer.first_name} ${customer.last_name}`)}
                                className="p-1.5 rounded-lg border border-[#2F3654] hover:bg-rose-500/20 text-[#AAB3C2] hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete Contact"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-[#2F3654] bg-[#0E141F]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="text-[#AAB3C2]">
                Showing <span className="font-bold text-white">{filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredCustomers.length)}</span> of{' '}
                <span className="font-bold text-white">{filteredCustomers.length.toLocaleString()}</span> contacts
              </div>

              <div className="flex items-center gap-3">
                {/* Page size dropdown */}
                <div className="flex items-center gap-1.5 text-[#AAB3C2]">
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1 rounded-lg bg-[#1E222B] border border-[#2F3654] text-white text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page nav buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[#2F3654] bg-[#1E222B] text-[#AAB3C2] hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 text-xs font-bold text-white">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-[#2F3654] bg-[#1E222B] text-[#AAB3C2] hover:text-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             SPLIT DOSSIER VIEW (Master List Left + Dossier Right)
             ============================================================ */
          <div className="h-[750px] flex flex-col lg:flex-row gap-5 overflow-hidden">
            {/* Left: Contact Directory Column */}
            <div className="w-full lg:w-88 rounded-2xl border border-[#2F3654] bg-[#1E222B] flex flex-col overflow-hidden shrink-0 shadow-lg">
              <div className="p-3.5 border-b border-[#2F3654] bg-[#0E141F]/40 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Contacts ({filteredCustomers.length})</span>
                <span className="text-[10px] text-[#AAB3C2]">Click contact to view</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#2F3654]/50 scrollbar-thin">
                {loadingList ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-3.5 space-y-2 animate-pulse">
                      <div className="h-3 w-1/2 bg-[#0E141F] rounded" />
                      <div className="h-2 w-3/4 bg-[#0E141F] rounded" />
                    </div>
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <p className="p-8 text-xs text-[#AAB3C2] text-center">No matching contacts.</p>
                ) : (
                  filteredCustomers.map(c => {
                    const isSelected = selectedCustomerId === c.id;
                    const initials = `${(c.first_name || 'U')[0]}${(c.last_name || '')[0] || ''}`.toUpperCase();
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#0B85FC]/15 border-l-4 border-[#0B85FC] text-white'
                            : 'hover:bg-white/[0.03] text-[#AAB3C2]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#0E141F] border border-[#2F3654] flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{c.first_name} {c.last_name}</p>
                            <p className="text-[10px] text-[#AAB3C2] truncate">{c.company || 'Private'} · {c.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-[#0DB8FA]">{c.lead_score || 0}%</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#5F6878]" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Embedded Dossier Area */}
            <div className="flex-1 rounded-2xl border border-[#2F3654] bg-[#1E222B] flex flex-col overflow-hidden shadow-lg">
              {renderDossierContent()}
            </div>
          </div>
        )}

      </div>

      {/* ============================================================
          SLIDE-OVER CUSTOMER 360 DRAWER (For Table View)
          ============================================================ */}
      <AnimatePresence>
        {drawerOpen && viewMode === 'table' && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-screen max-w-2xl bg-[#1E222B] border-l border-[#2F3654] shadow-2xl flex flex-col overflow-hidden text-white"
              >
                {/* Drawer Header */}
                <div className="p-5 border-b border-[#2F3654] bg-[#0E141F] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0B85FC]/10 text-[#0B85FC] border border-[#0B85FC]/20">
                      Customer 360 Dossier
                    </span>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg border border-[#2F3654] text-[#AAB3C2] hover:text-white hover:bg-[#2F3654] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto">
                  {renderDossierContent()}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          ADD CONTACT MODAL
          ============================================================ */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl border border-[#2F3654] bg-[#1E222B] text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#2F3654]">
                <h2 className="text-base font-bold text-white">Add Workspace Contact</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-[#AAB3C2] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">First Name *</label>
                    <input
                      required
                      value={newCustomer.first_name}
                      onChange={e => setNewCustomer(p => ({ ...p, first_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      placeholder="Jane"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Last Name *</label>
                    <input
                      required
                      value={newCustomer.last_name}
                      onChange={e => setNewCustomer(p => ({ ...p, last_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      placeholder="Doe"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Work Email *</label>
                  <input
                    required
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                    placeholder="jane.doe@company.com"
                    style={{ caretColor: '#0B85FC' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Phone</label>
                    <input
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      placeholder="+1 (555) 012-3456"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Lifecycle Status</label>
                    <select
                      value={newCustomer.status}
                      onChange={e => setNewCustomer(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors cursor-pointer"
                    >
                      <option value="lead">Lead</option>
                      <option value="contact_ready">Contact Ready</option>
                      <option value="active">Active Customer</option>
                      <option value="churn_risk">At Risk</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Company</label>
                    <input
                      value={newCustomer.company}
                      onChange={e => setNewCustomer(p => ({ ...p, company: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      placeholder="Acme Corp"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Lead Score (0-100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newCustomer.lead_score}
                      onChange={e => setNewCustomer(p => ({ ...p, lead_score: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#2F3654]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#2F3654] bg-[#0E141F] hover:bg-[#2F3654] text-xs font-semibold text-[#AAB3C2] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-bold shadow-lg shadow-[#0B85FC]/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Add Contact'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          EDIT CONTACT MODAL
          ============================================================ */}
      <AnimatePresence>
        {showEditModal && editingCustomer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl border border-[#2F3654] bg-[#1E222B] text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#2F3654]">
                <h2 className="text-base font-bold text-white">Edit Customer Profile</h2>
                <button onClick={() => setShowEditModal(false)} className="text-[#AAB3C2] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateCustomer} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">First Name *</label>
                    <input
                      required
                      value={editingCustomer.first_name || ''}
                      onChange={e => setEditingCustomer((p: any) => ({ ...p, first_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Last Name *</label>
                    <input
                      required
                      value={editingCustomer.last_name || ''}
                      onChange={e => setEditingCustomer((p: any) => ({ ...p, last_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={editingCustomer.email || ''}
                    onChange={e => setEditingCustomer((p: any) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors"
                    style={{ caretColor: '#0B85FC' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Phone</label>
                    <input
                      value={editingCustomer.phone || ''}
                      onChange={e => setEditingCustomer((p: any) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Lifecycle Status</label>
                    <select
                      value={editingCustomer.status || 'lead'}
                      onChange={e => setEditingCustomer((p: any) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors cursor-pointer"
                    >
                      <option value="lead">Lead</option>
                      <option value="contact_ready">Contact Ready</option>
                      <option value="active">Active Customer</option>
                      <option value="churn_risk">At Risk</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Company</label>
                    <input
                      value={editingCustomer.company || ''}
                      onChange={e => setEditingCustomer((p: any) => ({ ...p, company: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#AAB3C2]">Lead Score (0-100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editingCustomer.lead_score ?? 50}
                      onChange={e => setEditingCustomer((p: any) => ({ ...p, lead_score: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      style={{ caretColor: '#0B85FC' }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#2F3654]">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#2F3654] bg-[#0E141F] hover:bg-[#2F3654] text-xs font-semibold text-[#AAB3C2] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2.5 rounded-xl bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-bold shadow-lg shadow-[#0B85FC]/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </LayoutWrapper>
  );

  // Helper renderer for Customer 360 Dossier Content (shared between Split View & Drawer)
  function renderDossierContent() {
    if (!selectedCustomer || loadingDetail) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#AAB3C2] space-y-3">
          {loadingDetail ? (
            <>
              <RefreshCw className="w-8 h-8 animate-spin text-[#0B85FC]" />
              <p className="text-xs font-semibold text-white">Loading Customer 360 Dossier...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#0E141F] border border-[#2F3654] flex items-center justify-center text-[#AAB3C2]">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">No Contact Selected</p>
              <p className="text-xs text-[#AAB3C2] max-w-xs">
                Select any customer from the directory to review behavioral profile, digital twin, and timeline.
              </p>
            </>
          )}
        </div>
      );
    }

    const c = selectedCustomer.customer;
    const initials = `${(c.first_name || 'U')[0]}${(c.last_name || '')[0] || ''}`.toUpperCase();
    const score = c.lead_score ?? 0;
    const scoreColor = getScoreColor(score);

    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Profile Card Header */}
        <div className="p-6 border-b border-[#2F3654] bg-[#0E141F]/60 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B85FC]/20 to-[#6B5CF6]/30 border border-[#0B85FC]/30 flex items-center justify-center text-lg font-black text-white shrink-0 shadow-md">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">
                  {c.first_name} {c.last_name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  {getStatusBadge(c.status)}
                  <span className="text-[#AAB3C2] font-medium">
                    {c.company ? `at ${c.company}` : 'Independent Contact'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingCustomer({ ...c }); setShowEditModal(true); }}
                className="p-2 rounded-xl border border-[#2F3654] bg-[#1E222B] hover:bg-[#2F3654] text-[#AAB3C2] hover:text-white transition-colors cursor-pointer"
                title="Edit Contact"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <div className="text-right pl-3 border-l border-[#2F3654]">
                <p className={`text-2xl font-black ${scoreColor.text}`}>{score}%</p>
                <p className="text-[10px] text-[#AAB3C2] font-mono uppercase tracking-wider">Affinity Index</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#2F3654] text-xs text-[#AAB3C2]">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-4 h-4 text-[#0B85FC] shrink-0" />
              <span className="truncate text-white font-medium">{c.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#0DB8FA] shrink-0" />
              <span className="text-white font-medium">{c.phone || 'No phone recorded'}</span>
            </div>
          </div>
        </div>

        {/* Dossier Body: Semantic Search + Digital Twin + Timeline */}
        <div className="p-6 pb-20 space-y-6 flex-1">
          {/* Semantic Memory Search Bar */}
          <div className="p-4 rounded-xl border border-[#2F3654] bg-[#0E141F]/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                <Bot className="w-4 h-4 text-[#5660F3]" />
                <span>Vectorized Semantic Memory</span>
              </div>
              <span className="text-[10px] font-mono text-[#AAB3C2]">pgvector RAG</span>
            </div>

            <form onSubmit={handleSemanticSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AAB3C2]" />
                <input
                  type="text"
                  value={semanticSearch}
                  onChange={e => setSemanticSearch(e.target.value)}
                  placeholder="Search interaction memory in natural language..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  style={{ caretColor: '#0B85FC' }}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            {selectedCustomer.relevant_memories?.length > 0 && (
              <div className="mt-3 p-3 rounded-xl border border-[#2F3654] bg-[#1E222B] space-y-2">
                <p className="text-[10px] uppercase font-bold text-[#0DB8FA]">Vector Matches Found:</p>
                {selectedCustomer.relevant_memories.map((m: any, idx: number) => (
                  <p key={idx} className="border-l-2 border-[#0B85FC] pl-2 text-xs text-[#AAB3C2] leading-relaxed italic">
                    &ldquo;{m.content}&rdquo;
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* AI Customer Digital Twin Component */}
          <div className="p-4 rounded-xl border border-[#2F3654] bg-[#0E141F]/40">
            <DigitalTwinPanel
              customerId={c.id}
              customerName={`${c.first_name} ${c.last_name}`}
            />
          </div>

          {/* Chronological Interaction Log & Timeline */}
          <div className="space-y-4 pt-4 border-t border-[#2F3654]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-white tracking-wider">
                Interaction Timeline & Outreach
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Close Form' : 'Log Interaction'}</span>
              </button>
            </div>

            {/* Interaction Form */}
            {showAddForm && (
              <form onSubmit={handleAddInteraction} className="p-4 rounded-xl border border-[#2F3654] bg-[#0E141F] space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {['note', 'call', 'meeting', 'email', 'support'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNoteType(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                        noteType === t
                          ? 'bg-[#0B85FC] text-white'
                          : 'bg-[#1E222B] text-[#AAB3C2] border border-[#2F3654] hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* AI Drafting Assistant */}
                <div className="p-3 rounded-xl border border-[#2F3654] bg-[#1E222B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#AAB3C2] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Outreach Drafter
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Intent (e.g. quarterly check-in, VIP renewal discount)..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                      style={{ caretColor: '#0B85FC' }}
                    />
                    <button
                      type="button"
                      onClick={handleAiDraft}
                      disabled={aiDrafting}
                      className="px-3 py-1 rounded-lg bg-[#5660F3] hover:bg-[#5660F3]/90 text-xs font-bold text-white flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {aiDrafting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>Draft</span>
                    </button>
                  </div>
                </div>

                <input
                  required
                  value={noteSummary}
                  onChange={e => setNoteSummary(e.target.value)}
                  placeholder="Summary title..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  style={{ caretColor: '#0B85FC' }}
                />
                <textarea
                  rows={3}
                  value={noteDetails}
                  onChange={e => setNoteDetails(e.target.value)}
                  placeholder="Conversation details, action items, or feedback..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors resize-none"
                  style={{ caretColor: '#0B85FC' }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#2F3654] text-xs text-[#AAB3C2] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-1.5 rounded-xl bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : 'Save to Memory'}
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Feed */}
            <div className="space-y-3">
              {(!selectedCustomer.timeline || selectedCustomer.timeline.length === 0) ? (
                <div className="p-6 text-center rounded-xl border border-[#2F3654] bg-[#0E141F]/40 text-[#AAB3C2]">
                  <p className="text-xs italic">No timeline events logged yet for this contact.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 text-xs text-[#0B85FC] font-semibold hover:underline"
                  >
                    + Log First Touchpoint
                  </button>
                </div>
              ) : (
                selectedCustomer.timeline.map((ev: any) => (
                  <div key={ev.id} className="p-3.5 rounded-xl border border-[#2F3654] bg-[#0E141F]/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#AAB3C2]">
                      <span className="px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-[#0B85FC]/10 text-[#0B85FC] border border-[#0B85FC]/20">
                        {ev.type}
                      </span>
                      <span>{new Date(ev.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs font-bold text-white">{ev.summary}</p>
                    {ev.details && (
                      <p className="text-xs text-[#AAB3C2] leading-relaxed whitespace-pre-wrap">{ev.details}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
