'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './navbar';
import { ToastProvider } from './ui/toast';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('catalyst_user');
    if (!user) {
      router.replace('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <span className="font-black text-white text-base">C</span>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-[var(--bg-base)] overflow-hidden safe-top safe-bottom">
        <Navbar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-base)] relative scroll-area scrollbar-thin">
          {/* Ambient glow */}
          <div className="orb w-[600px] h-[600px] bg-indigo-200/50 top-[-200px] right-[-200px] pointer-events-none" />
          <div className="orb w-[400px] h-[400px] bg-violet-200/40 bottom-[-100px] left-[-100px] pointer-events-none" />
          <div className="p-4 sm:p-6 lg:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] relative z-10 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
