-- Customers indexes
CREATE INDEX IF NOT EXISTS customers_status_idx ON public.customers(status);
CREATE INDEX IF NOT EXISTS customers_lead_score_idx ON public.customers(lead_score);
CREATE INDEX IF NOT EXISTS customers_created_at_idx ON public.customers(created_at);

-- Orders indexes
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at);

-- Segments indexes
CREATE INDEX IF NOT EXISTS segments_created_at_idx ON public.segments(created_at);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_segment_id_idx ON public.campaigns(segment_id);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON public.campaigns(created_at);

-- Communications indexes
CREATE INDEX IF NOT EXISTS communications_customer_id_idx ON public.communications(customer_id);
CREATE INDEX IF NOT EXISTS communications_campaign_id_idx ON public.communications(campaign_id);
CREATE INDEX IF NOT EXISTS communications_channel_idx ON public.communications(channel);
CREATE INDEX IF NOT EXISTS communications_status_idx ON public.communications(status);
CREATE INDEX IF NOT EXISTS communications_created_at_idx ON public.communications(created_at);

-- Communication Events indexes
CREATE INDEX IF NOT EXISTS communication_events_communication_id_idx ON public.communication_events(communication_id);
CREATE INDEX IF NOT EXISTS communication_events_event_type_idx ON public.communication_events(event_type);
CREATE INDEX IF NOT EXISTS communication_events_created_at_idx ON public.communication_events(created_at);

-- Agent Logs indexes
CREATE INDEX IF NOT EXISTS agent_logs_customer_id_idx ON public.agent_logs(customer_id);
CREATE INDEX IF NOT EXISTS agent_logs_agent_name_idx ON public.agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS agent_logs_status_idx ON public.agent_logs(status);
CREATE INDEX IF NOT EXISTS agent_logs_created_at_idx ON public.agent_logs(created_at);

-- Memory Documents indexes
CREATE INDEX IF NOT EXISTS memory_documents_customer_id_idx ON public.memory_documents(customer_id);
CREATE INDEX IF NOT EXISTS memory_documents_created_at_idx ON public.memory_documents(created_at);

-- Vector embedding cosine similarity index using HNSW (Hierarchical Navigable Small World)
CREATE INDEX IF NOT EXISTS memory_documents_embedding_hnsw_idx 
ON public.memory_documents USING hnsw (embedding vector_cosine_ops);

-- Add vector index on existing customer_embeddings table as well
CREATE INDEX IF NOT EXISTS customer_embeddings_customer_id_idx ON public.customer_embeddings(customer_id);
CREATE INDEX IF NOT EXISTS customer_embeddings_embedding_hnsw_idx 
ON public.customer_embeddings USING hnsw (embedding vector_cosine_ops);
