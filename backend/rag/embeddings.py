import random
import openai
from backend.config import settings

def get_embedding(text: str) -> list[float]:
    """
    Generate embedding for text using OpenAI api.
    Falls back to a stable mock vector if api key is missing.
    """
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-openai-api-key" or settings.OPENAI_API_KEY == "mock-key":
        # Mock 1536-dim vector based on the hash of the text to be stable
        random.seed(hash(text))
        return [random.uniform(-0.1, 0.1) for _ in range(1536)]
    
    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.embeddings.create(
            input=[text.replace("\n", " ")],
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error calling OpenAI Embeddings API: {e}. Falling back to mock embedding.")
        random.seed(hash(text))
        return [random.uniform(-0.1, 0.1) for _ in range(1536)]
