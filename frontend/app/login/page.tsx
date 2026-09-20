'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  Zap,
  FileText,
} from 'lucide-react';
import { authService } from '@/services/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('superadmin@catalyst.crm');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authService.login(email.trim(), password);
      document.cookie = `catalyst_token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `catalyst_role=${data.user.role}; path=/; max-age=604800; SameSite=Lax`;
      localStorage.setItem(
        'catalyst_user',
        JSON.stringify({
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          company_id: data.user.company_id,
          company: data.user.company,
        })
      );

      let dest = redirectParam || '/dashboard';
      if (dest.startsWith('/app/')) {
        dest = dest.replace('/app/', '/');
      }
      router.push(dest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = searchParams.get('expired') === 'true';

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/20 text-slate-800 w-full max-w-[440px] mx-auto relative">
      {/* Top Lock Badge */}
      <div className="w-12 h-12 rounded-2xl bg-[#E0F7FC] border border-[#B2EBF2] flex items-center justify-center mx-auto mb-4 text-[#00B4D8] shadow-sm">
        <Lock className="w-5 h-5 text-[#00B4D8]" />
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to continue managing your CRM.
        </p>
      </div>

      {isExpired && !error && (
        <div className="mb-5 p-3 rounded-xl text-xs flex items-center gap-2 border border-[#00B4D8]/30 bg-[#E0F7FC] text-[#00838F]">
          <span className="font-bold uppercase px-1.5 py-0.5 rounded text-white text-[9px] bg-[#00B4D8]">
            Notice
          </span>
          <span>Your session expired. Please sign in to resume.</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 rounded-xl text-xs flex items-center gap-2 border border-rose-200 bg-rose-50 text-rose-700">
          <span className="font-bold uppercase px-1.5 py-0.5 rounded text-white text-[9px] bg-rose-500">
            Error
          </span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            EMAIL ADDRESS <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all bg-white"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            PASSWORD <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#00B4D8] focus:ring-[#00B4D8] cursor-pointer"
            />
            <span>Remember me</span>
          </label>
          <Link
            href="/contact"
            className="font-semibold text-[#00B4D8] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-[#00B4D8] hover:bg-[#0096B4] text-white font-bold text-sm shadow-lg shadow-[#00B4D8]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-2"
        >
          {loading ? (
            <span>Signing In...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* OR Divider */}
      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <span className="relative px-3 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
          OR
        </span>
      </div>

      {/* Create Account Link */}
      <div className="text-center text-xs text-slate-600">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-bold text-[#00B4D8] hover:underline inline-flex items-center gap-1"
        >
          Create your company <ArrowRight className="w-3 h-3 inline" />
        </Link>
      </div>

      {/* Security Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00B4D8]" />
        <span>Secure login powered by Catalyst AI</span>
      </div>

      {/* Demo Credentials Quick Switcher */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mb-2">
          <KeyRound className="w-3 h-3" /> Quick Demo Accounts:
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Super Admin', email: 'superadmin@catalyst.crm', pass: 'password123' },
            { label: 'Demo Marketer', email: 'member@catalyst.ai', pass: 'password123' },
          ].map(({ label, email: de, pass }) => (
            <button
              key={label}
              type="button"
              onClick={() => setDemoAccount(de, pass)}
              className="px-2 py-1.5 rounded-lg text-[10px] text-left border border-slate-200 hover:border-[#00B4D8] hover:bg-[#E0F7FC]/30 transition-all cursor-pointer"
            >
              <div className="font-bold text-slate-700">{label}</div>
              <div className="text-slate-400 truncate">{de}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const features = [
    {
      icon: BarChart3,
      title: 'CRM Pipeline',
      description: 'Track every opportunity and close deals using live AI insights.',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Role-based access control, call monitoring & activity streams.',
    },
    {
      icon: Zap,
      title: 'AI Automation',
      description: 'Automated lead scoring, call retries & smart workflow triggers.',
    },
    {
      icon: FileText,
      title: 'Invoicing & SLAs',
      description: 'Seamless billing, digital SLA signing & attendance tracking.',
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 20% 25%, #0d1e38 0%, #070e1c 50%, #040810 100%)',
      }}
    >
      {/* Background SVG Network Mesh Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00B4D8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke="rgba(0, 180, 216, 0.15)" strokeWidth="1">
            <line x1="10%" y1="20%" x2="25%" y2="35%" />
            <line x1="25%" y1="35%" x2="15%" y2="60%" />
            <line x1="25%" y1="35%" x2="40%" y2="30%" />
            <line x1="40%" y1="30%" x2="55%" y2="45%" />
            <line x1="55%" y1="45%" x2="70%" y2="25%" />
            <line x1="70%" y1="25%" x2="85%" y2="35%" />
            <line x1="70%" y1="25%" x2="65%" y2="65%" />
            <line x1="55%" y1="45%" x2="50%" y2="75%" />
            <line x1="15%" y1="60%" x2="35%" y2="80%" />
            <line x1="35%" y1="80%" x2="50%" y2="75%" />
            <line x1="50%" y1="75%" x2="75%" y2="85%" />
            <line x1="75%" y1="85%" x2="90%" y2="70%" />
          </g>
          {/* Constellation Dots */}
          {[
            { cx: '10%', cy: '20%' },
            { cx: '25%', cy: '35%' },
            { cx: '15%', cy: '60%' },
            { cx: '40%', cy: '30%' },
            { cx: '55%', cy: '45%' },
            { cx: '70%', cy: '25%' },
            { cx: '85%', cy: '35%' },
            { cx: '65%', cy: '65%' },
            { cx: '50%', cy: '75%' },
            { cx: '35%', cy: '80%' },
            { cx: '75%', cy: '85%' },
            { cx: '90%', cy: '70%' },
          ].map((pt, i) => (
            <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#00B4D8" />
          ))}
        </svg>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10 py-6">
        
        {/* Left Column: Branding, Value Prop & Feature Highlights */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 transition-all mb-7 backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO HOME</span>
          </Link>

          {/* Logo */}
          <div className="mb-6">
            <Link href="/" className="inline-block">
              <img
                src="/crmlogo.png"
                alt="Catalyst CRM"
                className="h-9 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            Close More Deals.
            <span className="block text-[#00B4D8] mt-1">Faster.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300/80 max-w-lg mt-4 mb-8 leading-relaxed font-normal">
            Your complete AI-powered CRM — Leads, Teams, Tasks, and Intelligence in one unified platform.
          </p>

          {/* 4 Feature Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0b2440]/80 border border-[#00B4D8]/30 flex items-center justify-center shrink-0 text-[#00B4D8] shadow-sm">
                    <Icon className="w-5 h-5 text-[#00B4D8]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Floating White Login Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <Suspense
            fallback={
              <div className="bg-white rounded-3xl p-10 text-center text-slate-500 max-w-[440px] w-full">
                Loading workspace login...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
