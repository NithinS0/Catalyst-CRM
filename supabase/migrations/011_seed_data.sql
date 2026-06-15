-- Seed data for testing
INSERT INTO public.customers (id, first_name, last_name, email, phone, company, status, lead_score, custom_attributes)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Alice', 'Vance', 'alice@vancetech.com', '+1-555-0101', 'Vance Tech', 'active', 95, '{"tier": "enterprise", "industry": "fintech"}'),
    ('a0000000-0000-0000-0000-000000000002', 'Bob', 'Miller', 'bob@millerretail.com', '+1-555-0102', 'Miller Retail', 'active', 45, '{"tier": "pro", "industry": "retail"}'),
    ('a0000000-0000-0000-0000-000000000003', 'Charlie', 'Smith', 'charlie@apexcorp.com', '+1-555-0103', 'Apex Corp', 'churn_risk', 60, '{"tier": "enterprise", "industry": "healthcare"}'),
    ('a0000000-0000-0000-0000-000000000004', 'Diana', 'Prince', 'diana@wayne.com', '+1-555-0104', 'Wayne Enterprises', 'contact_ready', 88, '{"tier": "enterprise", "industry": "defense"}'),
    ('a0000000-0000-0000-0000-000000000005', 'Evan', 'Wright', 'evan@starlabs.org', '+1-555-0105', 'Star Labs', 'inactive', 20, '{"tier": "free", "industry": "research"}');

INSERT INTO public.interactions (customer_id, type, summary, details)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'call', 'Initial discovery call', 'Alice requested detailed pricing on our enterprise SLA. Very interested in our analytics and AI features.'),
    ('a0000000-0000-0000-0000-000000000001', 'email', 'Sent custom API documentation', 'Followed up with custom documentation for Webhooks and API endpoints as discussed in our call.'),
    ('a0000000-0000-0000-0000-000000000003', 'support', 'Double charge on invoice inv-9903', 'Charlie complained that their credit card was charged twice. Refund has been initiated, but user remains unhappy.'),
    ('a0000000-0000-0000-0000-000000000003', 'call', 'Escalation review call', 'Charlie expressed concerns over platform stability and slow dashboard load times. Stated they are considering alternative vendors.'),
    ('a0000000-0000-0000-0000-000000000004', 'meeting', 'Product demonstration', 'Demoed AI Campaign Studio features. Diana was very impressed and requested a pilot agreement for Wayne Ent.');

INSERT INTO public.segments (id, name, description, definition)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'High Value Leads', 'Customers with active/contact-ready status and lead score >= 80', '[{"field": "status", "operator": "in", "value": ["active", "contact_ready"]}, {"field": "lead_score", "operator": "gte", "value": 80}]'),
    ('b0000000-0000-0000-0000-000000000002', 'Churn Risks', 'Customers in churn risk or inactive status', '[{"field": "status", "operator": "in", "value": ["churn_risk", "inactive"]}]');

INSERT INTO public.campaigns (id, name, description, status, type, segment_id, content_template)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Premium Partnership Outreach', 'Special invitation for enterprise leads', 'completed', 'email', 'b0000000-0000-0000-0000-000000000001', 'Hello {{first_name}},\n\nWe would love to discuss custom integrations for {{company}}. Let us know your availability.\n\nBest,\nCatalyst Team'),
    ('c0000000-0000-0000-0000-000000000002', 'Re-engagement Promo', 'Re-engage churning customers with 20% discount', 'draft', 'email', 'b0000000-0000-0000-0000-000000000002', 'Hello {{first_name}},\n\nWe notice you faced issues recently. We want to make it right. Here is 20% off your next month.\n\nBest,\nCatalyst CRM');

INSERT INTO public.campaign_deliveries (campaign_id, customer_id, status, sent_at, opened_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'opened', now() - interval '2 days', now() - interval '1 day'),
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'sent', now() - interval '2 days', null);
