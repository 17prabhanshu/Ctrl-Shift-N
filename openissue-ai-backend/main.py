from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.api.models import AnalysisRequest, AnalysisResponse
from app.services.analyzer import IssueAnalyzer
from app.services.github_webhook import GitHubWebhookHandler

import time
import re
import logging
import httpx
from typing import Dict, Any, Tuple
from config import settings

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
webhook_handler = GitHubWebhookHandler(analyzer)

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
    """GitHub repository webhook endpoint — fixed stream-read and diagnostic logging."""
    # 1. Read raw payload ONCE — stream can only be consumed once
    payload_body = await request.body()
    signature_header = request.headers.get("x-hub-signature-256", "")
    event_type = request.headers.get("x-github-event", "")

    logger.info("--- WEBHOOK RECEIVED ---")
    logger.info(f"Event: '{event_type}' | Body length: {len(payload_body)} bytes | Sig prefix: {signature_header[:30]}")

    # 2. Verify signature (DIAGNOSTIC: Logs but proceeds if secret is missing)
    try:
        webhook_handler.verify_signature(payload_body, signature_header)
    except HTTPException as e:
        logger.error(f"Signature Verification FAILED: {e.detail}")
        raise e

    # 3. Parse JSON from already-read bytes
    import json as json_lib
    try:
        payload_json = json_lib.loads(payload_body)
    except Exception as parse_err:
        logger.error(f"Failed to parse JSON payload: {parse_err}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 4. Hand off to background task
    logger.info(f"Dispatching background task for '{event_type}' event...")
    background_tasks.add_task(webhook_handler.process_webhook, event_type, payload_json)

    return {"status": "Accepted", "message": "Webhook received and processing."}

# Alias for old path compatibility
@app.post("/webhook/github")
async def github_webhook_alias(request: Request, background_tasks: BackgroundTasks):
    return await github_webhook(request, background_tasks)


# ═══════════════════════════════════════════════════════
# Webhook Configuration API (Precursor System)
# ═══════════════════════════════════════════════════════

@app.get("/api/webhook/config")
async def get_webhook_config():
    """Get current webhook precursor configuration."""
    return {
        "mode": settings.WEBHOOK_MODE,
        "keyword_triggers": settings.WEBHOOK_KEYWORD_TRIGGERS,
        "label_triggers": settings.WEBHOOK_LABEL_TRIGGERS,
        "repo_allowlist": settings.WEBHOOK_REPO_ALLOWLIST,
        "skip_bots": settings.WEBHOOK_SKIP_BOTS,
        "playwright_enabled": settings.PLAYWRIGHT_ENABLED,
    }

@app.put("/api/webhook/config")
async def update_webhook_config(config: dict):
    """Update webhook precursor configuration at runtime."""
    if "mode" in config:
        settings.WEBHOOK_MODE = config["mode"]
    if "keyword_triggers" in config:
        settings.WEBHOOK_KEYWORD_TRIGGERS = config["keyword_triggers"]
    if "label_triggers" in config:
        settings.WEBHOOK_LABEL_TRIGGERS = config["label_triggers"]
    if "repo_allowlist" in config:
        settings.WEBHOOK_REPO_ALLOWLIST = config["repo_allowlist"]
    if "skip_bots" in config:
        settings.WEBHOOK_SKIP_BOTS = config["skip_bots"]
    
    logger.info(f"Webhook config updated: mode={settings.WEBHOOK_MODE}, keywords={len(settings.WEBHOOK_KEYWORD_TRIGGERS)}, labels={len(settings.WEBHOOK_LABEL_TRIGGERS)}")
    return {"status": "updated", "config": await get_webhook_config()}

@app.post("/api/webhook/test")
async def test_webhook_precursors(payload: dict):
    """
    Test if a hypothetical issue would trigger the webhook.
    Set 'real_run': true to perform a full AI triage simulation (NLP + reasoning).
    """
    title = payload.get("title", "")
    body = payload.get("body", "")
    labels = payload.get("labels", [])
    author = payload.get("author", "testuser")
    repo = payload.get("repo", "owner/repo")
    real_run = payload.get("real_run", False)
    
    results = {
        "mode": settings.WEBHOOK_MODE,
        "would_trigger": False,
        "reasons": [],
        "skipped_reasons": [],
        "simulation": None
    }
    
    # 1. Check Precursor Logic
    if settings.WEBHOOK_MODE == "manual":
        results["skipped_reasons"].append("Webhook mode is 'manual' — all events ignored.")
    elif settings.WEBHOOK_MODE == "auto":
        results["would_trigger"] = True
        results["reasons"].append("Mode is 'auto' — all events processed.")
    else:
        # Precursor mode
        full_text = f"{title} {body}".lower()
        if settings.WEBHOOK_SKIP_BOTS and (author.endswith("[bot]") or author.endswith("-bot")):
            results["skipped_reasons"].append(f"Author '{author}' is a bot.")
        elif settings.WEBHOOK_REPO_ALLOWLIST and repo not in settings.WEBHOOK_REPO_ALLOWLIST:
            results["skipped_reasons"].append(f"Repo '{repo}' not in allowlist.")
        else:
            matched_kw = [kw for kw in settings.WEBHOOK_KEYWORD_TRIGGERS if kw.lower() in full_text]
            if matched_kw:
                results["reasons"].append(f"Keyword match: {matched_kw}")
            
            matched_lbl = [lbl for lbl in labels if lbl.lower() in [t.lower() for t in settings.WEBHOOK_LABEL_TRIGGERS]]
            if matched_lbl:
                results["reasons"].append(f"Label match: {matched_lbl}")
            
            results["would_trigger"] = len(results["reasons"]) > 0
            if not results["would_trigger"]:
                results["skipped_reasons"].append("No keyword or label triggers matched.")

    # 2. Optional Full AI Simulation
    if results["would_trigger"] and real_run:
        logger.info(f"SIMULATION: Running full AI analysis for '{title[:30]}...'")
        try:
            # Mock metadata for analyzer
            class MockMeta:
                def __init__(self, lbs, auth, rep):
                    self.labels = lbs
                    self.author = auth
                    self.repository = rep
            
            meta = MockMeta(labels, author, repo)
            analysis = await analyzer.analyze(title=title, body=body, metadata=meta)
            
            # Format the "would-be" comment (from execute_github_admin_actions logic)
            ctype = analysis["classification"]["type"]
            prio = analysis["priority"]["level"]
            p_icon = "🟢" if prio == "Low" else "🟡" if prio == "Medium" else "🔴" if prio == "High" else "🚨"
            
            results["simulation"] = {
                "classification": ctype,
                "priority": prio,
                "suggested_labels": analysis["suggested_labels"],
                "suggested_reply": analysis["suggested_reply"],
                "is_llm_generated": analysis["is_llm_generated"],
                "bot_comment_preview": (
                    f"🤖 **OpenIssue AI Automated Triage**\n\n"
                    f"**Classification:** `{ctype}`\n"
                    f"**Priority:** {p_icon} `{prio}`\n\n"
                    "--- \n\n"
                    f"### Assistant Reply\n{analysis['suggested_reply']}\n\n"
                    "---\n*Simulated response.*"
                )
            }
        except Exception as e:
            logger.error(f"Simulation failed: {e}")
            results["simulation_error"] = str(e)
    
    return results

