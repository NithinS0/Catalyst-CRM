import { request } from './client';

export const campaignService = {
  getCampaigns: () => request('/api/campaigns'),
  
  createCampaign: (campaign: any) =>
    request('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    }),
    
  approveStudioCampaign: (payload: {
    marketing_goal: string;
    segment_name: string;
    segment_rules: any[];
    channel: string;
    content_template: string;
    description?: string;
  }) =>
    request('/api/campaigns/approve-studio-campaign', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    
  triggerCampaign: (campaignId: string) =>
    request(`/api/campaigns/${campaignId}/trigger`, {
      method: 'POST',
    }),

  sendTestEmail: (campaignId: string, testEmail?: string) =>
    request(`/api/campaigns/${campaignId}/test-email`, {
      method: 'POST',
      body: JSON.stringify({ recipient_email: testEmail }),
    }),

  sendAdhocTestEmail: (subject: string, contentTemplate: string, recipientEmail?: string) =>
    request('/api/campaigns/send-test-email', {
      method: 'POST',
      body: JSON.stringify({
        subject,
        content_template: contentTemplate,
        recipient_email: recipientEmail,
      }),
    }),

  getExecutionMonitor: (campaignId: string) =>
    request<any>(`/api/campaigns/${campaignId}/monitor`),

  getCampaignReport: (campaignId: string) =>
    request<{ report: string }>(`/api/campaigns/${campaignId}/report`),

  deleteCampaign: (campaignId: string) =>
    request(`/api/campaigns/${campaignId}`, { method: 'DELETE' }),
};
