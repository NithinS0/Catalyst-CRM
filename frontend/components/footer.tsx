'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('catalyst_user')) {
        setIsLoggedIn(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const getProductHref = (route: string) => {
    const target = route.startsWith('/app/') ? route : `/app${route}`;
    return isLoggedIn ? target : `/login?redirect=${encodeURIComponent(target)}`;
  };

  const linkStyle = { color: '#5F6878' };

  return (
    <footer className="mt-16 relative z-10" style={{ borderTop: '1px solid #DDE2EA', background: '#F7F9FC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">

          {/* ─── Brand Column ─── */}
          <div className="col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/crmlogo_light.png"
                alt="Catalyst"
                className="h-8 w-auto object-contain"
              />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                style={{ background: 'rgba(11,133,252,0.10)', color: '#0B85FC', border: '1px solid rgba(11,133,252,0.20)' }}>V2</span>
            </Link>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: '#5F6878' }}>
              From customer data to intelligent action.
            </p>
            <p className="text-xs max-w-sm leading-relaxed" style={{ color: '#8B96A5' }}>
              Your AI-native CRM for discovering opportunities, creating personalized campaigns, and turning customer intelligence into measurable engagement.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono"
              style={{ background: 'rgba(11,133,252,0.08)', border: '1px solid rgba(11,133,252,0.18)', color: '#0B85FC' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0DB8FA' }} />
              <span>Free During Early Access</span>
            </div>
          </div>

          {/* ─── Product ─── */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#1E222B' }}>Product</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Dashboard', href: getProductHref('/dashboard') },
                { label: 'AI Campaign Studio', href: getProductHref('/campaign-studio') },
                { label: 'Analytics', href: getProductHref('/analytics') },
                { label: 'Customers', href: getProductHref('/customers') },
                { label: 'Segments', href: getProductHref('/segments') },
                { label: 'Campaigns', href: getProductHref('/campaigns') },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={linkStyle}
                    className="transition-colors hover:text-[#0B85FC]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Company ─── */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#1E222B' }}>Company</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Blog', href: '/blog' },
                { label: 'Careers', href: '/careers' },
                { label: 'Press', href: '/press' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={linkStyle}
                    className="transition-colors hover:text-[#0B85FC]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Legal ─── */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#1E222B' }}>Legal</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Security', href: '/security' },
                { label: 'GDPR', href: '/gdpr' },
                { label: 'SOC 2', href: '/soc2' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={linkStyle}
                    className="transition-colors hover:text-[#0B85FC]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 gap-4 text-xs"
          style={{ borderTop: '1px solid #DDE2EA', color: '#8B96A5' }}>
          <span>© {new Date().getFullYear()} Catalyst. All rights reserved. AI-Native CRM Platform.</span>
          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="transition-colors hover:text-[#0B85FC]" style={{ color: '#5F6878' }}>
              GitHub
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
              className="transition-colors hover:text-[#0B85FC]" style={{ color: '#5F6878' }}>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
