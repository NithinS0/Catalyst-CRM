import { request } from './client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  company_id?: string;
  company?: {
    id: string;
    name: string;
    slug: string;
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
    brand_voice?: string;
    email_footer?: string;
    campaign_tone?: string;
    industry?: string;
    company_size?: string;
    number_of_users?: string;
    website?: string;
    phone?: string;
    address?: string;
    timezone?: string;
    currency?: string;
    email_sender_name?: string;
    email_sender_address?: string;
    email_reply_to?: string;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  company_name: string;
  company_email?: string;
  phone_number?: string;
  number_of_users?: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user: AuthUser;
}

export interface LoginResponse {
  status: string;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user: AuthUser;
}

export interface EmailSettingsData {
  provider: string;
  status?: string;
  from_email?: string;
  sender_name?: string;
  sender_email?: string;
  reply_to?: string;
  has_api_key?: boolean;
  last_tested_at?: string;
  is_company_override?: boolean;
  config?: Record<string, any>;
}

export interface ChannelInfo {
  id: string;
  name: string;
  status: string;
  badge: string;
  description: string;
  supported: boolean;
}

export interface AuditLogItem {
  id: string;
  user_name?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  onboard: (payload: Record<string, unknown>) =>
    request<LoginResponse>('/api/onboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  completeWorkspaceOnboarding: (payload: {
    industry: string;
    company_size?: string;
    number_of_users?: string;
    website?: string;
    data_mode: string;
    company_id?: string;
  }) =>
    request<{ status: string; message: string; redirect: string }>('/api/onboard/workspace', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getTeammates: () =>
    request<AuthUser[]>('/api/settings/users'),
  inviteTeammate: (payload: Record<string, unknown>) =>
    request<AuthUser>('/api/settings/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTeammate: (userId: string, payload: Record<string, unknown>) =>
    request<AuthUser>(`/api/settings/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTeammate: (userId: string) =>
    request<{ status: string; message: string }>(`/api/settings/users/${userId}`, {
      method: 'DELETE',
    }),
  getCompanyBranding: () =>
    request<Record<string, unknown>>('/api/settings/company'),
  updateCompanyBranding: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/settings/company', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getEmailSettings: () =>
    request<EmailSettingsData>('/api/settings/email'),
  updateEmailSettings: (payload: Record<string, unknown>) =>
    request<{ status: string; message: string }>('/api/settings/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  testEmailSettings: (recipientEmail: string) =>
    request<{ status: string; message: string; provider_message_id?: string }>('/api/settings/email/test', {
      method: 'POST',
      body: JSON.stringify({ recipient_email: recipientEmail }),
    }),
  getChannels: () =>
    request<ChannelInfo[]>('/api/settings/channels'),
  getAuditLogs: () =>
    request<AuditLogItem[]>('/api/settings/audit-logs'),
  superGetCompanies: () =>
    request<Record<string, unknown>[]>('/api/settings/super/companies'),
  superUpdateSubscription: (companyId: string, plan: string) =>
    request<Record<string, unknown>>(`/api/settings/super/companies/${companyId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    }),
  superGetGlobalAnalytics: () =>
    request<Record<string, unknown>>('/api/settings/super/analytics'),
};
