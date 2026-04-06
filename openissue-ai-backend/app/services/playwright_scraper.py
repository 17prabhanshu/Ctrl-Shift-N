"""
Playwright-based GitHub Issue Scraper — Enrichment Layer

Uses headless Chromium to extract rich context from GitHub issue pages
that the REST API alone cannot provide:
  - Rendered markdown (not raw text)
  - Timeline events (linked PRs, cross-references)
  - Visual screenshot of the issue page
  
Falls back gracefully if Playwright is not installed.
"""

import logging
import asyncio
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Lazy import — only loaded if PLAYWRIGHT_ENABLED=True
_playwright_available = None

def _check_playwright():
    global _playwright_available
    if _playwright_available is None:
        try:
            from playwright.async_api import async_playwright
            _playwright_available = True
            logger.info("Playwright is available for rich page scraping.")
        except ImportError:
            _playwright_available = False
            logger.warning("Playwright not installed. Rich scraping disabled. Install with: pip install playwright && playwright install chromium")
    return _playwright_available


class PlaywrightScraper:
    """Enriches issue analysis with browser-rendered context."""

    def __init__(self):
        self.enabled = _check_playwright()

    async def scrape_issue_page(self, issue_url: str, take_screenshot: bool = False) -> Optional[Dict[str, Any]]:
        """
        Navigate to a GitHub issue page and extract rich context.
        
        Returns:
            dict with keys:
                - rendered_body: str — The rendered markdown as plain text
                - timeline_events: list — Linked PRs, commits, cross-references
                - linked_prs: list — PR numbers linked to this issue
                - screenshot_path: str|None — Path to screenshot if taken
        """
        if not self.enabled:
            logger.debug("Playwright not available, skipping enrichment.")
            return None

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(
                    viewport={"width": 1280, "height": 900},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) OpenIssueAI/3.0"
                )

                # Navigate to the issue
                await page.goto(issue_url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)  # Let JS render

                result = {
                    "rendered_body": "",
                    "timeline_events": [],
                    "linked_prs": [],
                    "screenshot_path": None,
                }

                # 1. Extract rendered issue body
                try:
                    body_el = page.locator(".js-comment-body").first
                    result["rendered_body"] = await body_el.inner_text(timeout=5000)
                except Exception:
                    logger.debug("Could not extract rendered body.")

                # 2. Extract timeline events (linked PRs, commits, cross-references)
                try:
                    timeline_items = page.locator(".TimelineItem-body")
                    count = await timeline_items.count()
                    events = []
                    for i in range(min(count, 20)):  # Cap at 20 events
                        try:
                            text = await timeline_items.nth(i).inner_text(timeout=2000)
                            if text.strip():
                                events.append(text.strip()[:200])  # Truncate long events
                        except Exception:
                            continue
                    result["timeline_events"] = events
                except Exception:
                    logger.debug("Could not extract timeline events.")

                # 3. Extract linked PRs
                try:
                    pr_links = page.locator('a[href*="/pull/"]')
                    pr_count = await pr_links.count()
                    prs = set()
                    for i in range(min(pr_count, 10)):
                        try:
                            href = await pr_links.nth(i).get_attribute("href", timeout=2000)
                            if href and "/pull/" in href:
                                pr_num = href.split("/pull/")[-1].split("/")[0].split("#")[0]
                                if pr_num.isdigit():
                                    prs.add(f"#{pr_num}")
                        except Exception:
                            continue
                    result["linked_prs"] = list(prs)
                except Exception:
                    logger.debug("Could not extract linked PRs.")

                # 4. Optional screenshot
                if take_screenshot:
                    try:
                        screenshot_path = f"data/screenshots/issue_{issue_url.split('/')[-1]}.png"
                        import os
                        os.makedirs("data/screenshots", exist_ok=True)
                        await page.screenshot(path=screenshot_path, full_page=False)
                        result["screenshot_path"] = screenshot_path
                        logger.info(f"Screenshot saved: {screenshot_path}")
                    except Exception as e:
                        logger.warning(f"Screenshot failed: {e}")

                await browser.close()

                logger.info(f"Playwright enrichment complete: {len(result['timeline_events'])} timeline events, {len(result['linked_prs'])} linked PRs")
                return result

        except Exception as e:
            logger.error(f"Playwright scraping error: {e}")
            return None

    async def enrich_analysis_context(self, issue_url: str, existing_body: str) -> Dict[str, Any]:
        """
        High-level enrichment method. Returns enriched context dict
        that can be merged into the analyzer pipeline.
        """
        scrape_result = await self.scrape_issue_page(issue_url, take_screenshot=True)
        
        if not scrape_result:
            return {
                "enriched": False,
                "source": "api_only",
            }

        return {
            "enriched": True,
            "source": "playwright",
            "rendered_body": scrape_result["rendered_body"],
            "timeline_events": scrape_result["timeline_events"],
            "linked_prs": scrape_result["linked_prs"],
            "screenshot_path": scrape_result["screenshot_path"],
            "enrichment_summary": self._build_summary(scrape_result),
        }

    def _build_summary(self, scrape_result: Dict[str, Any]) -> str:
        """Build a human-readable summary of the enrichment."""
        parts = []
        if scrape_result["linked_prs"]:
            parts.append(f"Linked PRs: {', '.join(scrape_result['linked_prs'])}")
        if scrape_result["timeline_events"]:
            parts.append(f"{len(scrape_result['timeline_events'])} timeline events found")
        if scrape_result["screenshot_path"]:
            parts.append(f"Screenshot captured")
        return " | ".join(parts) if parts else "No additional context found"
