'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LayoutWrapper from '@/components/layout-wrapper';
import { api } from '@/services/api';
import {
  Users, Palette, Shield, Sparkles, UserPlus, Trash2, Check,
  Save, AlertCircle, Building, Mail, Send, Activity, Clock,
  Lock, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') as any) || 'team';

  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'team' | 'email' | 'channels' | 'roles' | 'audit' | 'company' | 'super'>(initialTab);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Team state
  const [teammates, setTeammates] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Welcome123!');
  const [newUserRole, setNewUserRole] = useState('marketer');
  const [inviting, setInviting] = useState(false);

  // Email Integration state
  const [emailProvider, setEmailProvider] = useState<'resend' | 'smtp'>('resend');
  const [resendApiKey, setResendApiKey] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpTls, setSmtpTls] = useState(true);
  const [emailFrom, setEmailFrom] = useState('');
  const [emailSenderName, setEmailSenderName] = useState('Catalyst CRM');
  const [emailReplyTo, setEmailReplyTo] = useState('');
  const [emailStatus, setEmailStatus] = useState<string>('connected');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  // Channels state
  const [channels, setChannels] = useState<any[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Company Profile state
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [campaignTone, setCampaignTone] = useState('Executive & Direct');
  const [emailFooter, setEmailFooter] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  // Super Admin state
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingSuper, setLoadingSuper] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('catalyst_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setCompanyName(u.company?.name || '');
        setCompanyIndustry(u.company?.industry || 'B2B SaaS');
        setCompanySize(u.company?.size || '11-50');
        setCampaignTone(u.company?.campaign_tone || 'Executive & Direct');
        setEmailFooter(u.company?.email_footer || `© ${u.company?.name || 'Catalyst'}. All rights reserved.`);
        if (u.email) {
          setTestEmailRecipient(u.email);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const loadTeammates = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getTeammates();
      setTeammates(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team directory');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadEmailSettings = async () => {
    setLoadingEmail(true);
    try {
      const res = await api.getEmailSettings();
      if (res) {
        setEmailProvider(res.provider === 'smtp' ? 'smtp' : 'resend');
        setEmailFrom(res.sender_email || res.from_email || 'onboarding@resend.dev');
        setEmailSenderName(res.sender_name || 'Catalyst CRM');
        setEmailReplyTo(res.reply_to || '');
        setEmailStatus(res.status || 'connected');
        setHasApiKey(Boolean(res.has_api_key));
        if (res.config) {
          setResendApiKey(res.config.api_key || '');
          setSmtpHost(res.config.host || '');
          setSmtpPort(String(res.config.port || 587));
          setSmtpUser(res.config.username || '');
          setSmtpTls(res.config.use_tls !== false);
        }
      }
    } catch (err: any) {
      console.error('Email settings load error:', err);
    } finally {
      setLoadingEmail(false);
    }
  };

  const loadChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await api.getChannels();
      setChannels(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.getAuditLogs();
      setAuditLogs(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadSuperData = async () => {
    setLoadingSuper(true);
    try {
      const comps = await api.superGetCompanies();
      setCompanies(comps || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingSuper(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'team') loadTeammates();
    else if (activeTab === 'email') loadEmailSettings();
    else if (activeTab === 'channels') loadChannels();
    else if (activeTab === 'audit') loadAuditLogs();
    else if (activeTab === 'super' && user?.role === 'super_admin') loadSuperData();
  }, [activeTab, user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.inviteTeammate({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      setSuccess(`Invited ${newUserName} as ${newUserRole.toUpperCase()}`);
      setShowInviteModal(false);
      setNewUserName('');
      setNewUserEmail('');
      loadTeammates();
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (teammateId: string, currentName: string, newRole: string) => {
    setError(null);
    try {
      await api.updateTeammate(teammateId, { name: currentName, role: newRole });
      setSuccess(`Updated role to ${newRole.toUpperCase()}`);
      loadTeammates();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleDeleteTeammate = async (teammateId: string) => {
    if (!confirm('Remove this teammate from the workspace?')) return;
    try {
      await api.deleteTeammate(teammateId);
      setSuccess('Teammate removed');
      loadTeammates();
    } catch (err: any) {
      setError(err.message || 'Failed to remove teammate');
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmail(true);
    setError(null);
    setSuccess(null);

    const config: Record<string, any> = {};
    if (emailProvider === 'resend') {
      config.api_key = resendApiKey;
    } else {
      config.host = smtpHost;
      config.port = parseInt(smtpPort, 10) || 587;
      config.username = smtpUser;
      if (smtpPassword) config.password = smtpPassword;
      config.use_tls = smtpTls;
    }

    try {
      const res = await api.updateEmailSettings({
        provider: emailProvider,
        sender_name: emailSenderName,
        from_email: emailFrom,
        reply_to: emailReplyTo,
        config,
      });
      setSuccess(res?.message || 'Email provider configuration saved successfully!');
      setEmailStatus('connected');
      setHasApiKey(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save email settings');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestEmailConfig = async () => {
    if (!testEmailRecipient.trim()) {
      setError('Please enter a test recipient email address');
      return;
    }
    setTestingEmail(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.testEmailSettings(testEmailRecipient.trim());
      setSuccess(`Test email sent successfully! Message ID: ${res?.provider_message_id || 'OK'}`);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch test email. Check configuration.');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setError(null);
    setSuccess(null);
    try {
      await api.updateCompanyBranding({
        name: companyName,
        industry: companyIndustry,
        size: companySize,
        campaign_tone: campaignTone,
        email_footer: emailFooter,
      });
      setSuccess('Company identity updated');
      if (user) {
        const updated = {
          ...user,
          company: { ...user.company, name: companyName, campaign_tone: campaignTone, email_footer: emailFooter }
        };
        localStorage.setItem('catalyst_user', JSON.stringify(updated));
        setUser(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update company identity');
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6 pb-12 font-mono text-white w-full">
        
        {/* Header */}
        <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654]">
          <h1 className="text-2xl font-bold">Workspace Configuration & Security</h1>
          <p className="text-xs text-[#5F6878] mt-1">
            Manage team roles, email deliverability providers, channel matrix, and immutable audit logs.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg border border-[#0B85FC] bg-[rgba(11,133,252,0.06)] text-xs text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-white" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'team', label: 'Team Members', icon: Users },
            { id: 'email', label: 'Email Provider', icon: Mail },
            { id: 'channels', label: 'Channels', icon: Layers },
            { id: 'roles', label: 'Roles & RBAC', icon: Lock },
            { id: 'audit', label: 'Audit Logs', icon: Shield },
            { id: 'company', label: 'Company Profile', icon: Building },
            ...(user?.role === 'super_admin' ? [{ id: 'super', label: 'Global Admin', icon: Activity }] : []),
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#0B85FC] text-white font-bold shadow-md shadow-[#0B85FC]/20'
                    : 'text-[#5F6878] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TEAM MEMBERS */}
        {activeTab === 'team' && (
          <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Workspace Team Members</h2>
                <p className="text-xs text-[#5F6878]">Manage users who have access to this tenant workspace.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Teammate</span>
              </button>
            </div>

            {loadingUsers ? (
              <div className="py-8 text-center text-xs text-[#5F6878]">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading team directory...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#5F6878] uppercase text-[10px]">
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Role</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE2EA]/60">
                    {teammates.map((tm: any) => {
                      const isSelf = user?.email === tm.email;
                      return (
                        <tr key={tm.id} className="hover:bg-white/5">
                          <td className="py-3 pr-4 font-semibold text-white">{tm.name}</td>
                          <td className="py-3 pr-4 text-[#5F6878]">{tm.email}</td>
                          <td className="py-3 pr-4">
                            {isSelf ? (
                              <span className="px-2 py-0.5 rounded bg-[#0E141F] text-[10px] uppercase text-white">
                                {tm.role} (You)
                              </span>
                            ) : (
                              <select
                                value={tm.role}
                                onChange={e => handleRoleChange(tm.id, tm.name, e.target.value)}
                                className="bg-[#0E141F] border border-white/10 rounded px-2 py-1 text-xs text-white"
                              >
                                <option value="admin">ADMIN</option>
                                <option value="marketer">MARKETER</option>
                                <option value="analyst">ANALYST</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteTeammate(tm.id)}
                                className="p-1 text-[#5F6878] hover:text-red-400"
                                title="Remove Teammate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EMAIL PROVIDER */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] space-y-5">
              <div>
                <h2 className="text-sm font-bold text-white">Email Provider Integration</h2>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Configure your production email dispatch pipeline. All campaign execution and test emails flow through this provider.
                </p>
              </div>

              {/* Connection Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                emailStatus === 'connected' || hasApiKey
                  ? 'border-[#0B85FC] bg-[rgba(11,133,252,0.06)]'
                  : 'border-white/10 bg-[#0E141F]'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    emailStatus === 'connected' || hasApiKey ? 'bg-[#0DB8FA] animate-pulse' : 'bg-[#5F6878]'
                  }`} />
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {emailStatus === 'connected' || hasApiKey ? 'Email provider connected' : 'Email provider not configured'}
                    </h3>
                    <p className="text-[11px] text-[#5F6878]">
                      Active Provider: {emailProvider === 'resend' ? 'Resend API' : 'Custom SMTP'} &bull; Production delivery pipeline is active.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[rgba(11,133,252,0.08)] text-[#0B85FC] text-[10px] font-mono font-bold uppercase tracking-wider">
                  {emailStatus === 'connected' || hasApiKey ? 'Active' : 'Unconfigured'}
                </span>
              </div>

              <form onSubmit={handleSaveEmailSettings} className="space-y-5 max-w-xl">
                {/* Provider Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Email Provider</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEmailProvider('resend')}
                      className={`p-3 rounded-lg border text-left text-xs ${
                        emailProvider === 'resend'
                          ? 'border-[#0B85FC] bg-[rgba(11,133,252,0.06)] text-white'
                          : 'border-white/10 bg-[#0E141F] text-[#5F6878]'
                      }`}
                    >
                      <p className="font-bold">Resend (Recommended)</p>
                      <p className="text-[10px] text-[#5F6878] mt-0.5">REST API with instant delivery receipts</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailProvider('smtp')}
                      className={`p-3 rounded-lg border text-left text-xs ${
                        emailProvider === 'smtp'
                          ? 'border-[#0B85FC] bg-[rgba(11,133,252,0.06)] text-white'
                          : 'border-white/10 bg-[#0E141F] text-[#5F6878]'
                      }`}
                    >
                      <p className="font-bold">Standard SMTP</p>
                      <p className="text-[10px] text-[#5F6878] mt-0.5">SendGrid, SES, Mailgun, or custom host</p>
                    </button>
                  </div>
                </div>

                {/* Resend Fields */}
                {emailProvider === 'resend' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-[#5F6878] font-bold">Resend API Key *</label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={e => setResendApiKey(e.target.value)}
                      placeholder={hasApiKey ? "•••••••••••••••••••••••• (Configured)" : "re_xxxxxxxxxxxxxxxxxxxxxx"}
                      className="w-full px-3 py-2 rounded-lg bg-[#0E141F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FFFFFF]"
                    />
                    <p className="text-[10px] text-[#5F6878]">
                      API keys are encrypted in secure storage and never exposed to client-side code.
                    </p>
                  </div>
                )}

                {/* SMTP Fields */}
                {emailProvider === 'smtp' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] uppercase text-[#5F6878] font-bold">SMTP Host</label>
                        <input
                          required
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                          placeholder="smtp.sendgrid.net"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-[#5F6878] font-bold">Port</label>
                        <input
                          required
                          value={smtpPort}
                          onChange={e => setSmtpPort(e.target.value)}
                          placeholder="587"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-[#5F6878] font-bold">Username</label>
                        <input
                          value={smtpUser}
                          onChange={e => setSmtpUser(e.target.value)}
                          placeholder="apikey"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-[#5F6878] font-bold">Password</label>
                        <input
                          type="password"
                          value={smtpPassword}
                          onChange={e => setSmtpPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* From Name, From Email, and Reply-To */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-[#5F6878] font-bold">From Name *</label>
                    <input
                      required
                      value={emailSenderName}
                      onChange={e => setEmailSenderName(e.target.value)}
                      placeholder="Catalyst CRM"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-[#5F6878] font-bold">From Email Address *</label>
                    <input
                      required
                      value={emailFrom}
                      onChange={e => setEmailFrom(e.target.value)}
                      placeholder="onboarding@resend.dev"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Reply-To Address</label>
                  <input
                    value={emailReplyTo}
                    onChange={e => setEmailReplyTo(e.target.value)}
                    placeholder="support@catalystcrm.io"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingEmail}
                  className="px-4 py-2 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-md shadow-[#0B85FC]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Email Configuration</span>
                </button>
              </form>
            </div>

            {/* Test Email Card */}
            <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Verify Provider Integration</h3>
              </div>
              <p className="text-xs text-[#5F6878]">
                Sends a test verification email directly using the active provider credentials to ensure DNS and SMTP handshake pass.
              </p>

              <div className="flex gap-2 max-w-md">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={e => setTestEmailRecipient(e.target.value)}
                  placeholder="recipient@yourdomain.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0E141F] border border-white/10 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleTestEmailConfig}
                  disabled={testingEmail || !testEmailRecipient.trim()}
                  className="px-4 py-2 rounded-lg bg-[#0E141F] hover:bg-white/5 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {testingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Test</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHANNELS */}
        {activeTab === 'channels' && (
          <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">Omnichannel Execution Matrix</h2>
              <p className="text-xs text-[#5F6878]">
                Channel availability in Catalyst V2. Email is active for live execution; next-gen channels are in preview.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'email', name: 'Email Outreach', status: 'Active', badge: 'Live Dispatch', desc: 'Resend / SMTP delivery pipeline with batching, retries, and idempotency.' },
                { id: 'sms', name: 'SMS Text Messaging', status: 'Coming Soon', badge: 'Preview', desc: 'Twilio / Sinch integration for transactional SMS and automated promotions.' },
                { id: 'whatsapp', name: 'WhatsApp Business', status: 'Coming Soon', badge: 'Preview', desc: 'Meta Cloud API integration with verified template approvals.' },
                { id: 'phone', name: 'AI Voice Calling', status: 'Coming Soon', badge: 'Preview', desc: 'Real-time conversational voice agent for customer qualification.' },
                { id: 'rcs', name: 'RCS Business Messaging', status: 'Coming Soon', badge: 'Preview', desc: 'Rich communication service with verified sender brands and interactive carousels.' },
                { id: 'push', name: 'Push Notifications', status: 'Coming Soon', badge: 'Preview', desc: 'Web and mobile push notification relays.' },
              ].map(ch => (
                <div key={ch.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{ch.name}</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${ch.status === 'Active' ? 'bg-[#0B85FC] text-white font-bold shadow-md shadow-[#0B85FC]/20' : 'bg-[#0E141F] text-[#5F6878]'}`}>
                      {ch.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5F6878] leading-relaxed">{ch.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ROLES & RBAC */}
        {activeTab === 'roles' && (
          <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">Role-Based Access Control (RBAC)</h2>
              <p className="text-xs text-[#5F6878]">
                Granular permission matrix enforced at API and database row-level security layers.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#5F6878] uppercase text-[10px]">
                    <th className="pb-3 pr-4">Permission / Scope</th>
                    <th className="pb-3 pr-4 text-center">OWNER</th>
                    <th className="pb-3 pr-4 text-center">ADMIN</th>
                    <th className="pb-3 pr-4 text-center">MARKETER</th>
                    <th className="pb-3 text-center">ANALYST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EA]/60">
                  {[
                    { name: 'View Dashboard & Analytics', o: true, a: true, m: true, an: true },
                    { name: 'Explore Customers & 360 Records', o: true, a: true, m: true, an: false },
                    { name: 'Create & Launch Campaigns', o: true, a: true, m: true, an: false },
                    { name: 'AI Campaign Studio Access', o: true, a: true, m: true, an: false },
                    { name: 'Send Real Test Emails', o: true, a: true, m: true, an: false },
                    { name: 'Configure Email Provider (Resend/SMTP)', o: true, a: true, m: false, an: false },
                    { name: 'Invite & Manage Team Members', o: true, a: true, m: false, an: false },
                    { name: 'Inspect Tenant Audit Logs', o: true, a: true, m: false, an: false },
                    { name: 'Transfer Ownership or Delete Tenant', o: true, a: false, m: false, an: false },
                  ].map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-2.5 pr-4 text-white">{p.name}</td>
                      <td className="py-2.5 pr-4 text-center">{p.o ? '✓' : '—'}</td>
                      <td className="py-2.5 pr-4 text-center">{p.a ? '✓' : '—'}</td>
                      <td className="py-2.5 pr-4 text-center">{p.m ? '✓' : '—'}</td>
                      <td className="py-2.5 text-center">{p.an ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Immutable Workspace Audit Ledger</h2>
                <p className="text-xs text-[#5F6878]">Timestamped record of administrative, campaign, and authentication events.</p>
              </div>
              <button
                onClick={loadAuditLogs}
                className="p-1.5 rounded bg-[rgba(11,133,252,0.08)] text-[#0B85FC] hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingAudit ? (
              <div className="py-8 text-center text-xs text-[#5F6878]">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading audit ledger...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5F6878]">
                No audit events recorded yet for this workspace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#5F6878] uppercase text-[10px]">
                      <th className="pb-3 pr-4">Timestamp</th>
                      <th className="pb-3 pr-4">Action</th>
                      <th className="pb-3 pr-4">Entity</th>
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 text-right">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE2EA]/60">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="py-2.5 pr-4 text-[#5F6878]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold text-white">{log.action}</td>
                        <td className="py-2.5 pr-4 text-white">{log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)})` : ''}</td>
                        <td className="py-2.5 pr-4 text-[#5F6878]">{log.user_email || 'System'}</td>
                        <td className="py-2.5 text-right text-[#5F6878] font-mono">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: COMPANY PROFILE */}
        {activeTab === 'company' && (
          <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">Workspace Identity & Voice</h2>
              <p className="text-xs text-[#5F6878]">Company parameters utilized by LangGraph creative agents.</p>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 max-w-lg">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#5F6878] font-bold">Company Name</label>
                <input
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Industry</label>
                  <input
                    value={companyIndustry}
                    onChange={e => setCompanyIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Company Size</label>
                  <input
                    value={companySize}
                    onChange={e => setCompanySize(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#5F6878] font-bold">Campaign Voice & Tone</label>
                <input
                  value={campaignTone}
                  onChange={e => setCampaignTone(e.target.value)}
                  placeholder="e.g. Executive, Direct, Authoritative"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#5F6878] font-bold">Default Email Signature / Footer</label>
                <textarea
                  rows={3}
                  value={emailFooter}
                  onChange={e => setEmailFooter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingCompany}
                className="px-4 py-2 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-md shadow-[#0B85FC]/20 flex items-center gap-1.5 cursor-pointer"
              >
                {savingCompany ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Company Settings</span>
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-mono"
            onClick={e => { if (e.target === e.currentTarget) setShowInviteModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#1E222B] to-[#2F3654] text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h2 className="text-sm font-bold">Invite Teammate to Workspace</h2>
                <button onClick={() => setShowInviteModal(false)} className="text-[#5F6878] hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Name *</label>
                  <input
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="Alex Smith"
                    className="w-full px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Email *</label>
                  <input
                    required
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="alex@enterprise.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Password *</label>
                  <input
                    required
                    type="password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-[#5F6878] font-bold">Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1E222B] border border-[#2F3654] text-xs text-[#FFFFFF] placeholder-[#AAB3C2] focus:outline-none focus:border-[#0B85FC] transition-colors"
                  >
                    <option value="admin">ADMIN</option>
                    <option value="marketer">MARKETER</option>
                    <option value="analyst">ANALYST</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2 rounded bg-white/5 text-xs text-[#5F6878]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 py-2 rounded-lg bg-[#0B85FC] hover:bg-[#0B85FC]/90 text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    {inviting ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </LayoutWrapper>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <LayoutWrapper>
          <div className="p-12 text-center font-mono text-xs text-[#5F6878]">
            Loading workspace configurations...
          </div>
        </LayoutWrapper>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
