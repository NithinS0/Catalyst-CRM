-- Master Migration Script
-- Execute these in order to completely set up the Catalyst CRM schema and seed data

\ir migrations/001_customers.sql
\ir migrations/002_orders.sql
\ir migrations/003_segments.sql
\ir migrations/004_campaigns.sql
\ir migrations/005_communications.sql
\ir migrations/006_communication_events.sql
\ir migrations/007_agent_logs.sql
\ir migrations/008_memory_documents.sql
\ir migrations/009_indexes.sql
\ir migrations/010_rls.sql

-- Optional seed data
-- \ir migrations/011_seed_data.sql
