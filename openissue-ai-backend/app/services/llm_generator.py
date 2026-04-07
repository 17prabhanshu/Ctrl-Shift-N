import httpx
import logging
import json
import re
from config import settings
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class LLMGenerator:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]  # gemini-2.0-flash is the only one confirmed reachable with this key.

    def _is_available(self) -> bool:
        return bool(self.api_key) and self.api_key != "your_gemini_api_key_here"

    async def _call_gemini(self, prompt: str, temperature: float = 0.3) -> Optional[dict]:
        """Core Gemini API call with JSON response mode, retry logic, and model fallback."""
        if not self._is_available():
            return None

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": temperature
            }
        }

        import asyncio
        
        for model_name in self.models:
            endpoint = f"{self.base_url}/{model_name}:generateContent?key={self.api_key}"
            
            for attempt in range(2):  # 2 retries per model to fail fast
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        response = await client.post(endpoint, json=payload)
                        
                        if response.status_code == 429:
                            wait_time = 5.0 + (attempt * 5.0)  # Heavy backoff for confirmed rate limiting
                            logger.warning(f"Rate limited on {model_name} (attempt {attempt+1}/2). Waiting {wait_time}s...")
                            await asyncio.sleep(wait_time)
                            continue
                        
                        response.raise_for_status()
                        data = response.json()
                        json_text = data['candidates'][0]['content']['parts'][0]['text']
                        clean_json = re.sub(r'```json\n?|\n?```', '', json_text).strip()
                        result = json.loads(clean_json)
                        logger.info(f"Gemini ({model_name}) responded successfully")
                        return result
                        
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429:
                        continue
                    logger.error(f"Gemini HTTP error on {model_name}: {e.response.status_code}")
                    break  # Try next model
                except Exception as e:
                    logger.error(f"Gemini API error on {model_name}: {str(e)}")
                    break  # Try next model
            
            logger.warning(f"Model {model_name} exhausted. Trying fallback...")

        logger.error("All Gemini models failed. Falling back to heuristic engine.")
        return None

    async def generate_reasoned_analysis(self, title: str, body: str, signals: Dict[str, Any]) -> Dict[str, Any]:
        """
        PRIMARY AI BRAIN: Generates classification, priority, labels, tech_domain, and reply.
        This is the core intelligence that replaces all hardcoded arrays.
        """
        if not self._is_available():
            logger.warning("GEMINI_API_KEY not found. LLM reasoning disabled.")
            return None

        prompt = f"""
        You are 'OpenIssue AI', a production-grade Autonomous GitHub Issue Triage Engine.
        Your task is to analyze the following GitHub issue and return a structured JSON response.

        ISSUE DETAILS:
        Title: {title}
        NLP Signals: {json.dumps(signals)}
        Body: {body[:2000]}

        INSTRUCTIONS:
        1. Classify the issue as exactly one of: [Bug, Feature, Question, Query, Procedure, Method].
        2. Determine Priority as exactly one of: [Low, Medium, High, Critical].
        3. Identify the 'tech_domain' — the specific technology area (e.g., 'React', 'Python', 'Rust', 'Docker', 'Auth', 'Database', 'TypeScript', 'CI/CD', 'Networking', 'Security', 'None').
        4. Suggest 3-5 native GitHub labels appropriate for this issue.
        5. Write a professional, technical 'response' (under 200 words) in Markdown that a maintainer would post as a comment.

        RETURN ONLY THIS JSON FORMAT:
        {{
            "classification": "ClassificationType",
            "priority": "PriorityLevel",
            "labels": ["label1", "label2"],
            "tech_domain": "DomainName",
            "response": "Markdown response text here..."
        }}
        """

        result = await self._call_gemini(prompt)
        if result:
            logger.info(f"LLM Core Analysis: {result.get('classification')} / {result.get('tech_domain')}")
        return result

    async def generate_dynamic_web_suggestions(self, title: str, body: str, tech_domain: str, issue_type: str, entities: list) -> Optional[list]:
        """
        DYNAMIC WEB SUGGESTIONS: The LLM generates real, contextual web suggestions
        instead of matching against a hardcoded array. This is the key upgrade that
        makes the system look professional, not pre-fed.
        """
        if not self._is_available():
            return None

        prompt = f"""
        You are an expert developer assistant. A GitHub issue has been analyzed:
        
        Title: {title}
        Type: {issue_type}
        Technology Domain: {tech_domain}
        Detected Entities: {', '.join(entities[:10]) if entities else 'None'}
        Body Excerpt: {body[:1000]}

        Generate 2-3 HIGHLY SPECIFIC web resource suggestions for the maintainer triaging this issue.
        Each suggestion must include:
        - A specific, actionable title (not generic)
        - The source/authority (e.g., "Official React Docs", "MDN Web Docs")
        - Detailed advice (2-3 sentences) explaining how this resource helps resolve THIS specific issue
        - A precise search query the maintainer can use on Google or StackOverflow
        - 2-3 real, relevant article links with their domains

        Be SPECIFIC to the actual issue content. Do NOT give generic advice.
        Reference real documentation URLs, Stack Overflow pages, or GitHub discussions
        that would genuinely help with this exact problem.

        RETURN THIS JSON FORMAT:
        {{
            "suggestions": [
                {{
                    "title": "Specific Resource Title",
                    "source": "Authority Source Name",
                    "advice": "Specific advice for this issue...",
                    "url": "https://real-documentation-url.com/relevant-page",
                    "search_query": "precise google search query for this issue",
                    "articles": [
                        {{"title": "Real Article Title", "url": "https://real-url.com/article", "domain": "real-url.com"}},
                        {{"title": "Another Relevant Article", "url": "https://another-real-url.com", "domain": "another-real-url.com"}}
                    ]
                }}
            ]
        }}
        """

        result = await self._call_gemini(prompt, temperature=0.4)
        if result and "suggestions" in result:
            logger.info(f"LLM Web Suggestions: Generated {len(result['suggestions'])} dynamic suggestions")
            return result["suggestions"]
        return None

    async def generate_dynamic_reasoning_trace(self, title: str, body: str, signals: Dict[str, Any], 
                                                classification: str, priority: str, 
                                                similar_count: int) -> Optional[list]:
        """
        DYNAMIC REASONING TRACE: Instead of template strings, the LLM explains
        its actual reasoning process for this specific issue.
        """
        if not self._is_available():
            return None

        prompt = f"""
        You are an AI that has just analyzed a GitHub issue. Explain your reasoning process
        as a 5-7 step trace showing how you arrived at your conclusions.

        Issue: "{title}"
        Body excerpt: {body[:800]}
        NLP Signals: {json.dumps(signals)}
        Final Classification: {classification}
        Final Priority: {priority}
        Similar Issues Found: {similar_count}

        For each step, provide:
        - A short step name (like "Content Extraction", "Signal Analysis", etc.)
        - A detailed explanation specific to THIS issue (not generic)

        Be specific. Reference actual content from the issue title and body.
        Explain WHY you chose this classification and priority, citing evidence.

        RETURN THIS JSON FORMAT:
        {{
            "steps": [
                {{"step": "Step Name", "icon": "extract", "detail": "Specific explanation..."}},
                {{"step": "Another Step", "icon": "analyze", "detail": "Another specific explanation..."}}
            ]
        }}
        """

        result = await self._call_gemini(prompt, temperature=0.2)
        if result and "steps" in result:
            logger.info(f"LLM Reasoning Trace: {len(result['steps'])} steps generated")
            return result["steps"]
        return None

    async def generate_dynamic_labels(self, title: str, body: str, tech_domain: str,
                                       classification: str, priority: str) -> Optional[list]:
        """
        DYNAMIC LABEL SUGGESTION: LLM suggests labels based on actual content analysis,
        not a hardcoded type_map dictionary.
        """
        if not self._is_available():
            return None

        prompt = f"""
        You are a GitHub repository maintainer. Suggest 3-6 appropriate labels for this issue.
        
        Title: {title}
        Body excerpt: {body[:500]}
        Classification: {classification}
        Priority: {priority}
        Technology: {tech_domain}

        Consider standard GitHub label conventions:
        - Type labels (bug, enhancement, question, documentation)
        - Priority labels (priority: critical, priority: high, priority: low)
        - Status labels (needs: reproduction, needs: more info, help wanted, good first issue)
        - Technology labels (react, python, typescript, docker, etc.)
        - Area labels (area: api, area: auth, area: ui, etc.)

        Only suggest labels that genuinely apply to this specific issue.

        RETURN THIS JSON FORMAT:
        {{
            "labels": ["label1", "label2", "label3"]
        }}
        """

        result = await self._call_gemini(prompt, temperature=0.2)
        if result and "labels" in result:
            return result["labels"]
        return None

    def heuristic_fallback_reply(self, classification: str, priority: str) -> str:
        """Fallback deterministic response if LLM is offline."""
        responses = {
            "Bug": f"Thank you for reporting this **Bug**. Our initial analysis marked this as **{priority}**. A maintainer will investigate shortly.",
            "Feature": f"This sounds like a great **Feature** proposal! We've categorized this as **{priority}** priority.",
            "Question": f"Thanks for the **Question**. We've categorized this as **{priority}** priority. Documentation links are provided below."
        }
        return responses.get(classification, "Thank you for the issue! We are analyzing it now.")
