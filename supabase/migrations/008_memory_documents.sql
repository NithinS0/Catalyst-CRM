-- Customer Embeddings table for RAG memory
CREATE TABLE IF NOT EXISTS public.customer_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    embedding VECTOR(1536),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Memory Documents table (RAG memory store with vector embeddings)
CREATE TABLE IF NOT EXISTS public.memory_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE, -- can be NULL for global/product RAG context
    title TEXT,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- 1536-dimensional embeddings for OpenAI model text-embedding-3-small
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- source_url, category, tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for memory_documents updated_at
DROP TRIGGER IF EXISTS update_memory_documents_updated_at ON public.memory_documents;
CREATE TRIGGER update_memory_documents_updated_at BEFORE UPDATE ON public.memory_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
