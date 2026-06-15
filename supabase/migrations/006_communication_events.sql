-- Communication Events table (open, click, bounce metrics)
CREATE TABLE IF NOT EXISTS public.communication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID REFERENCES public.communications(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- sent, delivered, opened, clicked, bounced, failed, replied
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- user_agent, IP, fail_reason, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
