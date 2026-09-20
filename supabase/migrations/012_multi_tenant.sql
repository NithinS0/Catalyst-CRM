-- Upgrade Catalyst to Multi-Tenant

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    industry TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#4f46e5',
    plan TEXT DEFAULT 'free' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Companies Policies
DROP POLICY IF EXISTS "authenticated_all_companies" ON public.companies;
CREATE POLICY "authenticated_all_companies" ON public.companies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "service_role_all_companies" ON public.companies;
CREATE POLICY "service_role_all_companies" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Insert default seed companies
INSERT INTO public.companies (id, name, slug, industry, logo_url, primary_color, plan, status)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'Acme CRM Tenant', 'acme', 'Technology', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60', '#4f46e5', 'enterprise', 'active'),
    ('c2222222-2222-2222-2222-222222222222', 'Stark CRM Tenant', 'stark', 'Defense', 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=128&auto=format&fit=crop&q=60', '#ef4444', 'pro', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 3. Add company_id columns as nullable (first, so we can populate them)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.communication_events ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.agent_logs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.memory_documents ADD COLUMN IF NOT EXISTS company_id UUID;

-- 4. Update existing records to link to the default Acme company ID
UPDATE public.profiles SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.customers SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.orders SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.campaigns SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.segments SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.communications SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.communication_events SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.agent_logs SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
UPDATE public.memory_documents SET company_id = 'c1111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;

-- 5. Set columns as NOT NULL and add Foreign Key constraints
ALTER TABLE public.profiles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_company;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.customers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS fk_customers_company;
ALTER TABLE public.customers ADD CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.orders ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_company;
ALTER TABLE public.orders ADD CONSTRAINT fk_orders_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.campaigns ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS fk_campaigns_company;
ALTER TABLE public.campaigns ADD CONSTRAINT fk_campaigns_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.segments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.segments DROP CONSTRAINT IF EXISTS fk_segments_company;
ALTER TABLE public.segments ADD CONSTRAINT fk_segments_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.communications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.communications DROP CONSTRAINT IF EXISTS fk_communications_company;
ALTER TABLE public.communications ADD CONSTRAINT fk_communications_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.communication_events ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.communication_events DROP CONSTRAINT IF EXISTS fk_communication_events_company;
ALTER TABLE public.communication_events ADD CONSTRAINT fk_communication_events_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.agent_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.agent_logs DROP CONSTRAINT IF EXISTS fk_agent_logs_company;
ALTER TABLE public.agent_logs ADD CONSTRAINT fk_agent_logs_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.memory_documents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.memory_documents DROP CONSTRAINT IF EXISTS fk_memory_documents_company;
ALTER TABLE public.memory_documents ADD CONSTRAINT fk_memory_documents_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 6. Helper function to fetch the current user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Drop existing public authenticated RLS policies and replace with company-aware ones
-- Profiles Policies
DROP POLICY IF EXISTS "authenticated_all_profiles" ON public.profiles;
CREATE POLICY "authenticated_all_profiles" ON public.profiles FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Customers Policies
DROP POLICY IF EXISTS "authenticated_all_customers" ON public.customers;
CREATE POLICY "authenticated_all_customers" ON public.customers FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Orders Policies
DROP POLICY IF EXISTS "authenticated_all_orders" ON public.orders;
CREATE POLICY "authenticated_all_orders" ON public.orders FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Segments Policies
DROP POLICY IF EXISTS "authenticated_all_segments" ON public.segments;
CREATE POLICY "authenticated_all_segments" ON public.segments FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Campaigns Policies
DROP POLICY IF EXISTS "authenticated_all_campaigns" ON public.campaigns;
CREATE POLICY "authenticated_all_campaigns" ON public.campaigns FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Communications Policies
DROP POLICY IF EXISTS "authenticated_all_communications" ON public.communications;
CREATE POLICY "authenticated_all_communications" ON public.communications FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Communication Events Policies
DROP POLICY IF EXISTS "authenticated_all_communication_events" ON public.communication_events;
CREATE POLICY "authenticated_all_communication_events" ON public.communication_events FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Agent Logs Policies
DROP POLICY IF EXISTS "authenticated_all_agent_logs" ON public.agent_logs;
CREATE POLICY "authenticated_all_agent_logs" ON public.agent_logs FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Memory Documents Policies
DROP POLICY IF EXISTS "authenticated_all_memory_documents" ON public.memory_documents;
CREATE POLICY "authenticated_all_memory_documents" ON public.memory_documents FOR ALL TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- Interactions Policies (derived via customer company ID)
DROP POLICY IF EXISTS "authenticated_all_interactions" ON public.interactions;
CREATE POLICY "authenticated_all_interactions" ON public.interactions FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.company_id = public.get_user_company_id()));

-- Customer Embeddings Policies (derived via customer company ID)
DROP POLICY IF EXISTS "authenticated_all_customer_embeddings" ON public.customer_embeddings;
CREATE POLICY "authenticated_all_customer_embeddings" ON public.customer_embeddings FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.company_id = public.get_user_company_id()));

-- Campaign Deliveries Policies (derived via customer company ID)
DROP POLICY IF EXISTS "authenticated_all_campaign_deliveries" ON public.campaign_deliveries;
CREATE POLICY "authenticated_all_campaign_deliveries" ON public.campaign_deliveries FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.company_id = public.get_user_company_id()));
