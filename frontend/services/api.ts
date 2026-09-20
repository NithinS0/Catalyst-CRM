export { request, API_BASE_URL } from './client';

import { customerService } from './customers';
import { campaignService } from './campaigns';
import { analyticsService } from './analytics';
import { agentService } from './agents';
import { authService } from './auth';
import { superAdminService } from './super_admin';

export const api = {
  ...customerService,
  ...campaignService,
  ...analyticsService,
  ...agentService,
  ...authService,
  ...superAdminService,
};
