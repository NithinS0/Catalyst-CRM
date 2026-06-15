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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Segments', href: '/segments', icon: Layers },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Campaign Studio', href: '/ai-studio', icon: Sparkles, highlight: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('catalyst_user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('catalyst_user');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-md shrink-0">
      <div className="px-4 sm:px-6 lg:px-8 h-16 md:h-[68px] flex items-center justify-between">
        {/* Left section: Logo + Badge */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Catalyst Logo" 
              className="h-10 md:h-12 w-auto object-contain transition-all duration-150" 
            />
          </Link>
          <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-indigo-50/80 text-indigo-600 border border-indigo-100 select-none shrink-0">
            v1.0
          </span>
        </div>

        {/* Middle section: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-150 text-sm font-medium
                  ${isActive
                    ? item.highlight
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                      : 'bg-[var(--bg-overlay)] text-[var(--text-primary)] font-semibold'
                    : item.highlight
                      ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right section: AI Status + User profile */}
        <div className="flex items-center gap-4">
          {/* AI Agent Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-400 font-medium select-none">AI Status:</span>
            <span className="font-semibold text-[var(--text-primary)]">Online</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
              CA
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">Catalyst Admin</p>
              <p className="text-[10px] text-zinc-400 truncate leading-none mt-0.5">{user?.email || 'member@catalyst.ai'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0 ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay & sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-zinc-900/45 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Sidebar container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-xs h-full bg-[var(--bg-surface)] border-r border-[var(--border)] shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b border-[var(--border)] shrink-0 h-16">
                <img src="/logo.png" alt="Catalyst" className="h-8 w-auto" />
                <button onClick={() => setMobileOpen(false)} className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 text-sm font-medium
                        ${isActive
                          ? item.highlight
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-[var(--bg-overlay)] text-[var(--text-primary)] font-semibold'
                          : item.highlight
                            ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
              {/* User profile inside sidebar at the bottom */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-overlay)]/40 space-y-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
                    CA
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">Catalyst Admin</p>
                    <p className="text-[10px] text-zinc-400 truncate leading-none mt-1">{user?.email || 'member@catalyst.ai'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-red-655 bg-red-50 hover:bg-red-100/70 border border-red-100 rounded-xl transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
