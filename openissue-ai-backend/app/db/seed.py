import asyncio
import json
import os
import sys

# Ensure app path is available
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import async_sessionmaker, engine, Base
from app.db.models import Issue
from app.services.embeddings import EmbeddingsManager
from app.services.vector_store import VectorStore
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    logger.info("Initializing vector DB and SQL schema...")
    
    # Create SQLite schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Initialize Embedder and VectorStore
    embedder = EmbeddingsManager()
    embedder.initialize()
    
    vstore = VectorStore()
    vstore.load()

    # Read seed JSON
    with open("data/seed_issues.json", "r") as f:
        issues_data = json.load(f)

    # Ingest into SQLite
    AsyncSessionLocal = async_sessionmaker(engine)
    async with AsyncSessionLocal() as session:
        for idx, item in enumerate(issues_data):
            # Check if exists
            text = f"{item['title']}\n{item['body']}"
            
            db_issue = Issue(
                title=item["title"],
                body=item["body"],
                type=item["type"],
                priority=item["priority"],
                github_url=item["url"]
            )
            session.add(db_issue)
            
            # Generate Embedding and add to FAISS
            vector = embedder.generate_embedding(text)
            
            meta = {
                "id": item["id"],
                "title": item["title"],
                "url": item["url"],
                "type": item["type"]
            }
            vstore.add(vector, meta)
            
        await session.commit()
    
    # Save FAISS memory mapping to disk
    vstore.save()
    logger.info(f"Seeding completed! {len(issues_data)} records added to SQLite and FAISS.")

if __name__ == "__main__":
    asyncio.run(seed_data())
