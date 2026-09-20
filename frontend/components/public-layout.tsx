'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight, ArrowRight } from 'lucide-react';
import Footer from '@/components/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (localStorage.getItem('catalyst_user')) {
        setIsLoggedIn(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    return [
      { label: 'Home', href: '/' },
      ...segments.map((s, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/');
        let label = s.charAt(0).toUpperCase() + s.slice(1);
        if (s === 'soc2') label = 'SOC 2';
        if (s === 'gdpr') label = 'GDPR';
        return { label, href };
      }),
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#F7F9FC', color: '#1E222B' }}>
      {/* ─── Top Navbar ─── */}
      <header className="sticky top-0 z-50 transition-all"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #DDE2EA'
        }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/crmlogo_light.png"
                alt="Catalyst"
                className="h-8 w-auto object-contain"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                style={{ background: 'rgba(11,133,252,0.10)', color: '#0B85FC', border: '1px solid rgba(11,133,252,0.20)' }}>V2</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: '#5F6878' }}>
              <Link href="/#product" className="hover:text-[#0B85FC] transition-colors">Product</Link>
              <Link href="/#ai-agents" className="hover:text-[#0B85FC] transition-colors">AI Agents</Link>
              <Link href="/#how-it-works" className="hover:text-[#0B85FC] transition-colors">How It Works</Link>
              <Link href="/about" className="hover:text-[#0B85FC] transition-colors">About</Link>
              <Link href="/blog" className="hover:text-[#0B85FC] transition-colors">Blog</Link>
              <Link href="/contact" className="hover:text-[#0B85FC] transition-colors">Contact</Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/app/dashboard" className="btn-primary text-sm px-4 py-2">
                Open Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-[rgba(11,133,252,0.06)]"
                  style={{ color: '#1E222B' }}>
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm px-4 py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#1E222B' }}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 space-y-3" style={{ borderTop: '1px solid #DDE2EA', background: 'white' }}>
            {[
              { href: '/', label: 'Home' },
              { href: '/about', label: 'About' },
              { href: '/blog', label: 'Blog' },
              { href: '/contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium py-1 transition-colors" style={{ color: '#1E222B' }}>
                {label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid #DDE2EA' }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium rounded-lg border transition-all"
                style={{ border: '1px solid #DDE2EA', color: '#1E222B' }}>
                Login
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full text-center py-2.5 text-sm justify-center">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 w-full">
        <nav className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#8B96A5' }}>
          {breadcrumbs.map((b, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={b.href}>
                {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: '#C8D0DC' }} />}
                {isLast ? (
                  <span className="font-semibold" style={{ color: '#1E222B' }}>{b.label}</span>
                ) : (
                  <Link href={b.href} className="hover:text-[#0B85FC] transition-colors">
                    {b.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-10 w-full">
        {children}
      </main>

      <Footer />
    </div>
  );
}
