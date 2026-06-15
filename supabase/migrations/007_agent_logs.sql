-- Agent Logs table (logging multi-agent interactions)
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL, -- orchestrator, copywriter, lead_scorer, segment_analyzer
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    run_id UUID,
    task_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
    input_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    output_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agent States table (for LangGraph state persistence)
CREATE TABLE IF NOT EXISTS public.agent_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id TEXT UNIQUE NOT NULL,
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_agent_states_updated_at ON public.agent_states;
CREATE TRIGGER update_agent_states_updated_at BEFORE UPDATE ON public.agent_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
