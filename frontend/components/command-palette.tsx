'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Sparkles,
  Megaphone,
  Users,
  Layers,
  BarChart3,
  Settings,
  Plus,
  Send,
  ShieldCheck,
  FileText,
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Resources';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  action: () => void;
  shortcut?: string;
}

const categoryColors: Record<string, string> = {
  Navigation: '#0B85FC',
  Actions: '#5660F3',
  Resources: '#0DB8FA',
};

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: CommandItem[] = [
    { id: 'nav-dash',      title: 'Go to Dashboard',                         category: 'Navigation', icon: LayoutDashboard, action: () => { router.push('/dashboard'); onClose(); } },
    { id: 'nav-studio',    title: 'Go to AI Campaign Studio',                category: 'Navigation', icon: Sparkles,        action: () => { router.push('/campaign-studio'); onClose(); } },
    { id: 'nav-camp',      title: 'Go to Campaigns',                         category: 'Navigation', icon: Megaphone,       action: () => { router.push('/campaigns'); onClose(); } },
    { id: 'nav-cust',      title: 'Go to Customers (Customer 360)',           category: 'Navigation', icon: Users,           action: () => { router.push('/customers'); onClose(); } },
    { id: 'nav-seg',       title: 'Go to Audience Segments',                 category: 'Navigation', icon: Layers,          action: () => { router.push('/segments'); onClose(); } },
    { id: 'nav-analytics', title: 'Go to Performance Analytics',             category: 'Navigation', icon: BarChart3,       action: () => { router.push('/analytics'); onClose(); } },
    { id: 'nav-settings',  title: 'Go to Workspace Settings & Integrations', category: 'Navigation', icon: Settings,        action: () => { router.push('/settings'); onClose(); } },
    { id: 'act-new',       title: 'Create New AI Campaign',                  category: 'Actions',    icon: Plus,            action: () => { router.push('/campaign-studio'); onClose(); }, shortcut: 'C' },
    { id: 'act-email',     title: 'Configure Email Provider (Resend / SMTP)',category: 'Actions',    icon: Send,            action: () => { router.push('/settings?tab=email'); onClose(); } },
    { id: 'act-audit',     title: 'Inspect Tenant Audit Logs',               category: 'Actions',    icon: ShieldCheck,     action: () => { router.push('/settings?tab=audit'); onClose(); } },
    { id: 'res-docs',      title: 'Security Architecture & Compliance',       category: 'Resources',  icon: FileText,        action: () => { router.push('/security'); onClose(); } },
  ];

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => (p + 1) % (filtered.length || 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => (p - 1 + filtered.length) % (filtered.length || 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIndex]) filtered[selectedIndex].action(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }, [isOpen, filtered, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            style={{ background: 'rgba(8,12,20,0.70)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden z-10"
            style={{
              background: '#1E222B',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.35)'
            }}
          >
            {/* Search Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Search className="w-5 h-5 shrink-0" style={{ color: '#5F6878' }} />
              <input
                type="text"
                autoFocus
                placeholder="Search commands, navigate, or run actions…  (ESC to exit)"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none font-mono placeholder-[#AAB3C2]"
                style={{ color: '#FFFFFF', caretColor: '#0B85FC' }}
              />
              <button
                onClick={onClose}
                className="p-1 rounded transition-colors shrink-0 cursor-pointer"
                style={{ color: '#5F6878' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5F6878')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm font-mono" style={{ color: '#5F6878' }}>
                  No commands match &ldquo;{query}&rdquo;
                </div>
              ) : (
                (['Navigation', 'Actions', 'Resources'] as const).map(category => {
                  const categoryItems = filtered.filter(i => i.category === category);
                  if (categoryItems.length === 0) return null;
                  const catColor = categoryColors[category];

                  return (
                    <div key={category} className="py-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-widest font-bold px-3 py-1.5"
                        style={{ color: catColor }}>
                        {category}
                      </div>
                      <div className="space-y-0.5">
                        {categoryItems.map(item => {
                          const overallIndex = filtered.indexOf(item);
                          const isSelected = overallIndex === selectedIndex;
                          const Icon = item.icon;

                          return (
                            <button
                              key={item.id}
                              onClick={item.action}
                              onMouseEnter={() => setSelectedIndex(overallIndex)}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all text-left cursor-pointer"
                              style={{
                                background: isSelected ? `${catColor}14` : 'transparent',
                                color: isSelected ? '#FFFFFF' : '#AAB3C2',
                                border: isSelected ? `1px solid ${catColor}28` : '1px solid transparent',
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon className="w-4 h-4 shrink-0"
                                  style={{ color: isSelected ? catColor : '#5F6878' }} />
                                <span className="truncate">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.shortcut && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px]"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: '#5F6878', border: '1px solid rgba(255,255,255,0.10)' }}>
                                    {item.shortcut}
                                  </span>
                                )}
                                <ArrowRight className={`w-3.5 h-3.5 transition-all ${isSelected ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`}
                                  style={{ color: catColor }} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-mono"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0E141F', color: '#5F6878' }}>
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <div className="flex items-center gap-1.5">
                <img src="/crmlogo.png" alt="Catalyst" className="h-4 w-auto object-contain opacity-70" />
                <span style={{ color: '#5F6878' }}>V2</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
