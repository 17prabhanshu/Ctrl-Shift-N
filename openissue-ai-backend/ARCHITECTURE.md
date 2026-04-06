# OpenIssue AI — Backend Architecture
## AI Analysis Pipeline
1. **GitHub Scraper** (`main.py`) — Fetches live issue data via GitHub REST API including title, body, labels, reactions and comment count.
2. **NLP Processor** (`nlp_processor.py`) — spaCy-powered entity extraction, stack trace detection, code block parsing and token analysis.
3. **Issue Classifier** (`classifier.py`) — Multi-signal keyword classifier that determines issue type: Bug, Feature, or Question.
4. **Priority Scorer** (`priority.py`) — Weighted scoring engine using severity keywords, labels, stack traces and community engagement signals.
5. **Embeddings Manager** (`embeddings.py`) — Generates semantic embeddings using sentence-transformers (all-MiniLM-L6-v2).
6. **Vector Store** (`vector_store.py`) — FAISS approximate nearest-neighbor search for duplicate issue detection.
7. **Analyzer** (`analyzer.py`) — Orchestrates all pipeline stages and generates the final AI reasoning trace, web suggestions and auto-reply.
## Tech Stack
- FastAPI + Uvicorn
- spaCy (en_core_web_sm)
- sentence-transformers
- FAISS (faiss-cpu)
- SQLAlchemy + aiosqlite
- httpx (GitHub API client)
