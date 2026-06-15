'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, Bot, User } from 'lucide-react';
import { api } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('member@catalyst.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    if (newMode === 'register') {
      setEmail('');
      setPassword('');
    }
    else {
      setEmail('member@catalyst.ai');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        const data = await api.login(email, password);
        localStorage.setItem('catalyst_user', JSON.stringify({
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          token: data.session.access_token,
        }));
        router.push('/dashboard');
      } else {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await api.register(name, email, password);
        setSuccess('Registration successful! Authenticating...');
        
        // Auto-login after registration
        const loginData = await api.login(email, password);
        localStorage.setItem('catalyst_user', JSON.stringify({
          email: loginData.user.email,
          name: loginData.user.name,
          role: loginData.user.role,
          token: loginData.session.access_token,
        }));

        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Authentication failed. Please check your inputs and try again.';
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-[var(--bg-base)] relative overflow-hidden">
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 lg:p-16 z-10 bg-white shadow-xl">
        <div />

        <div className="max-w-md w-full mx-auto my-auto py-12">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Catalyst" className="h-28 w-auto object-contain" />
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-[var(--border)] mb-8 bg-zinc-50 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Register
            </button>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-zinc-500 text-sm">
              {mode === 'login' 
                ? 'Log in to access your AI-powered workspace and automation engine.'
                : 'Register to set up your AI-native CRM and workspace.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs rounded-xl p-3 border border-red-100 font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 text-emerald-600 text-xs rounded-xl p-3 border border-emerald-100 font-medium">
                {success}
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-[var(--border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-zinc-400 focus:outline-none transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[var(--border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-zinc-400 focus:outline-none transition-all duration-200"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[var(--border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-zinc-400 focus:outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-150 cursor-pointer shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Enter Dashboard' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-xs text-zinc-400">
          © {new Date().getFullYear()} Catalyst Systems, Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column - Premium Brand Teaser */}
      <div className="hidden lg:flex lg:w-[55%] bg-[var(--bg-base)] border-l border-[var(--border)] relative p-16 flex-col justify-between items-start">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-60" />

        {/* Glow Panel Mockup */}
        <div className="w-full max-w-xl mx-auto my-auto bg-white border border-[var(--border)] rounded-2xl p-6 glass-darker shadow-lg relative z-10 overflow-hidden">
          {/* Card Head */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              AI Studio Active
            </div>
          </div>

          {/* Prompt Mockup */}
          <div className="space-y-4">
            <div className="bg-[var(--bg-overlay)] border border-[var(--border)] p-4 rounded-xl">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Marketer Intent Prompt</p>
              <p className="text-sm text-indigo-950 mt-1.5 font-medium italic">
                "Find churn risk accounts and compile custom pricing proposal copies."
              </p>
            </div>

            {/* Agent steps */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Orchestrator routed request to [Segment Analyzer]
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Segment Analyzer compiled rules: status = "churn_risk" (Found 1 matches)
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Copywriter loaded RAG context: 2 past support interactions
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Generated Hyper-Personalized Template (Ready for launch)
              </div>
            </div>
          </div>
        </div>

        {/* Brand Text */}
        <div className="relative z-10 mt-auto max-w-lg">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 animate-spin-slow text-indigo-500" />
            AI-Native CRM Platform
          </div>
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] leading-tight">
            Build closer customer relationships with agentic automation.
          </h2>
          <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
            Catalyst interprets campaign objectives, scoring interactions using pgvector RAG context, and drafts personalized campaign copy to ensure maximum user retention.
          </p>
        </div>
      </div>
    </main>
  );
}
