'use client';

import React, { useState } from 'react';
import { Bell, CheckCheck, Megaphone, ShieldCheck, Cpu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'system' | 'campaign' | 'security';
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Campaign Engine Online',
    message: 'Resend & SMTP execution providers initialized with idempotency queue.',
    time: 'Just now',
    type: 'campaign',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Tenant Row-Level Security Enforced',
    message: 'All queries are scoped strictly to your workspace company_id.',
    time: '12m ago',
    type: 'security',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'AI Swarm Agents Ready',
    message: '10 LangGraph agents (Context, Strategy, Creative, Dispatcher, etc.) are available for prompt orchestration.',
    time: '1h ago',
    type: 'system',
    read: true,
  }
];

const typeConfig = {
  campaign: { icon: Megaphone,   color: '#0B85FC', bg: 'rgba(11,133,252,0.12)'  },
  security: { icon: ShieldCheck, color: '#5660F3', bg: 'rgba(86,96,243,0.12)'   },
  system:   { icon: Cpu,         color: '#0DB8FA', bg: 'rgba(13,184,250,0.12)'  },
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative p-2 rounded-lg transition-all cursor-pointer"
        style={{
          background: isOpen ? 'rgba(11,133,252,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isOpen ? 'rgba(11,133,252,0.30)' : 'rgba(255,255,255,0.10)'}`,
          color: isOpen ? '#0B85FC' : '#AAB3C2',
        }}
        onMouseEnter={e => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
            e.currentTarget.style.color = '#FFFFFF';
          }
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = '#AAB3C2';
          }
        }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono"
            style={{ background: '#0B85FC', boxShadow: '0 0 8px rgba(11,133,252,0.50)' }}>
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl z-40 overflow-hidden"
              style={{
                background: '#1E222B',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.25)'
              }}
            >
              {/* Header */}
              <div className="p-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono tracking-wider uppercase" style={{ color: '#F7F9FC' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(11,133,252,0.15)', color: '#0B85FC', border: '1px solid rgba(11,133,252,0.25)' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer"
                    style={{ color: '#5F6878' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0B85FC')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#5F6878')}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono" style={{ color: '#5F6878' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => {
                    const cfg = typeConfig[n.type];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n.id}
                        className="p-3.5 flex items-start justify-between gap-3 transition-colors"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: n.read ? 'transparent' : 'rgba(11,133,252,0.05)',
                          opacity: n.read ? 0.70 : 1,
                        }}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate font-mono" style={{ color: '#F7F9FC' }}>
                              {n.title}
                            </p>
                            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: '#AAB3C2' }}>
                              {n.message}
                            </p>
                            <span className="text-[9px] font-mono mt-1 block" style={{ color: '#5F6878' }}>
                              {n.time}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(n.id)}
                          className="p-1 rounded transition-colors shrink-0 cursor-pointer"
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.20)')}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0E141F' }}>
                <span className="text-[10px] font-mono" style={{ color: '#5F6878' }}>Catalyst Tenant Event Log</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
