'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  BarChart3,
  Sparkles,
  LogOut,
  Menu,
  X,
  IndianRupee,
  DollarSign,
  ChevronDown,
  Settings as SettingsIcon,
  Shield,
  Building,
  Search,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/context/currency-context';
import { api } from '@/services/api';
import NotificationCenter from './notification-center';

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Studio', href: '/campaign-studio', icon: Sparkles, highlight: true },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Segments', href: '/segments', icon: Layers },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Agent Swarm', href: '/agent-monitor', icon: Cpu },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  // Super Admin workspace switching states
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyOverride, setSelectedCompanyOverride] = useState<string | null>(null);
  const [overrideName, setOverrideName] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const getActiveCompanyDetails = () => {
    if (selectedCompanyOverride) {
      const activeComp = companies.find(c => c.id === selectedCompanyOverride);
      if (activeComp) {
        return {
          name: activeComp.name,
          logo_url: activeComp.logo_url
        };
      }
      return {
        name: overrideName || 'Selected Workspace',
        logo_url: undefined
      };
    }
    return user?.company ? {
      name: user.company.name,
      logo_url: user.company.logo_url
    } : null;
  };

  const activeCompany = getActiveCompanyDetails();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('catalyst_user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSelectedCompanyOverride(localStorage.getItem('catalyst_override_company'));
      setOverrideName(localStorage.getItem('catalyst_override_company_name'));
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin' && user?.token) {
      api.superGetCompanies().then(setCompanies).catch(console.error);
    }
  }, [user]);

  const handleSwitchCompany = (companyId: string | null) => {
    if (companyId === null) {
      localStorage.removeItem('catalyst_override_company');
      localStorage.removeItem('catalyst_override_company_name');
    } else {
      localStorage.setItem('catalyst_override_company', companyId);
      const comp = companies.find(c => c.id === companyId);
      if (comp) {
        localStorage.setItem('catalyst_override_company_name', comp.name);
      }
    }
    window.location.reload();
  };

  const handleLogout = () => {
    document.cookie = 'catalyst_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'catalyst_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    localStorage.removeItem('catalyst_user');
    router.push('/login');
  };

  const role = (user?.role || 'owner').toUpperCase();

  return (
    <>
      {/* ─── Super Admin Workspace Banner ─── */}
      {selectedCompanyOverride && (
        <div className="w-full text-white text-xs font-mono py-2 px-4 flex items-center justify-between relative z-50 shrink-0 select-none"
          style={{ background: 'linear-gradient(90deg, #5660F3, #0B85FC)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-white/80" />
            <span>Workspace View: <strong className="underline underline-offset-2">{overrideName || 'Workspace'}</strong> — Super Admin Simulation</span>
          </span>
          <button
            onClick={() => handleSwitchCompany(null)}
            className="bg-white/15 hover:bg-white/25 text-white font-mono text-[10px] px-2.5 py-1 rounded border border-white/25 transition-all cursor-pointer"
          >
            Exit Workspace Mode
          </button>
        </div>
      )}

      {/* ─── Main App Header ─── */}
      <header className="sticky top-0 z-40 w-full shrink-0"
        style={{
          background: 'rgba(14, 20, 31, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* ─── Left: Logo + Workspace ─── */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <img
                src="/crmlogo.png"
                alt="Catalyst"
                className="h-8 w-auto object-contain shrink-0"
              />
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(11,133,252,0.15)', color: '#0DB8FA', border: '1px solid rgba(11,133,252,0.25)' }}>
                V2
              </span>
              {activeCompany?.name && (
                <span className="text-[10px] font-mono truncate max-w-[120px] hidden md:inline" style={{ color: '#AAB3C2' }}>
                  · {activeCompany.name}
                </span>
              )}
            </Link>

            {/* Role Badge */}
            <span className="hidden sm:inline-flex items-center text-[10px] font-mono uppercase px-2 py-0.5 rounded"
              style={{ background: 'rgba(86,96,243,0.12)', color: '#8B96FF', border: '1px solid rgba(86,96,243,0.25)' }}>
              {role}
            </span>

            {/* Super Admin Workspace Switcher */}
            {user?.role === 'super_admin' && (
              <div className="relative pl-2 hidden xl:block" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => setWorkspaceOpen(!workspaceOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#AAB3C2'
                  }}
                >
                  <span className="truncate max-w-[100px]">{selectedCompanyOverride ? activeCompany?.name : 'All Workspaces'}</span>
                  <ChevronDown className={`w-3 h-3 text-[#AAB3C2] transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {workspaceOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setWorkspaceOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute left-0 mt-2 w-56 rounded-xl shadow-2xl p-1 z-40 max-h-60 overflow-y-auto"
                        style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.10)' }}
                      >
                        <button
                          onClick={() => { handleSwitchCompany(null); setWorkspaceOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-lg transition-colors"
                          style={{ color: '#AAB3C2' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Global Workspace</span>
                        </button>
                        <div className="my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                        {companies.map((comp) => (
                          <button
                            key={comp.id}
                            onClick={() => { handleSwitchCompany(comp.id); setWorkspaceOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-lg transition-colors"
                            style={{ color: '#AAB3C2' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Building className="w-3.5 h-3.5" />
                            <span className="truncate">{comp.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ─── Center Navigation ─── */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === '/campaign-studio' && pathname === '/ai-studio');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all"
                  style={
                    isActive
                      ? { background: 'linear-gradient(135deg, #0B85FC, #0DB8FA)', color: '#FFFFFF', fontWeight: '600' }
                      : item.highlight
                        ? { background: 'rgba(86,96,243,0.12)', color: '#8B96FF', border: '1px solid rgba(86,96,243,0.25)' }
                        : { color: '#AAB3C2' }
                  }
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = item.highlight ? 'rgba(86,96,243,0.12)' : 'transparent';
                      e.currentTarget.style.color = item.highlight ? '#8B96FF' : '#AAB3C2';
                    }
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* ─── Right: Search, AI Status, Notifications, Currency, Profile ─── */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Global Search */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#AAB3C2' }}
              title="Global Search & Commands (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Search</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px]"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: '#7A8494' }}>
                ⌘K
              </kbd>
            </button>

            {/* AI Agent Swarm Status */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-mono"
              style={{ background: 'rgba(11,133,252,0.08)', border: '1px solid rgba(11,133,252,0.20)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: '#0DB8FA' }} />
                <span className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: '#0B85FC' }} />
              </span>
              <span style={{ color: '#AAB3C2' }}>10 Agents:</span>
              <span className="font-semibold" style={{ color: '#0DB8FA' }}>Active</span>
            </div>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Currency Switcher */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#D4DAE6' }}
              >
                {currency === 'INR' ? (
                  <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /><span>INR</span></span>
                ) : (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /><span>USD</span></span>
                )}
                <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} style={{ color: '#7A8494' }} />
              </button>

              <AnimatePresence>
                {currencyOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setCurrencyOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 mt-1.5 w-28 rounded-xl shadow-2xl p-1 z-40 font-mono"
                      style={{ background: '#1E222B', border: '1px solid rgba(255,255,255,0.10)' }}
                    >
                      {(['INR', 'USD'] as const).map(cur => (
                        <button
                          key={cur}
                          onClick={() => { setCurrency(cur); setCurrencyOpen(false); }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all"
                          style={
                            currency === cur
                              ? { background: 'rgba(11,133,252,0.15)', color: '#0B85FC', fontWeight: '600' }
                              : { color: '#AAB3C2' }
                          }
                          onMouseEnter={e => { if (currency !== cur) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                          onMouseLeave={e => { if (currency !== cur) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span className="flex items-center gap-1">
                            {cur === 'INR' ? <IndianRupee className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                            {cur === 'INR' ? 'INR (₹)' : 'USD ($)'}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-mono font-bold select-none"
                style={{ background: 'linear-gradient(135deg, #5660F3, #6B5CF6)' }}>
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CA'}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out of Catalyst"
                className="p-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color: '#7A8494' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A8494'; e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#D4DAE6' }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Navigation Drawer ─── */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 backdrop-blur-sm"
                style={{ background: 'rgba(14,20,31,0.80)' }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                className="relative w-72 max-w-xs h-full shadow-2xl flex flex-col z-10 p-4"
                style={{ background: '#1E222B', borderRight: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <img src="/crmlogo.png" alt="Catalyst" className="h-7 w-auto object-contain" />
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(11,133,252,0.15)', color: '#0DB8FA', border: '1px solid rgba(11,133,252,0.25)' }}>
                      V2
                    </span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="p-1 transition-colors" style={{ color: '#7A8494' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7A8494')}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono transition-all"
                        style={
                          isActive
                            ? { background: 'linear-gradient(135deg, #0B85FC, #0DB8FA)', color: '#FFFFFF', fontWeight: '600' }
                            : { color: '#AAB3C2' }
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #5660F3, #6B5CF6)' }}>
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CA'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-white truncate">{user?.name || 'Workspace User'}</p>
                      <p className="text-[10px] font-mono truncate" style={{ color: '#AAB3C2' }}>{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 px-3 text-xs font-mono rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.20)' }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
