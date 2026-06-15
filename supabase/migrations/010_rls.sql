-- Enable RLS on all CRM tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other existing tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_states ENABLE ROW LEVEL SECURITY;

-- Create policies (authenticated & service_role have full CRUD access)

-- Customers Policies
DROP POLICY IF EXISTS "authenticated_all_customers" ON public.customers;
CREATE POLICY "authenticated_all_customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_customers" ON public.customers;
CREATE POLICY "service_role_all_customers" ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Orders Policies
DROP POLICY IF EXISTS "authenticated_all_orders" ON public.orders;
CREATE POLICY "authenticated_all_orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_orders" ON public.orders;
CREATE POLICY "service_role_all_orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Segments Policies
DROP POLICY IF EXISTS "authenticated_all_segments" ON public.segments;
CREATE POLICY "authenticated_all_segments" ON public.segments FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_segments" ON public.segments;
CREATE POLICY "service_role_all_segments" ON public.segments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Campaigns Policies
DROP POLICY IF EXISTS "authenticated_all_campaigns" ON public.campaigns;
CREATE POLICY "authenticated_all_campaigns" ON public.campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_campaigns" ON public.campaigns;
CREATE POLICY "service_role_all_campaigns" ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Communications Policies
DROP POLICY IF EXISTS "authenticated_all_communications" ON public.communications;
CREATE POLICY "authenticated_all_communications" ON public.communications FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_communications" ON public.communications;
CREATE POLICY "service_role_all_communications" ON public.communications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Communication Events Policies
DROP POLICY IF EXISTS "authenticated_all_communication_events" ON public.communication_events;
CREATE POLICY "authenticated_all_communication_events" ON public.communication_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_communication_events" ON public.communication_events;
CREATE POLICY "service_role_all_communication_events" ON public.communication_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Agent Logs Policies
DROP POLICY IF EXISTS "authenticated_all_agent_logs" ON public.agent_logs;
CREATE POLICY "authenticated_all_agent_logs" ON public.agent_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_agent_logs" ON public.agent_logs;
CREATE POLICY "service_role_all_agent_logs" ON public.agent_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Memory Documents Policies
DROP POLICY IF EXISTS "authenticated_all_memory_documents" ON public.memory_documents;
CREATE POLICY "authenticated_all_memory_documents" ON public.memory_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_memory_documents" ON public.memory_documents;
CREATE POLICY "service_role_all_memory_documents" ON public.memory_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Profiles Policies
DROP POLICY IF EXISTS "authenticated_all_profiles" ON public.profiles;
CREATE POLICY "authenticated_all_profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_profiles" ON public.profiles;
CREATE POLICY "service_role_all_profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Customer Embeddings Policies
DROP POLICY IF EXISTS "authenticated_all_customer_embeddings" ON public.customer_embeddings;
CREATE POLICY "authenticated_all_customer_embeddings" ON public.customer_embeddings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_customer_embeddings" ON public.customer_embeddings;
CREATE POLICY "service_role_all_customer_embeddings" ON public.customer_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Campaign Deliveries Policies
DROP POLICY IF EXISTS "authenticated_all_campaign_deliveries" ON public.campaign_deliveries;
CREATE POLICY "authenticated_all_campaign_deliveries" ON public.campaign_deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_campaign_deliveries" ON public.campaign_deliveries;
CREATE POLICY "service_role_all_campaign_deliveries" ON public.campaign_deliveries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Interactions Policies
DROP POLICY IF EXISTS "authenticated_all_interactions" ON public.interactions;
CREATE POLICY "authenticated_all_interactions" ON public.interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_interactions" ON public.interactions;
CREATE POLICY "service_role_all_interactions" ON public.interactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Agent States Policies
DROP POLICY IF EXISTS "authenticated_all_agent_states" ON public.agent_states;
CREATE POLICY "authenticated_all_agent_states" ON public.agent_states FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_agent_states" ON public.agent_states;
CREATE POLICY "service_role_all_agent_states" ON public.agent_states FOR ALL TO service_role USING (true) WITH CHECK (true);
