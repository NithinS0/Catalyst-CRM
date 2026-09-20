'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building, Globe, Phone, MapPin, Briefcase, Users,
  Database, ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, Check, Upload, Folder, ShieldCheck
} from 'lucide-react';
import { authService } from '@/services/auth';

const INDUSTRIES = [
  'Retail',
  'Fashion',
  'Beauty',
  'Food & Beverage',
  'Electronics',
  'E-commerce',
  'SaaS',
  'Other',
];

const COMPANY_SIZES = [
  { label: '1 - 10 employees', value: '1-10' },
  { label: '11 - 50 employees', value: '11-50' },
  { label: '51 - 250 employees', value: '51-250' },
  { label: '250+ enterprise', value: '250+' },
];

const USER_COUNTS = [
  { label: '1 - 5 users', value: '1-5' },
  { label: '6 - 20 users', value: '6-20' },
  { label: '21 - 50 users', value: '21-50' },
  { label: '50+ users', value: '50+' },
];

const DATA_MODES = [
  {
    id: 'demo',
    title: 'Use Demo Data',
    desc: 'Explore Catalyst instantly with 100 realistic customers, orders, purchase history, and pre-built segments.',
    badge: 'Recommended',
    icon: Database,
  },
  {
    id: 'import',
    title: 'Import Customer Data',
    desc: 'Prepare your workspace for CSV, Shopify, or PostgreSQL customer data import.',
    badge: 'Custom',
    icon: Upload,
  },
  {
    id: 'empty',
    title: 'Start Empty',
    desc: 'Begin with a blank slate and manually add customers or connect integrations later.',
    badge: 'Clean',
    icon: Folder,
  },
];

export default function OnboardPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Company Information
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 2: Industry
  const [industry, setIndustry] = useState('E-commerce');

  // Step 3: Company Size
  const [companySize, setCompanySize] = useState('1-10');

  // Step 4: Number of Users
  const [numberOfUsers, setNumberOfUsers] = useState('1-5');

  // Step 5: Customer Data Mode
  const [dataMode, setDataMode] = useState('demo');

  // Load existing company profile from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem('catalyst_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.company) {
          setCompanyName(u.company.name || '');
          setWebsite(u.company.website || '');
          setPhone(u.company.phone || '');
          setAddress(u.company.address || '');
          if (u.company.industry) setIndustry(u.company.industry);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleNext = () => {
    setError(null);
    if (step === 1 && !companyName.trim()) {
      setError('Please provide your company name.');
      return;
    }
    if (step < 6) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    let companyId: string | undefined;
    try {
      const stored = localStorage.getItem('catalyst_user');
      if (stored) {
        const u = JSON.parse(stored);
        companyId = u.company_id || u.company?.id;
      }
    } catch {
      // ignore
    }

    try {
      await authService.completeWorkspaceOnboarding({
        company_id: companyId,
        industry,
        company_size: companySize,
        number_of_users: numberOfUsers,
        website: website.trim() || undefined,
        data_mode: dataMode,
      });

      // Update localStorage company info
      try {
        const stored = localStorage.getItem('catalyst_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.company) {
            u.company.industry = industry;
            u.company.company_size = companySize;
            u.company.number_of_users = numberOfUsers;
            u.company.website = website;
          }
          localStorage.setItem('catalyst_user', JSON.stringify(u));
        }
      } catch {
        // ignore
      }

      router.push('/app/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete workspace onboarding';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1E222B] flex flex-col justify-between selection:bg-[#2B2B2B] selection:text-[#1E222B]">
      {/* Header */}
      <header className="border-b border-[#DDE2EA] py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-extrabold text-xl tracking-tight text-[#1E222B]">CATALYST</span>
          <span className="text-xs px-2 py-0.5 rounded border border-[#DDE2EA] bg-white text-[#1E222B] font-mono">
            Onboarding
          </span>
        </Link>
        <div className="text-xs font-mono text-[#8B96A5]">
          Step {step} of 6
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 my-6">
        <div className="w-full max-w-2xl">
          {/* Step Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-[#8B96A5] font-mono mb-2">
              <span>Setup Progress</span>
              <span>{Math.round((step / 6) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#F7F9FC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2B2B2B] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>

          <div className="border border-[#DDE2EA] rounded-2xl p-8 bg-white shadow-sm">
            {error && (
              <div className="mb-6 p-3.5 rounded-lg border border-[#DDE2EA] bg-[#F7F9FC] text-sm text-[#1E222B] flex items-center gap-2">
                <span className="font-semibold text-xs uppercase px-1.5 py-0.5 bg-[#2B2B2B] text-white rounded">
                  Error
                </span>
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Company Information */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1E222B]">
                    Step 1: Company Information
                  </h2>
                  <p className="text-sm text-[#5F6878] mt-1">
                    Tell us about your organization to personalize your workspace.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Global Inc."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                      Website (Optional)
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://acme.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        style={{ caretColor: '#0B85FC' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 012-3456"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                          style={{ caretColor: '#0B85FC' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1E222B] mb-1.5 uppercase tracking-wider">
                        Headquarters / City
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="San Francisco, CA"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#DDE2EA] bg-white text-sm text-[#1E222B] placeholder-[#5F6878] focus:outline-none focus:border-[#0B85FC] transition-colors"
                          style={{ caretColor: '#0B85FC' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Industry */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1E222B]">
                    Step 2: Industry
                  </h2>
                  <p className="text-sm text-[#5F6878] mt-1">
                    Select your primary sector so Catalyst AI agents tailor copy and metrics.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {INDUSTRIES.map((ind) => {
                    const isSelected = industry === ind;
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setIndustry(ind)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#DDE2EA] bg-[#F7F9FC] ring-1 ring-[#2B2B2B]'
                            : 'border-[#DDE2EA] hover:border-[#0B85FC] bg-white'
                        }`}
                      >
                        <Briefcase className={`w-5 h-5 mb-3 ${isSelected ? 'text-[#1E222B]' : 'text-[#8B96A5]'}`} />
                        <span className="text-sm font-semibold text-[#1E222B]">{ind}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Company Size */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1E222B]">
                    Step 3: Company Size
                  </h2>
                  <p className="text-sm text-[#5F6878] mt-1">
                    How many people work at your company?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COMPANY_SIZES.map((sz) => {
                    const isSelected = companySize === sz.value;
                    return (
                      <button
                        key={sz.value}
                        type="button"
                        onClick={() => setCompanySize(sz.value)}
                        className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#DDE2EA] bg-[#F7F9FC] ring-1 ring-[#2B2B2B]'
                            : 'border-[#DDE2EA] hover:border-[#0B85FC] bg-white'
                        }`}
                      >
                        <span className="text-sm font-semibold text-[#1E222B]">{sz.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#1E222B]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Number of Users */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1E222B]">
                    Step 4: Number of Users
                  </h2>
                  <p className="text-sm text-[#5F6878] mt-1">
                    How many marketers and analysts will be accessing Catalyst?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {USER_COUNTS.map((uc) => {
                    const isSelected = numberOfUsers === uc.value;
                    return (
                      <button
                        key={uc.value}
                        type="button"
                        onClick={() => setNumberOfUsers(uc.value)}
                        className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#DDE2EA] bg-[#F7F9FC] ring-1 ring-[#2B2B2B]'
                            : 'border-[#DDE2EA] hover:border-[#0B85FC] bg-white'
                        }`}
                      >
                        <span className="text-sm font-semibold text-[#1E222B]">{uc.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#1E222B]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Customer Data Mode */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1E222B]">
                    Step 5: Customer Data
                  </h2>
                  <p className="text-sm text-[#5F6878] mt-1">
                    Choose how to seed your new workspace. All generated demo data is completely isolated to your tenant.
                  </p>
                </div>

                <div className="space-y-3">
                  {DATA_MODES.map((dm) => {
                    const isSelected = dataMode === dm.id;
                    const Icon = dm.icon;
                    return (
                      <button
                        key={dm.id}
                        type="button"
                        onClick={() => setDataMode(dm.id)}
                        className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#DDE2EA] bg-[#F7F9FC] ring-1 ring-[#2B2B2B]'
                            : 'border-[#DDE2EA] hover:border-[#0B85FC] bg-white'
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg border border-[#DDE2EA] bg-white mt-0.5`}>
                          <Icon className="w-5 h-5 text-[#1E222B]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#1E222B]">{dm.title}</span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#DDE2EA] bg-white text-[#5F6878]">
                              {dm.badge}
                            </span>
                          </div>
                          <p className="text-xs text-[#5F6878] mt-1 leading-relaxed">{dm.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#1E222B] mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Complete Workspace */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DDE2EA] text-xs font-mono text-[#5F6878] mb-2 bg-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E222B]" /> Ready for Launch
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1E222B]">
                    Step 6: Complete Workspace
                  </h2>
                  <p className="text-sm text-[#5F6878] mt-1">
                    Review your setup before entering your Catalyst dashboard.
                  </p>
                </div>

                <div className="border border-[#DDE2EA] rounded-xl p-5 bg-[#F7F9FC] space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-[rgba(43,43,43,0.06)]">
                    <span className="text-[#8B96A5]">Company Name</span>
                    <span className="font-medium text-[#1E222B]">{companyName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[rgba(43,43,43,0.06)]">
                    <span className="text-[#8B96A5]">Industry</span>
                    <span className="font-medium text-[#1E222B]">{industry}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[rgba(43,43,43,0.06)]">
                    <span className="text-[#8B96A5]">Company Size</span>
                    <span className="font-medium text-[#1E222B]">{companySize}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[rgba(43,43,43,0.06)]">
                    <span className="text-[#8B96A5]">Expected Users</span>
                    <span className="font-medium text-[#1E222B]">{numberOfUsers}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8B96A5]">Initial Data Mode</span>
                    <span className="font-medium text-[#1E222B] uppercase text-xs">{dataMode}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#DDE2EA] bg-white flex items-center gap-3 text-xs text-[#5F6878]">
                  <Sparkles className="w-4 h-4 text-[#1E222B] shrink-0" />
                  <span>
                    Catalyst is currently <strong>free during early access</strong>. Your multi-tenant database is provisioned and ready.
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#DDE2EA]">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-[#DDE2EA] text-xs font-medium text-[#1E222B] hover:bg-[#F7F9FC] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#2B2B2B] text-white text-xs font-medium hover:bg-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Initializing workspace...</span>
                ) : step === 6 ? (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DDE2EA] py-4 text-center text-xs text-[#8B96A5]">
        © {new Date().getFullYear()} Catalyst. All rights reserved. Monochromatic AI-Native CRM.
      </footer>
    </div>
  );
}
