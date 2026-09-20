import { request } from './client';

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  logo_url?: string;
  primary_color?: string;
  plan: string;
  status: string;
  created_at: string;
  users_count: number;
  customers_count: number;
}

export interface GlobalMetrics {
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_customers: number;
  total_campaigns: number;
  total_messages: number;
}

export interface StorageMetrics {
  database_usage_mb: number;
  vector_usage_mb: number;
  total_limit_mb: number;
}

export interface AiUsageMetrics {
  llm_requests: number;
  tokens_consumed: number;
  cost_estimation: number;
}

export interface SuperMetricsResponse {
  metrics: GlobalMetrics;
  storage: StorageMetrics;
  ai_usage: AiUsageMetrics;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  company_name: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export const superAdminService = {
  superGetMetrics: async (): Promise<SuperMetricsResponse> => {
    return request<SuperMetricsResponse>('/api/super/metrics');
  },

  superGetCompanies: async (): Promise<Company[]> => {
    return request<Company[]>('/api/super/companies');
  },

  superCreateCompany: async (data: Partial<Company>): Promise<Company> => {
    return request<Company>('/api/super/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  superUpdateStatus: async (companyId: string, status: string): Promise<Company> => {
    return request<Company>(`/api/super/companies/${companyId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  superDeleteCompany: async (companyId: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/api/super/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  superGetActivity: async (): Promise<RecentActivityItem[]> => {
    return request<RecentActivityItem[]>('/api/super/activity');
  },
};
