    -- Migration 015: Customer Digital Twin
    -- Creates a table to store AI-generated behavioral profiles per customer

    CREATE TABLE IF NOT EXISTS public.customer_digital_twins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,

        -- Behavioral Summary
        behavioral_summary TEXT,

        -- Purchase Behavior
        purchase_frequency_days INTEGER,       -- avg days between purchases
        preferred_categories TEXT[],           -- top product categories
        avg_order_value NUMERIC(10, 2),
        total_lifetime_value NUMERIC(10, 2),

        -- Channel Preference
        preferred_channel VARCHAR(50),         -- email | whatsapp | sms | push

        -- Risk & Health
        churn_risk_score INTEGER CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
        churn_risk_label VARCHAR(20),          -- low | medium | high | critical

        -- Predictions
        predicted_next_purchase_date DATE,
        recommended_action TEXT,
        recommended_product TEXT,

        -- Full AI JSON snapshot (raw output)
        ai_profile JSONB DEFAULT '{}',

        -- Metadata
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Unique constraint: one twin per customer
    CREATE UNIQUE INDEX IF NOT EXISTS udx_digital_twin_customer ON public.customer_digital_twins(customer_id);

    -- Indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_digital_twin_company_id ON public.customer_digital_twins(company_id);
    CREATE INDEX IF NOT EXISTS idx_digital_twin_churn_risk ON public.customer_digital_twins(churn_risk_score DESC);
    CREATE INDEX IF NOT EXISTS idx_digital_twin_ltv ON public.customer_digital_twins(total_lifetime_value DESC);
    CREATE INDEX IF NOT EXISTS idx_digital_twin_generated_at ON public.customer_digital_twins(generated_at DESC);

    -- updated_at trigger
    CREATE OR REPLACE FUNCTION update_digital_twin_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_digital_twin_updated_at ON public.customer_digital_twins;
    CREATE TRIGGER trg_digital_twin_updated_at
        BEFORE UPDATE ON public.customer_digital_twins
        FOR EACH ROW EXECUTE FUNCTION update_digital_twin_updated_at();

    -- RLS Policy
    ALTER TABLE public.customer_digital_twins ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Company members can read their own twins" ON public.customer_digital_twins;
    CREATE POLICY "Company members can read their own twins"
        ON public.customer_digital_twins FOR SELECT
        USING (
            company_id IN (
                SELECT company_id FROM public.profiles
                WHERE id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Company members can upsert their own twins" ON public.customer_digital_twins;
    CREATE POLICY "Company members can upsert their own twins"
        ON public.customer_digital_twins FOR ALL
        USING (
            company_id IN (
                SELECT company_id FROM public.profiles
                WHERE id = auth.uid()
            )
        );
