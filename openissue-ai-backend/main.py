from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.api.models import AnalysisRequest, AnalysisResponse
from app.services.analyzer import IssueAnalyzer

import time
import re
import logging
import httpx
from typing import Dict, Any, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OpenIssue AI API",
    description="Advanced GitHub issue triage backend with AI analysis pipeline",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = IssueAnalyzer()

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing models and connections...")
    await analyzer.initialize()
    logger.info("Startup complete. Systems ready.")

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}

async def fetch_github_issue(url: str) -> Tuple[str, str, Any, int, int]:
    """Extract owner/repo/id and call public GitHub API, returning rich metadata."""
    match = re.search(r"github\.com/([^/]+)/([^/]+)/issues/(\d+)", url)
    if not match:
        raise ValueError("Invalid GitHub issue URL format. Expected: https://github.com/owner/repo/issues/NUMBER")
    
    owner, repo, issue_num = match.groups()
    api_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_num}"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OpenIssue-AI/2.0"
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(api_url, headers=headers)
        
        if response.status_code == 404:
            raise ValueError(f"Issue not found. Repository '{owner}/{repo}' may be private or issue #{issue_num} doesn't exist.")
        if response.status_code == 403:
            raise ValueError("GitHub API rate limit exceeded. Please try again in a few minutes.")
        if response.status_code != 200:
            raise ValueError(f"GitHub API returned status {response.status_code}. Check the URL and try again.")
            
        data = response.json()
        title = data.get("title", "")
        body = data.get("body", "") or "No description provided."
        
        # Extract labels
        labels = [lbl.get("name") for lbl in data.get("labels", [])]
        
        # Extract engagement metrics
        comments = data.get("comments", 0)
        reactions = data.get("reactions", {}).get("total_count", 0)
        
        logger.info(f"Fetched issue: '{title}' | Labels: {labels} | Comments: {comments} | Reactions: {reactions}")
        
        class MockMeta:
            def __init__(self, lbs, auth, rep):
                self.labels = lbs
                self.author = auth
                self.repository = rep
                
        author = data.get("user", {}).get("login", "unknown")
        meta = MockMeta(labels, author, f"{owner}/{repo}")
        
        return title, body, meta, comments, reactions

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_issue(request: AnalysisRequest):
    start_time = time.time()
    try:
        logger.info(f"Analyzing GitHub URL: {request.github_url}")
        title, body, metadata, comments, reactions = await fetch_github_issue(request.github_url)
        
        result = await analyzer.analyze(title, body, metadata, comments, reactions)
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        result["processing_time_ms"] = processing_time_ms
        
        logger.info(f"Analysis complete in {processing_time_ms}ms | Type: {result['classification']['type']} | Priority: {result['priority']['level']}")
        
        return AnalysisResponse(**result)
    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Cannot reach GitHub API. Please check your internet connection.")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="GitHub API request timed out. Please try again.")
    except Exception as e:
        logger.error(f"Unexpected error analyzing issue: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")


@app.post("/api/webhook/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    """GitHub repository webhook endpoint."""
    return {"status": "Webhook operational."}
