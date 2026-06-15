import json
from typing import Optional, List, Dict, Any
from backend.database.supabase import get_db_cursor, execute_query, execute_insert
from backend.rag.embeddings import get_embedding

class MemoryRepository:
    @staticmethod
    def save_interaction_embedding(customer_id: str, content: str, metadata: dict = None) -> Dict[str, Any]:
        """
        Saves an embedding for customer interaction memory (legacy table).
        """
        embedding = get_embedding(content)
        meta_json = json.dumps(metadata or {})
        
        query = """
            INSERT INTO public.customer_embeddings (customer_id, embedding, content, metadata)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
        """
        params = (customer_id, embedding, content, meta_json)
        return execute_insert(query, params)

    @staticmethod
    def search_similar_interactions(customer_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search customer_embeddings for items similar to query using cosine distance (legacy table).
        """
        query_vector = get_embedding(query)
        
        sql = """
            SELECT id, customer_id, content, metadata, 
                   (embedding <=> %s::vector) as distance
            FROM public.customer_embeddings
            WHERE customer_id = %s
            ORDER BY distance ASC
            LIMIT %s;
        """
        return execute_query(sql, (query_vector, customer_id, limit)) or []

    @staticmethod
    def store_document(
        collection: str, 
        content: str, 
        metadata: dict = None, 
        customer_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Stores a document in the public.memory_documents table under the specified collection.
        """
        embedding = get_embedding(content)
        meta = metadata.copy() if metadata else {}
        meta["collection"] = collection
        meta_json = json.dumps(meta)
        
        title = meta.get("title") or f"{collection} Document"
        
        query = """
            INSERT INTO public.memory_documents (customer_id, title, content, embedding, metadata)
            VALUES (%s, %s, %s, %s::vector, %s)
            RETURNING id, customer_id, title, content, metadata, created_at;
        """
        return execute_insert(query, (customer_id, title, content, embedding, meta_json))

    @staticmethod
    def retrieve_documents(
        collection: str, 
        customer_id: Optional[str] = None, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieves documents from public.memory_documents by collection and optional customer filter.
        """
        if customer_id:
            query = """
                SELECT id, customer_id, title, content, metadata, created_at
                FROM public.memory_documents
                WHERE (metadata->>'collection') = %s AND customer_id = %s
                ORDER BY created_at DESC
                LIMIT %s;
            """
            params = (collection, customer_id, limit)
        else:
            query = """
                SELECT id, customer_id, title, content, metadata, created_at
                FROM public.memory_documents
                WHERE (metadata->>'collection') = %s
                ORDER BY created_at DESC
                LIMIT %s;
            """
            params = (collection, limit)
            
        rows = execute_query(query, params)
        return [dict(row) for row in rows] if rows else []

    @staticmethod
    def semantic_search(
        collection: str, 
        query: str, 
        customer_id: Optional[str] = None, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Performs cosine-distance similarity search using pgvector on memory_documents.
        """
        query_vector = get_embedding(query)
        
        if customer_id:
            sql = """
                SELECT id, customer_id, title, content, metadata, created_at,
                       (embedding <=> %s::vector) as distance
                FROM public.memory_documents
                WHERE (metadata->>'collection') = %s AND (customer_id = %s OR customer_id IS NULL)
                ORDER BY distance ASC
                LIMIT %s;
            """
            params = (query_vector, collection, customer_id, limit)
        else:
            sql = """
                SELECT id, customer_id, title, content, metadata, created_at,
                       (embedding <=> %s::vector) as distance
                FROM public.memory_documents
                WHERE (metadata->>'collection') = %s
                ORDER BY distance ASC
                LIMIT %s;
            """
            params = (query_vector, collection, limit)
            
        rows = execute_query(sql, params)
        return [dict(row) for row in rows] if rows else []

    @staticmethod
    def seed_default_memories():
        """
        Seeds default documents into Brand Memory, Campaign Memory, and Customer Memory.
        """
        count_res = execute_query("SELECT COUNT(*) as count FROM public.memory_documents;")
        if count_res and count_res[0]["count"] > 0:
            return
            
        print("[RAG] Seeding default RAG memories into database...")
        
        # 1. Brand Memory Guidelines
        MemoryRepository.store_document(
            collection="Brand Memory",
            content="Catalyst CRM Tone & Voice: Outbound copy should be professional, warm, client-centric, clear, and value-driven. Avoid emojis and excessive jargon.",
            metadata={"title": "Catalyst Tone and Voice"}
        )
        MemoryRepository.store_document(
            collection="Brand Memory",
            content="Product Positioning: Emphasize Catalyst CRM's real-time dynamic segmentation, LangGraph multi-agent capabilities, and 15-minute lead score automatic adjustments.",
            metadata={"title": "Product Positioning Guidelines"}
        )
        MemoryRepository.store_document(
            collection="Brand Memory",
            content="Brand Promotion Rule: Always offer a call to action (CTA), such as scheduling a 10-minute demo session or reviewing pilot terms.",
            metadata={"title": "Outreach Call to Action"}
        )
        
        # 2. Campaign Memory History
        MemoryRepository.store_document(
            collection="Campaign Memory",
            content="Campaign 'Premium Partnership Outreach' (vertical: Fintech): Promoted developer webhook APIs and custom enterprise SLA pricing. High engagement (24% click-through).",
            metadata={"title": "Campaign History: Premium Partnership"}
        )
        MemoryRepository.store_document(
            collection="Campaign Memory",
            content="Campaign 'Re-engagement Promo' (vertical: E-commerce): Offered a 20% discount coupon. Best outcome on churn-risk retail clients.",
            metadata={"title": "Campaign History: Re-engagement Promo"}
        )
        
        # 3. Customer Memory History (Seeded customers)
        MemoryRepository.store_document(
            collection="Customer Memory",
            content="Alice Vance (Vance Tech) requested custom pricing metrics and detailed webhooks documentation. Very interested in AI features.",
            metadata={"title": "Customer Context: Alice Vance"},
            customer_id="a0000000-0000-0000-0000-000000000001"
        )
        MemoryRepository.store_document(
            collection="Customer Memory",
            content="Bob Miller (Miller Retail) prefers retail analytics dashboard overviews. Expressed minor concerns on inventory syncing.",
            metadata={"title": "Customer Context: Bob Miller"},
            customer_id="a0000000-0000-0000-0000-000000000002"
        )
        MemoryRepository.store_document(
            collection="Customer Memory",
            content="Charlie Smith (Apex Corp) complained about inventory bill double charging. Refund was issued. Stated concerns about stability.",
            metadata={"title": "Customer Context: Charlie Smith"},
            customer_id="a0000000-0000-0000-0000-000000000003"
        )
        MemoryRepository.store_document(
            collection="Customer Memory",
            content="Diana Prince (Wayne Enterprises) attended product demo of Campaign Studio and requested a pilot agreement for review.",
            metadata={"title": "Customer Context: Diana Prince"},
            customer_id="a0000000-0000-0000-0000-000000000004"
        )
        MemoryRepository.store_document(
            collection="Customer Memory",
            content="Evan Wright (Star Labs) is a researcher using the free tier. Interested in academic research grants and trial credits.",
            metadata={"title": "Customer Context: Evan Wright"},
            customer_id="a0000000-0000-0000-0000-000000000005"
        )
        print("[RAG] Seeding default RAG memories completed.")
