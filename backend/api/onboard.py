import json
import uuid
import random
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from supabase import create_client

from backend.config import settings
from backend.database.supabase import get_supabase, get_db_connection
from backend.rag.embeddings import get_embedding
from backend.database.repositories.memory_repository import MemoryRepository

router = APIRouter(prefix="/api/onboard", tags=["onboard"])

class OnboardRequest(BaseModel):
    company_name: str
    industry: str
    logo_url: Optional[str] = None
    plan: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str

FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Matthew", "Lisa", "Daniel", "Betty", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna", "Kenneth", "Michelle"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"]

ITEMS_BY_INDUSTRY = {
    "Fashion Brand": [
        {"name": "Classic Denim Jacket", "price": 89.99},
        {"name": "Slim Fit Leather Boots", "price": 149.99},
        {"name": "Silk Floral Summer Dress", "price": 69.99},
        {"name": "Merino Wool Knit Sweater", "price": 79.99},
        {"name": "Vintage Graphic Tee", "price": 28.50},
        {"name": "High-Waisted Designer Jeans", "price": 115.00},
        {"name": "Polarized Acetate Sunglasses", "price": 45.00},
        {"name": "Canvas Daily Tote Bag", "price": 32.00}
    ],
    "Coffee Chain": [
        {"name": "Caramel Macchiato Blend (1kg)", "price": 48.00},
        {"name": "Single-Origin Espresso Beans (500g)", "price": 26.50},
        {"name": "Japanese Style Cold Brew Kit", "price": 35.00},
        {"name": "Insulated Travel Coffee Tumbler", "price": 22.00},
        {"name": "Gourmet Syrup Pack (3 pack)", "price": 18.00},
        {"name": "Classic French Press Mug", "price": 25.00},
        {"name": "Premium Oat Milk Pack (6L)", "price": 29.99},
        {"name": "Barista Gooseneck Kettle", "price": 55.00}
    ],
    "Beauty Brand": [
        {"name": "Hyaluronic Acid Glow Serum", "price": 45.00},
        {"name": "Velvet Matte Lipstick Red", "price": 24.00},
        {"name": "Dead Sea Mineral Clay Mask", "price": 18.99},
        {"name": "Bakuchiol Anti-Aging Cream", "price": 68.00},
        {"name": "Gentle Oatmeal Cleanser", "price": 28.00},
        {"name": "Mineral Daily SPF 50 Shield", "price": 32.00},
        {"name": "Botanical Nourishing Hair Oil", "price": 39.50},
        {"name": "Rosewater Balancing Toner", "price": 16.00}
    ],
    "Retail Brand": [
        {"name": "Aromatherapy Mist Diffuser", "price": 42.00},
        {"name": "Organic Bamboo Bath Towel Set", "price": 49.99},
        {"name": "Vacuum Sealed Water Flask 1L", "price": 28.00},
        {"name": "Eco-Friendly Cork Yoga Mat", "price": 38.50},
        {"name": "Minimalist Desktop Organizer", "price": 19.99},
        {"name": "Natural Beeswax Candle Trio", "price": 24.50},
        {"name": "Premium Cotton Bed Linens", "price": 85.00},
        {"name": "Woven Seagrass Storage Basket", "price": 34.00}
    ],
    "Electronics Brand": [
        {"name": "ANC Wireless Earbuds Pro", "price": 99.99},
        {"name": "Fitness Tracker Smart Watch", "price": 189.50},
        {"name": "Active Noise Cancelling Headset", "price": 279.00},
        {"name": "RGB Mechanical Gaming Keyboard", "price": 115.00},
        {"name": "Multi-Device Wireless Charger", "price": 39.99},
        {"name": "Precision Wireless Mouse", "price": 59.99},
        {"name": "Full HD Web Camera with Ring Light", "price": 68.00},
        {"name": "4K Ultra-Wide IPS Monitor", "price": 329.99}
    ]
}

@router.post("")
def onboard_company(req: OnboardRequest):
    supabase = get_supabase()
    try:
        # 1. Check duplicate email to prevent registration collision
        existing_profile = supabase.table("profiles").select("id").eq("email", req.admin_email).execute()
        if existing_profile.data:
            raise HTTPException(status_code=400, detail="A user with this email is already registered.")

        # 2. Insert Company record
        slug = re.sub(r'[^a-zA-Z0-9]', '-', req.company_name.lower())
        slug = re.sub(r'-+', '-', slug).strip('-')
        if not slug:
            slug = "workspace"
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        default_logo = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60"
        if req.industry == "Fashion Brand":
            default_logo = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=128&auto=format&fit=crop&q=60"
        elif req.industry == "Coffee Chain":
            default_logo = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=128&auto=format&fit=crop&q=60"
        elif req.industry == "Beauty Brand":
            default_logo = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=128&auto=format&fit=crop&q=60"
        elif req.industry == "Electronics Brand":
            default_logo = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&auto=format&fit=crop&q=60"

        logo_url = req.logo_url if req.logo_url else default_logo

        # Premium branding primary color based on selected industry
        branding_colors = {
            "Fashion Brand": "#8b5cf6",     # Violet
            "Coffee Chain": "#f59e0b",      # Amber
            "Beauty Brand": "#ec4899",      # Pink
            "Retail Brand": "#10b981",      # Emerald
            "Electronics Brand": "#0ea5e9"  # Sky Blue
        }
        primary_color = branding_colors.get(req.industry, "#4f46e5")

        comp_res = supabase.table("companies").insert({
            "name": req.company_name,
            "slug": slug,
            "logo_url": logo_url,
            "primary_color": primary_color,
            "plan": req.plan,
            "status": "active"
        }).execute()

        if not comp_res.data:
            raise Exception("Failed to provision company record.")
        company_data = comp_res.data[0]
        company_id = company_data["id"]

        # 3. Create Admin User inside Supabase Auth
        auth_res = supabase.auth.admin.create_user({
            "email": req.admin_email,
            "password": req.admin_password,
            "email_confirm": True,
            "user_metadata": {
                "name": req.admin_name
            }
        })
        user_id = auth_res.user.id

        # 4. Create user profile linked to company
        supabase.table("profiles").insert({
            "id": user_id,
            "name": req.admin_name,
            "email": req.admin_email,
            "role": "admin",
            "company_id": company_id
        }).execute()

        # 5. Bulk Seed Data using Direct Connection
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                from psycopg2.extras import execute_values

                # a. Seed Segments
                segment_id_1 = str(uuid.uuid4())
                segment_id_2 = str(uuid.uuid4())
                seg_rules_1 = [{"field": "lead_score", "operator": "gte", "value": 80}]
                seg_rules_2 = [{"field": "status", "operator": "eq", "value": "churn_risk"}]

                cur.execute(
                    """
                    INSERT INTO public.segments (id, name, description, definition, company_id)
                    VALUES (%s, %s, %s, %s::jsonb, %s), (%s, %s, %s, %s::jsonb, %s);
                    """,
                    (
                        segment_id_1, "High Value Contacts", "Premium contacts with lead score >= 80", json.dumps(seg_rules_1), company_id,
                        segment_id_2, "At-Risk Customers", "Contacts categorized under churn risk status", json.dumps(seg_rules_2), company_id
                    )
                )

                # b. Seed Campaigns
                campaign_id_1 = str(uuid.uuid4())
                campaign_id_2 = str(uuid.uuid4())
                cur.execute(
                    """
                    INSERT INTO public.campaigns (id, name, description, status, type, segment_id, content_template, company_id)
                    VALUES 
                    (%s, %s, %s, %s, %s, %s, %s, %s),
                    (%s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        campaign_id_1, "Welcome Launch Outreach", "Unified welcoming sequence for high-tier leads", "completed", "email", segment_id_1, "Hello {{first_name}},\n\nThank you for choosing us! We hope you love your new purchase. Let us know how we can assist.\n\nBest regards,\nCustomer Success Team", company_id,
                        campaign_id_2, "Seasonal Promotional Flyer", "Re-engage churn risks with summer pricing adjustments", "active", "sms", segment_id_2, "Hey {{first_name}},\n\nGet 20% off our seasonal products with promo code SAVINGS20. Click to shop now!", company_id
                    )
                )

                # c. Seed Customers (1,200 records)
                customers = []
                now = datetime.now(timezone.utc)
                for i in range(1200):
                    cid = str(uuid.uuid4())
                    fn = random.choice(FIRST_NAMES)
                    ln = random.choice(LAST_NAMES)
                    email = f"{fn.lower()}.{ln.lower()}{random.randint(10,999)}@{slug.split('-')[0]}.com"
                    phone = f"+1-555-{random.randint(100,999):03d}-{random.randint(1000,9999):04d}"
                    c_name = f"{ln} Enterprises" if random.random() > 0.65 else None
                    status = random.choice(["active", "active", "active", "lead", "contact_ready", "churn_risk", "inactive"])
                    lead_score = random.randint(15, 98)
                    
                    c_attr = {
                        "tier": random.choice(["free", "pro", "enterprise"]),
                        "channel": random.choice(["web", "mobile", "social", "email"]),
                        "acquired_via": random.choice(["organic", "campaign", "referral", "ads"])
                    }
                    created = now - timedelta(days=random.randint(1, 90), hours=random.randint(0, 23))
                    
                    customers.append((cid, fn, ln, email, phone, c_name, status, lead_score, json.dumps(c_attr), company_id, created, created))

                insert_customers_sql = """
                    INSERT INTO public.customers (id, first_name, last_name, email, phone, company, status, lead_score, custom_attributes, company_id, created_at, updated_at)
                    VALUES %s;
                """
                execute_values(cur, insert_customers_sql, customers)

                # d. Seed Orders (5,000 records)
                orders = []
                industry_items = ITEMS_BY_INDUSTRY.get(req.industry, ITEMS_BY_INDUSTRY["Retail Brand"])

                for _ in range(5000):
                    oid = str(uuid.uuid4())
                    random_cust = random.choice(customers)
                    cust_id = random_cust[0]
                    created_date = random_cust[10] + timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
                    if created_date > now:
                        created_date = now

                    order_status = random.choice(["completed", "completed", "completed", "completed", "processing", "pending", "cancelled"])
                    
                    # 1-3 random items
                    items = []
                    total = 0.0
                    for _ in range(random.randint(1, 3)):
                        product = random.choice(industry_items)
                        qty = random.randint(1, 2)
                        items.append({
                            "product_id": str(uuid.uuid4())[:8],
                            "name": product["name"],
                            "quantity": qty,
                            "price": product["price"]
                        })
                        total += product["price"] * qty

                    orders.append((oid, cust_id, order_status, total, "USD", json.dumps(items), company_id, created_date, created_date))

                insert_orders_sql = """
                    INSERT INTO public.orders (id, customer_id, status, total_amount, currency, items, company_id, created_at, updated_at)
                    VALUES %s;
                """
                execute_values(cur, insert_orders_sql, orders)

                # e. Seed Campaign Deliveries & Communications (250 completed deliveries)
                deliveries = []
                comms = []
                events = []

                # Select 250 high-lead customers to receive welcoming campaign
                eligible_custs = [c for c in customers if c[7] >= 75][:250]
                if len(eligible_custs) < 250:
                    eligible_custs = customers[:250]

                for cust in eligible_custs:
                    cid = cust[0]
                    first_name = cust[1]
                    email = cust[3]
                    comm_id = str(uuid.uuid4())
                    
                    # Create communication
                    body = f"Hello {first_name},\n\nThank you for choosing {req.company_name}! We hope you love your new purchase.\n\nBest regards,\nCustomer Success Team"
                    created_time = now - timedelta(days=random.randint(1, 14), hours=random.randint(1, 23))
                    
                    # status of communications: sent, delivered, opened, clicked, converted
                    final_status = random.choice(["converted", "clicked", "opened", "delivered", "sent"])
                    
                    comms.append((
                        comm_id, cid, campaign_id_1, "email", "outbound", "Welcome Launch Outreach", body, final_status, company_id, created_time, created_time
                    ))

                    # Create campaign delivery status
                    deliv_status = "opened"
                    if final_status == "sent":
                        deliv_status = "sent"
                    elif final_status == "delivered":
                        deliv_status = "sent"
                    elif final_status in ("clicked", "converted"):
                        deliv_status = "clicked"

                    # timestamp details
                    sent_at = created_time
                    opened_at = created_time + timedelta(minutes=random.randint(1, 10)) if final_status in ("opened", "clicked", "converted") else None
                    clicked_at = opened_at + timedelta(minutes=random.randint(1, 5)) if final_status in ("clicked", "converted") else None

                    deliveries.append((
                        campaign_id_1, cid, deliv_status, sent_at, opened_at, clicked_at, None, company_id, created_time
                    ))

                    # Seed events history
                    events.append((str(uuid.uuid4()), comm_id, "sent", json.dumps({"recipient": email, "channel": "email"}), company_id, created_time))
                    
                    if final_status != "sent":
                        events.append((str(uuid.uuid4()), comm_id, "delivered", json.dumps({"recipient": email, "channel": "email"}), company_id, created_time + timedelta(seconds=15)))
                    
                    if final_status in ("opened", "clicked", "converted"):
                        events.append((str(uuid.uuid4()), comm_id, "opened", json.dumps({"user_agent": "Mozilla/5.0"}), company_id, opened_at))

                    if final_status in ("clicked", "converted"):
                        events.append((str(uuid.uuid4()), comm_id, "clicked", json.dumps({"url": "/promo-onboard"}), company_id, clicked_at))

                    if final_status == "converted":
                        events.append((str(uuid.uuid4()), comm_id, "converted", json.dumps({"order_value": random.randint(50, 200)}), company_id, clicked_at + timedelta(minutes=3)))

                # Perform communications bulk insert
                insert_comms_sql = """
                    INSERT INTO public.communications (id, customer_id, campaign_id, channel, direction, subject, body, status, company_id, created_at, updated_at)
                    VALUES %s;
                """
                execute_values(cur, insert_comms_sql, comms)

                # Perform deliveries bulk insert
                insert_deliveries_sql = """
                    INSERT INTO public.campaign_deliveries (campaign_id, customer_id, status, sent_at, opened_at, clicked_at, error_message, company_id, created_at)
                    VALUES %s;
                """
                execute_values(cur, insert_deliveries_sql, deliveries)

                # Perform events bulk insert
                insert_events_sql = """
                    INSERT INTO public.communication_events (id, communication_id, event_type, metadata, company_id, created_at)
                    VALUES %s;
                """
                execute_values(cur, insert_events_sql, events)

        # 6. Seed default RAG memories scoped to company_id
        # We store them using MemoryRepository within a tenant_context block
        from backend.utils.tenant import tenant_context
        with tenant_context(company_id):
            # Brand Guidelines
            MemoryRepository.store_document(
                collection="Brand Memory",
                content=f"{req.company_name} Tone & Voice: Outbound campaign copy must be engaging, clear, helpful, and premium. Match the industry context of {req.industry} exactly.",
                metadata={"title": f"{req.company_name} Branding Tone"}
            )
            # Product Positioning
            MemoryRepository.store_document(
                collection="Brand Memory",
                content=f"Product Value: Highlight our high-quality selections, personalized services, and real-time custom offerings designed for {req.industry} lovers.",
                metadata={"title": "Product Positioning Guidelines"}
            )
            # Historical campaign performance
            MemoryRepository.store_document(
                collection="Campaign Memory",
                content="Campaign 'Welcome Launch Outreach': High interaction rates with early subscribers. Conversion rates peaked on custom coupon code distribution.",
                metadata={"title": "Campaign History: Welcome Outreach"}
            )

        # 7. Authenticate and retrieve user session to auto-login
        local_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        auth_session = local_supabase.auth.sign_in_with_password(credentials={
            "email": req.admin_email,
            "password": req.admin_password
        })

        if not auth_session.session:
            raise Exception("Authentication session initialization failed.")

        return {
            "status": "success",
            "message": "Workspace initialized and seeded successfully.",
            "session": {
                "access_token": auth_session.session.access_token,
                "refresh_token": auth_session.session.refresh_token,
                "expires_at": auth_session.session.expires_at
            },
            "user": {
                "id": user_id,
                "name": req.admin_name,
                "email": req.admin_email,
                "role": "admin",
                "company_id": company_id,
                "company": company_data
            }
        }

    except Exception as e:
        # Delete auth user if profile creation or database seeding failed to keep Auth DB clean
        try:
            if 'user_id' in locals():
                supabase.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Onboarding failed: {str(e)}")


class WorkspaceOnboardRequest(BaseModel):
    company_id: Optional[str] = None
    industry: str
    company_size: Optional[str] = "1-10"
    number_of_users: Optional[str] = "1-5"
    website: Optional[str] = None
    data_mode: str = "demo"  # "demo", "import", "empty"

@router.post("/workspace")
def complete_workspace_onboarding(req: WorkspaceOnboardRequest, request: Request):
    """
    Called after self-service registration to finalize workspace details:
    Industry, size, users, and customer data mode (demo, import, empty).
    """
    supabase = get_supabase()
    from backend.utils.tenant import get_current_company_id, set_current_company_id

    cid = req.company_id or get_current_company_id() or getattr(request.state, "company_id", None)
    if not cid:
        auth_hdr = request.headers.get("Authorization", "")
        if auth_hdr.startswith("Bearer "):
            tok = auth_hdr.split(" ")[1]
            try:
                u_res = supabase.auth.get_user(tok)
                if u_res and u_res.user:
                    p_res = supabase.table("profiles").select("company_id").eq("id", u_res.user.id).single().execute()
                    if p_res.data:
                        cid = p_res.data.get("company_id")
                        if cid:
                            set_current_company_id(str(cid))
            except Exception:
                pass

    if not cid:
        raise HTTPException(status_code=400, detail="Missing company_id context")

    try:
        # 1. Update company settings
        supabase.table("companies").update({
            "industry": req.industry,
            "company_size": req.company_size,
            "number_of_users": req.number_of_users,
            "website": req.website
        }).eq("id", cid).execute()

        # 2. Handle customer data mode
        if req.data_mode == "demo":
            # Seed 100 realistic customers, orders, segments, and 1 welcome campaign
            now = datetime.now(timezone.utc)
            cust_rows = []
            for _ in range(100):
                fn = random.choice(FIRST_NAMES)
                ln = random.choice(LAST_NAMES)
                email = f"{fn.lower()}.{ln.lower()}{random.randint(10, 999)}@demo.catalystcrm.com"
                phone = f"+1-555-{random.randint(100, 999):03d}-{random.randint(1000, 9999):04d}"
                status = random.choice(["active", "active", "active", "lead", "churn_risk"])
                lead_score = random.randint(30, 95)
                cust_rows.append({
                    "company_id": cid,
                    "first_name": fn,
                    "last_name": ln,
                    "email": email,
                    "phone": phone,
                    "company": f"{ln} Group",
                    "status": status,
                    "lead_score": lead_score,
                    "custom_attributes": {"tier": random.choice(["free", "pro", "enterprise"])}
                })
            c_ins = supabase.table("customers").insert(cust_rows).execute()
            inserted_custs = c_ins.data or []

            # Seed 1 segment
            seg_rules = [{"field": "lead_score", "operator": "gte", "value": 75}]
            seg_res = supabase.table("segments").insert({
                "company_id": cid,
                "name": "High-Intent Leads",
                "description": "Engaged prospects with lead scores above 75",
                "definition": seg_rules
            }).execute()
            seg_id = seg_res.data[0]["id"] if seg_res.data else None

            # Seed 1 demo campaign
            supabase.table("campaigns").insert({
                "company_id": cid,
                "name": "Intelligent Welcome Outreach",
                "description": "Multi-agent welcome campaign targeting high-intent leads",
                "type": "email",
                "target_channel": "email",
                "segment_id": seg_id,
                "content_template": "Hi {{first_name}},\n\nWelcome to Catalyst! We're thrilled to help you unlock the full value of your customer data.\n\nBest regards,\nThe Catalyst Team",
                "status": "draft",
                "subject": "Welcome to a smarter way to engage"
            }).execute()

        # Log audit entry
        supabase.table("audit_logs").insert({
            "company_id": cid,
            "action": "onboarding_completed",
            "resource_type": "workspace",
            "resource_id": cid,
            "details": {"industry": req.industry, "data_mode": req.data_mode}
        }).execute()

        return {
            "status": "success",
            "message": "Workspace initialized successfully",
            "redirect": "/app/dashboard"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete workspace onboarding: {str(e)}")
