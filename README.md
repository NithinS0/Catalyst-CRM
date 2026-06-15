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

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Docker (for database / local services)
- OpenAI API Key (for LLM agent features)

### Running Locally with Docker
1. Configure env files (see `.env.example` in `/backend` and `/frontend`).
2. Run Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Access the services:
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`
   - Channel Service Docs: `http://localhost:8001/docs`

### Manual Local Run
For development, services can be run individually:

#### Database Migrations
Initialize database schemas on your Supabase Postgres or local Postgres:
```bash
# Run migration scripts against target database
```

#### Backend API
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Channel Service
```bash
cd channel-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

#### Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
