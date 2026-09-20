import { request, API_BASE_URL } from './client';

export const agentService = {
  chatWithAgent: (prompt: string, customerId?: string) =>
    request('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, customer_id: customerId }),
    }),
    
  runCampaignStudio: (marketingGoal: string) =>
    request('/api/agents/campaign-studio', {
      method: 'POST',
      body: JSON.stringify({ marketing_goal: marketingGoal }),
    }),

  streamChatStudio: async (
    messages: { role: string; content: string }[],
    currentState: string,
    campaignId?: string | null,
    proposedCampaign?: any | null
  ) => {
    let token: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('catalyst_user');
        if (stored) {
          token = JSON.parse(stored).token;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (typeof window !== 'undefined') {
      const override = localStorage.getItem('catalyst_override_company');
      if (override) {
        headers['X-Super-Admin-Override-Company-ID'] = override;
      }
    }
    
    return fetch(`${API_BASE_URL}/api/chat-studio/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        current_state: currentState,
        campaign_id: campaignId,
        proposed_campaign: proposedCampaign,
      }),
    });
  },
};
