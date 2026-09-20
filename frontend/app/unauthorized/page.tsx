'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/5 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white border border-red-100 rounded-2xl p-8 text-center shadow-xl relative overflow-hidden"
        >
          {/* Glass Overlay Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500" />
          
          {/* Lock/Shield Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6 shadow-inner relative">
            <Lock className="w-6 h-6 text-red-500" />
            <ShieldAlert className="w-4 h-4 text-amber-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight">
            Access Restricted
          </h1>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mt-1.5 text-red-550">
            403 Forbidden
          </p>

          {/* Message */}
          <p className="text-sm text-zinc-500 leading-relaxed mt-4">
            You do not have the required enterprise permissions to view this workspace. Please contact your workspace administrator to upgrade your role.
          </p>

          {/* Button Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-zinc-250 text-zinc-650 hover:bg-zinc-50 text-xs font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go Back
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-650/15 hover:shadow-indigo-650/25 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Return Dashboard
            </button>
          </div>
        </motion.div>
        
        {/* Footnote */}
        <p className="text-center text-[10px] text-zinc-400 mt-6 leading-none">
          If you believe this is an error, please log out and sign in again.
        </p>
      </div>
    </main>
  );
}
