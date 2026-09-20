-- Migration 018: Production Hardening & Performance Optimization
-- Applied to Supabase project Catalyst (pmuxilssbyurlotubvlg)

-- 1. Remove unwanted orphaned table (0 rows, 0 references in codebase)
DROP TABLE IF EXISTS public.agent_states CASCADE;

-- 2. Covering indexes for 12 unindexed foreign keys (Supabase Performance Linter 0001)
CREATE INDEX IF NOT EXISTS idx_agent_logs_company_id ON public.agent_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_campaign_id ON public.campaign_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_customer_id ON public.campaign_deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON public.campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_communication_events_company_id ON public.communication_events(company_id);
CREATE INDEX IF NOT EXISTS idx_communications_company_id ON public.communications(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_customer_id ON public.interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_memory_documents_company_id ON public.memory_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_segments_company_id ON public.segments(company_id);

-- 3. Secure Function Search Paths & Fix Security Definer Permissions (Supabase Security Linters 0011, 0028, 0029)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_company_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_digital_twin_updated_at() SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_company_id() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated, service_role;

-- 4. Optimize RLS Policies on customer_digital_twins (Supabase Performance Linters 0003, 0006)
DROP POLICY IF EXISTS "Company members can read their own twins" ON public.customer_digital_twins;
DROP POLICY IF EXISTS "Company members can upsert their own twins" ON public.customer_digital_twins;
DROP POLICY IF EXISTS "Company members can select digital twins" ON public.customer_digital_twins;
DROP POLICY IF EXISTS "Company members can insert digital twins" ON public.customer_digital_twins;
DROP POLICY IF EXISTS "Company members can update digital twins" ON public.customer_digital_twins;
DROP POLICY IF EXISTS "Company members can delete digital twins" ON public.customer_digital_twins;

CREATE POLICY "Company members can select digital twins"
    ON public.customer_digital_twins FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles
            WHERE id = (select auth.uid())
        )
    );

CREATE POLICY "Company members can insert digital twins"
    ON public.customer_digital_twins FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles
            WHERE id = (select auth.uid())
        )
    );

CREATE POLICY "Company members can update digital twins"
    ON public.customer_digital_twins FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles
            WHERE id = (select auth.uid())
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles
            WHERE id = (select auth.uid())
        )
    );

CREATE POLICY "Company members can delete digital twins"
    ON public.customer_digital_twins FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles
            WHERE id = (select auth.uid())
        )
    );
