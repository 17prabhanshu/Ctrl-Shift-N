# OpenIssue AI v3.0 — Dynamic Analysis Engine
# All intelligence is LLM-driven. Hardcoded arrays are FALLBACK ONLY.

from app.services.nlp_processor import NLPProcessor
from app.services.classifier import IssueClassifier
from app.services.priority import PriorityScorer
from app.services.embeddings import EmbeddingsManager
from app.services.vector_store import VectorStore
from app.services.llm_generator import LLMGenerator
from app.services.playwright_scraper import PlaywrightScraper
from config import settings
import logging
import re

logger = logging.getLogger(__name__)

class IssueAnalyzer:
    def __init__(self):
        self.nlp = NLPProcessor()
        self.classifier = IssueClassifier()
        self.scorer = PriorityScorer()
        self.embedder = EmbeddingsManager()
        self.vector_store = VectorStore()
        self.llm = LLMGenerator()
        self.scraper = PlaywrightScraper()

    async def initialize(self):
        logger.info("Initializing NLP models...")
        self.nlp.initialize()
        self.embedder.initialize()
        self.vector_store.load()
        logger.info("Analyzer initialized.")

    async def analyze(self, title: str, body: str, metadata: any, issue_comments: int = 0, issue_reactions: int = 0, github_url: str = "") -> dict:
        raw_text = f"{title}\n{body}"
        
        # ── Step 0: Playwright Enrichment (optional) ──
        enrichment = None
        if settings.PLAYWRIGHT_ENABLED and github_url:
            try:
                enrichment = await self.scraper.enrich_analysis_context(github_url, body)
                if enrichment and enrichment.get("enriched"):
                    extra_context = enrichment.get("rendered_body", "")
                    if extra_context and len(extra_context) > len(body):
                        raw_text = f"{title}\n{extra_context}"
                    logger.info(f"Playwright enrichment: {enrichment.get('enrichment_summary', 'none')}")
            except Exception as e:
                logger.warning(f"Playwright enrichment failed (non-fatal): {e}")
        
        # ── Step 1: NLP Processing (spaCy — real framework) ──
        nlp_data = self.nlp.process_text(title, body)
        
        # ── Step 2: Embeddings & FAISS Semantic Search ──
        vector = self.embedder.generate_embedding(raw_text)
        similar_issues = self.vector_store.search(vector, k=3, threshold=0.5)

        # ── Step 3: LLM Core Analysis (PRIMARY BRAIN) ──
        llm_analysis = await self.llm.generate_reasoned_analysis(title, body, nlp_data)
        
        if llm_analysis:
            # === LLM-DRIVEN PATH (everything dynamic) ===
            issue_type = llm_analysis["classification"].lower()
            priority_level = llm_analysis["priority"].lower()
            suggested_reply = llm_analysis["response"]
            tech_domain = llm_analysis.get("tech_domain", "None")
            confidence = 0.98
            is_llm_generated = True

            # Dynamic labels from LLM (NOT hardcoded type_map)
            llm_labels = await self.llm.generate_dynamic_labels(
                title, body, tech_domain, issue_type, priority_level
            )
            suggested_labels = llm_labels if llm_labels else llm_analysis.get("labels", [])

            # Dynamic web suggestions from LLM (NOT hardcoded tech_patterns)
            entities = nlp_data.get("entities", [])
            llm_suggestions = await self.llm.generate_dynamic_web_suggestions(
                title, body, tech_domain, issue_type, entities
            )
            web_suggestions = llm_suggestions if llm_suggestions else self._fallback_web_advice(title, issue_type)

            # Dynamic reasoning trace from LLM (NOT template strings)
            llm_reasoning = await self.llm.generate_dynamic_reasoning_trace(
                title, body, nlp_data, issue_type, priority_level, len(similar_issues)
            )
            reasoning_steps = llm_reasoning if llm_reasoning else self._fallback_reasoning_trace(
                title, body, nlp_data, issue_type, priority_level, metadata
            )
            
        else:
            # === HEURISTIC FALLBACK (LLM offline) ===
            issue_type, confidence = await self.classifier.classify(nlp_data, raw_text, embedder=self.embedder)
            priority_level, _ = self.scorer.score(nlp_data, raw_text, issue_type, metadata, issue_comments, issue_reactions)
            suggested_reply = self.llm.heuristic_fallback_reply(issue_type.capitalize(), priority_level.capitalize())
            suggested_labels = self._fallback_label_suggest(issue_type, priority_level, nlp_data, raw_text)
            tech_domain = "None"
            is_llm_generated = False
            web_suggestions = self._fallback_web_advice(title, issue_type)
            reasoning_steps = self._fallback_reasoning_trace(title, body, nlp_data, issue_type, priority_level, metadata)

        # ── Step 4: Priority score (numerical baseline) ──
        _, priority_score = self.scorer.score(nlp_data, raw_text, issue_type, metadata, issue_comments, issue_reactions)
        
        explanations = [step["detail"] for step in reasoning_steps]
        
        return {
            "issue_title": title,
            "classification": {
                "type": issue_type.capitalize(),
                "confidence": confidence
            },
            "priority": {
                "level": priority_level.capitalize(),
                "score": priority_score
            },
            "similar_issues": similar_issues,
            "explanation": explanations,
            "reasoning_steps": reasoning_steps,
            "suggested_reply": suggested_reply,
            "is_llm_generated": is_llm_generated,
            "web_suggestions": web_suggestions,
            "suggested_labels": suggested_labels,
            "confidence_overall": confidence,
            "nlp_signals": {
                "has_code": nlp_data.get("has_code", False),
                "code_block_count": nlp_data.get("code_block_count", 0),
                "has_stack_trace": nlp_data.get("has_stack_trace", False),
                "entities": nlp_data.get("entities", [])[:10],
                "entity_types": nlp_data.get("entity_types", {}),
                "noun_phrases": nlp_data.get("noun_phrases", [])[:12],
                "tech_terms": nlp_data.get("tech_terms", []),
                "word_count": nlp_data.get("word_count", 0),
                "sentence_count": nlp_data.get("sentence_count", 0),
                "question_count": nlp_data.get("question_count", 0),
                "negative_signals": nlp_data.get("negative_signals", []),
                "urgency_signals": nlp_data.get("urgency_signals", []),
                "quality_score": nlp_data.get("quality_score", 20),
                "has_reproduction_steps": nlp_data.get("has_reproduction_steps", False),
                "has_expected_behavior": nlp_data.get("has_expected_behavior", False),
                "has_environment_info": nlp_data.get("has_environment_info", False),
            },
            "processing_metadata": {
                "engine": "llm" if is_llm_generated else "heuristic",
                "model": "gemini-1.5-flash" if is_llm_generated else "spaCy + FAISS",
                "tech_domain": tech_domain,
            }
        }

    # ═══════════════════════════════════════════════════════════
    # FALLBACK METHODS — Only used when LLM is offline/fails
    # These are the "old" hardcoded approaches, clearly marked.
    # ═══════════════════════════════════════════════════════════

    def _fallback_reasoning_trace(self, title: str, body: str, nlp_data: dict, issue_type: str, priority_level: str, metadata: any) -> list:
        """FALLBACK: Template-based reasoning trace when LLM is unavailable."""
        steps = []
        text = f"{title} {body}".lower()
        entities = nlp_data.get("entities", [])
        word_count = nlp_data.get("word_count", 0)
        
        steps.append({
            "step": "Content Extraction",
            "icon": "extract",
            "detail": f"[Heuristic] Extracted {word_count} tokens. Detected {len(entities)} entities: {', '.join(entities[:5]) if entities else 'none'}."
        })

        if nlp_data.get("has_stack_trace"):
            steps.append({"step": "Stack Trace Detection", "icon": "trace",
                "detail": "[Heuristic] Runtime stack trace or exception signature detected."})
        elif nlp_data.get("has_code"):
            steps.append({"step": "Code Block Analysis", "icon": "code",
                "detail": "[Heuristic] Inline code blocks found — likely a reproducible case."})
        else:
            steps.append({"step": "Text-Only Analysis", "icon": "text",
                "detail": "[Heuristic] No code/stack traces. Using linguistic analysis only."})

        steps.append({"step": f"Classification → {issue_type.capitalize()}", "icon": "classify",
            "detail": f"[Heuristic] Classified as '{issue_type}' using semantic similarity against category seed embeddings."})

        steps.append({"step": f"Priority → {priority_level.capitalize()}", "icon": "priority",
            "detail": f"[Heuristic] Priority scored by keyword severity map + contextual multipliers."})

        steps.append({"step": "Semantic Deduplication", "icon": "vector",
            "detail": "[Framework: FAISS] Ran ANN search across vector index. Cosine threshold: 0.50."})

        return steps

    def _fallback_web_advice(self, title: str, issue_type: str) -> list:
        """FALLBACK: Generic advice when LLM cannot generate dynamic suggestions."""
        clean_title = re.sub(r'[^\w\s]', '', title[:60]).strip()
        return [{
            "source": "Fallback Engine (LLM Unavailable)",
            "title": f"Search Results for: {clean_title}",
            "advice": f"The AI suggestion engine is currently offline. Search for related issues and documentation manually using the query below.",
            "url": f"https://stackoverflow.com/search?q={clean_title.replace(' ', '+')}",
            "search_query": f"site:stackoverflow.com OR site:github.com {clean_title}",
            "articles": [
                {"title": f"StackOverflow: {clean_title}", "url": f"https://stackoverflow.com/search?q={clean_title.replace(' ', '+')}", "domain": "stackoverflow.com"},
                {"title": f"GitHub Issues: {clean_title}", "url": f"https://github.com/search?q={clean_title.replace(' ', '+')}&type=issues", "domain": "github.com"},
            ]
        }]

    def _fallback_label_suggest(self, issue_type: str, priority_level: str, nlp_data: dict, text: str) -> list:
        """FALLBACK: Rule-based label suggestion when LLM is unavailable."""
        labels = []
        tl = text.lower()
        
        type_map = {"bug": "bug", "feature": "enhancement", "question": "question"}
        labels.append(type_map.get(issue_type, "triage"))
        
        if priority_level in ["critical", "high"]:
            labels.append("priority: high")
        elif priority_level == "low":
            labels.append("good first issue")
            
        if nlp_data.get("has_stack_trace"):
            labels.append("needs: reproduction")
        
        # Basic tech detection as fallback
        for kw, lbl in {"react": "react", "python": "python", "docker": "docker",
                         "rust": "rust", "typescript": "typescript"}.items():
            if kw in tl:
                labels.append(lbl)
                break
                
        return list(set(labels))[:5]
