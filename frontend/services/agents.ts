import { request } from './api';

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
};
