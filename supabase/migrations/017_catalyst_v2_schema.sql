-- Migration 017: Catalyst V2 Complete Schema & Multi-Tenancy Enhancements

-- 1. Create company_members table for team management
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'marketer', -- owner, admin, marketer, analyst
    status TEXT NOT NULL DEFAULT 'active', -- active, invited, suspended
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_email ON public.company_members(email);

-- 2. Create integrations table for company-level third-party credentials (e.g., Resend, SendGrid, SMTP)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- resend, smtp, sendgrid, ses, whatsapp, twilio
    category TEXT NOT NULL DEFAULT 'email', -- email, sms, messaging
    config JSONB NOT NULL DEFAULT '{}'::jsonb, -- encrypted or masked API keys, sender addresses, ports
    status TEXT NOT NULL DEFAULT 'disconnected', -- connected, disconnected, error
    last_tested_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_company ON public.integrations(company_id);

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    action TEXT NOT NULL, -- login, campaign_created, campaign_launched, customer_imported, team_invited, settings_updated
    resource_type TEXT NOT NULL, -- campaign, customer, segment, team, settings, auth
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 4. Create campaign_recipients view / table to ensure compatibility with campaign_deliveries
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, queued, sending, sent, delivered, opened, clicked, bounced, failed
    idempotency_key TEXT UNIQUE,
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON public.campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_company ON public.campaign_recipients(company_id);

-- 5. Ensure company fields for V2
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS email_sender_name TEXT DEFAULT 'Catalyst Team',
ADD COLUMN IF NOT EXISTS email_sender_address TEXT,
ADD COLUMN IF NOT EXISTS email_reply_to TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS number_of_users TEXT,
ADD COLUMN IF NOT EXISTS default_channel TEXT DEFAULT 'email';

-- 6. Ensure campaigns fields for V2
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS reply_to TEXT,
ADD COLUMN IF NOT EXISTS target_channel TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS launched_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 7. Ensure communications and communication_events support provider tracking
ALTER TABLE public.communications
ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_communications_idempotency ON public.communications(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_communications_provider_msg ON public.communications(provider_message_id);

-- 8. Enable Row Level Security on new tables
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies using public.get_user_company_id()
DROP POLICY IF EXISTS "company_members_policy" ON public.company_members;
CREATE POLICY "company_members_policy" ON public.company_members
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "integrations_policy" ON public.integrations;
CREATE POLICY "integrations_policy" ON public.integrations
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "audit_logs_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_policy" ON public.audit_logs
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "campaign_recipients_policy" ON public.campaign_recipients;
CREATE POLICY "campaign_recipients_policy" ON public.campaign_recipients
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());

-- Service role bypasses for background execution
DROP POLICY IF EXISTS "service_role_company_members" ON public.company_members;
CREATE POLICY "service_role_company_members" ON public.company_members FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_integrations" ON public.integrations;
CREATE POLICY "service_role_integrations" ON public.integrations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_audit_logs" ON public.audit_logs;
CREATE POLICY "service_role_audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_campaign_recipients" ON public.campaign_recipients;
CREATE POLICY "service_role_campaign_recipients" ON public.campaign_recipients FOR ALL TO service_role USING (true) WITH CHECK (true);
