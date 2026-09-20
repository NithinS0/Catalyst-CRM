-- Migration to add company branding settings
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS brand_voice TEXT DEFAULT 'Professional, helpful, and concise',
ADD COLUMN IF NOT EXISTS email_footer TEXT DEFAULT '© Acme CRM. All rights reserved.',
ADD COLUMN IF NOT EXISTS campaign_tone TEXT DEFAULT 'Professional';

-- Seed initial values for Stark CRM
UPDATE public.companies 
SET 
  secondary_color = '#f87171',
  brand_voice = 'Direct, technical, and authoritative',
  email_footer = '© Stark Industries. Confidentiality Notice Applies.',
  campaign_tone = 'Bold and energetic'
WHERE id = 'c2222222-2222-2222-2222-222222222222';
