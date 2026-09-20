'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Building,
  User,
  Phone,
  Users,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Zap,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authService } from '@/services/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [numberOfUsers, setNumberOfUsers] = useState('1-10');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authService.register({
        name: fullName,
        email: workEmail,
        company_name: companyName,
        company_email: companyEmail || undefined,
        password,
        phone_number: phoneNumber || undefined,
        number_of_users: numberOfUsers,
      });

      if (data.session?.access_token) {
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
        router.push('/dashboard');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Full CRM Pipeline',
      description: 'Track every lead and opportunity with live AI pipeline insights.',
    },
    {
      icon: Users,
      title: 'Team & Role Access',
      description: 'Role-based control, team management & activity streams.',
    },
    {
      icon: Zap,
      title: 'AI Lead Scoring',
      description: 'Automated scoring, smart lead routing & workflow triggers.',
    },
    {
      icon: FileText,
      title: 'Invoicing & HR Workflows',
      description: 'Integrated billing, SLAs, attendance & leave management.',
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
          <g stroke="rgba(0, 180, 216, 0.15)" strokeWidth="1">
            <line x1="8%" y1="18%" x2="22%" y2="32%" />
            <line x1="22%" y1="32%" x2="14%" y2="58%" />
            <line x1="22%" y1="32%" x2="38%" y2="28%" />
            <line x1="38%" y1="28%" x2="52%" y2="42%" />
            <line x1="52%" y1="42%" x2="68%" y2="22%" />
            <line x1="68%" y1="22%" x2="82%" y2="32%" />
            <line x1="68%" y1="22%" x2="62%" y2="62%" />
            <line x1="52%" y1="42%" x2="48%" y2="72%" />
            <line x1="14%" y1="58%" x2="32%" y2="78%" />
            <line x1="32%" y1="78%" x2="48%" y2="72%" />
            <line x1="48%" y1="72%" x2="72%" y2="82%" />
            <line x1="72%" y1="82%" x2="88%" y2="68%" />
          </g>
          {[
            { cx: '8%', cy: '18%' },
            { cx: '22%', cy: '32%' },
            { cx: '14%', cy: '58%' },
            { cx: '38%', cy: '28%' },
            { cx: '52%', cy: '42%' },
            { cx: '68%', cy: '22%' },
            { cx: '82%', cy: '32%' },
            { cx: '62%', cy: '62%' },
            { cx: '48%', cy: '72%' },
            { cx: '32%', cy: '78%' },
            { cx: '72%', cy: '82%' },
            { cx: '88%', cy: '68%' },
          ].map((pt, i) => (
            <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#00B4D8" />
          ))}
        </svg>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10 py-6">

        {/* Left Column: Branding, Value Prop & Feature Highlights */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
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
            Run your entire business
            <span className="block text-[#00B4D8] mt-1">from one place.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300/80 max-w-lg mt-4 mb-8 leading-relaxed font-normal">
            Set up your company workspace in under 2 minutes. Your team can start closing deals today.
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

        {/* Right Column: Floating White Registration Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/20 text-slate-800 w-full max-w-[500px] mx-auto relative">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create your workspace
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Register your company and get started instantly
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl text-xs flex items-center gap-2 border border-rose-200 bg-rose-50 text-rose-700">
                <span className="font-bold uppercase px-1.5 py-0.5 rounded text-white text-[9px] bg-rose-500">
                  Error
                </span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Company Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  COMPANY NAME <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nuero Link"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  YOUR FULL NAME <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  WORK EMAIL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="john@acmecorp.com"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Phone & Team Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    PHONE NUMBER
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    PASSWORD <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 transition-all bg-white"
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
              </div>

              {/* Benefits */}
                <div className="pt-1 text-xs space-y-1 text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                    <span>Automatic workspace <strong>Owner</strong> role and full tenant isolation.</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#00B4D8] hover:bg-[#0096B4] text-white font-bold text-sm shadow-lg shadow-[#00B4D8]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-3"
                >
                  {loading ? (
                    <span>Creating Workspace...</span>
                  ) : (
                    <>
                      <span>Create Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-[#00B4D8] hover:underline inline-flex items-center gap-1"
              >
                Sign In <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
