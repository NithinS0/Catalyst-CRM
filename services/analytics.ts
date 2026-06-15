import { request } from './api';

export const analyticsService = {
  getAnalyticsStats: () => request('/api/analytics/stats'),
  getAnalyticsSummary: () => request('/api/analytics/summary'),
  getRealtimeEvents: (limit = 30) => request(`/api/webhooks/events?limit=${limit}`),
};
