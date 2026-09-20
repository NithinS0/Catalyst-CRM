'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './navbar';
import CommandPalette from './command-palette';
import { ToastProvider } from './ui/toast';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('catalyst_user');
    if (!storedUser) {
      router.replace('/login');
    } else {
      try {
        const userObj = JSON.parse(storedUser);
        setUser(userObj);
        setAuthorized(true);
      } catch (e) {
        console.error('Failed to parse user in LayoutWrapper', e);
        router.replace('/login');
      }
    }
  }, [router]);

  // Global keyboard shortcut for Command Palette (Cmd/Ctrl + K)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#0E141F' }}>
        <div className="text-center space-y-4">
          <img
            src="/crmlogo.png"
            alt="Catalyst"
            className="h-10 w-auto object-contain mx-auto"
            style={{ filter: 'drop-shadow(0 0 12px rgba(11,133,252,0.40))' }}
          />
          <div className="w-5 h-5 rounded-full border-2 animate-spin mx-auto"
            style={{ borderColor: 'rgba(11,133,252,0.25)', borderTopColor: '#0B85FC' }} />
          <p className="text-xs font-mono" style={{ color: '#AAB3C2' }}>Initializing Catalyst V2 Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0E141F', color: '#F7F9FC' }}>
        <Navbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 min-w-0 overflow-y-auto relative" style={{ background: '#0E141F' }}>
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full min-h-full">
            {children}
          </div>
        </main>
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
