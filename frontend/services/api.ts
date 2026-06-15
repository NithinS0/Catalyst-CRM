export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'API request failed' }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

import { customerService } from './customers';
import { campaignService } from './campaigns';
import { analyticsService } from './analytics';
import { agentService } from './agents';

export const api = {
  ...customerService,
  ...campaignService,
  ...analyticsService,
  ...agentService,
};
