import { request } from './api';

export const customerService = {
  getCustomers: () => request('/api/customers'),
  getCustomer: (id: string) => request(`/api/customers/${id}`),
  createCustomer: (customer: Record<string, unknown>) =>
    request('/api/customers', { method: 'POST', body: JSON.stringify(customer) }),
  updateCustomer: (id: string, updates: Record<string, unknown>) =>
    request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteCustomer: (id: string) =>
    request(`/api/customers/${id}`, { method: 'DELETE' }),
  addInteraction: (customerId: string, interaction: Record<string, unknown>) =>
    request(`/api/customers/${customerId}/interactions`, {
      method: 'POST',
      body: JSON.stringify(interaction),
    }),
  getCustomerOrders: (customerId: string) =>
    request(`/api/customers/${customerId}/orders`),
  getSegments: () => request('/api/segments'),
  createSegment: (segment: Record<string, unknown>) =>
    request('/api/segments', { method: 'POST', body: JSON.stringify(segment) }),
  evaluateSegment: (segmentId: string) => request(`/api/segments/${segmentId}/evaluate`),
};
