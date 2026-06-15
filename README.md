# Catalyst CRM

Catalyst is an AI-Native Customer Relationship Management (CRM) platform designed for modern enterprise SaaS. It empowers marketing and sales teams with dynamic customer segmentation, agentic workflows, hyper-personalized automated campaigns, and full timeline analysis.

## Key Features

1. **Dashboard**: High-fidelity modern executive summary of customer counts, campaign statistics, conversion rates, and real-time AI Agent operations.
2. **Customers Directory**: Central directory of customers featuring custom properties, lifecycle statuses, lead scoring, and semantic-backed chronological interaction timelines.
3. **Dynamic Segments**: Group customers based on rules (e.g., "Active but not contacted in 30 days" or "High-value Churn Risk") dynamically evaluated in real-time.
4. **Automated Campaigns**: Launch outreach plans over email, SMS, or simulated channels. Track metrics (delivery rates, opens, clicks).
5. **Analytics**: Rich charts mapping customer growth, channel distributions, and revenue attribution.
6. **AI Campaign Studio**: Natural language chat interface with a multi-agent backend powered by LangGraph and pgvector:
   - **Orchestrator**: Parses requests and plans workflows.
   - **Lead Scorer**: Reviews timelines to score high-value leads.
   - **Segment Analyzer**: Proposes and filters customer segments.
   - **Copywriter**: Injects customer-specific RAG contexts into highly personalized emails or messages.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend API & Agents**: FastAPI, LangGraph, OpenAI LLMs
- **Microservices**: FastAPI Channel Service for async campaign dispatch
- **Database & Auth**: Supabase PostgreSQL + `pgvector`
