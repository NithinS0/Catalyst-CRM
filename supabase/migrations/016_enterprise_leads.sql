-- Migration: Create enterprise_leads table
CREATE TABLE IF NOT EXISTS public.enterprise_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    company_size TEXT NOT NULL,
    expected_customers TEXT,
    campaign_volume TEXT,
    current_crm TEXT,
    use_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insertions for public sales lead submissions
DROP POLICY IF EXISTS "anon_insert_leads" ON public.enterprise_leads;
CREATE POLICY "anon_insert_leads" ON public.enterprise_leads
    FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to view/manage leads (for internal CRM/Sales views)
DROP POLICY IF EXISTS "authenticated_all_leads" ON public.enterprise_leads;
CREATE POLICY "authenticated_all_leads" ON public.enterprise_leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow service_role to bypass RLS
DROP POLICY IF EXISTS "service_role_all_leads" ON public.enterprise_leads;
CREATE POLICY "service_role_all_leads" ON public.enterprise_leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);
