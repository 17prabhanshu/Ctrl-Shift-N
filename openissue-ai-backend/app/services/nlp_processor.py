import spacy
import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class NLPProcessor:
    def __init__(self):
        self.nlp = None

    def initialize(self):
        try:
            # Load small model for speed; lazy load to prevent long startup times blocking imports
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy NLP model (en_core_web_sm).")
        except Exception as e:
            logger.error(f"Failed to load spaCy model: {e}")
            raise

    def process_text(self, title: str, body: str) -> Dict[str, Any]:
        combined_text = f"{title}\n{body}"
        
        # 1. Regex extractions
        code_blocks = self._extract_code_blocks(body)
        stack_traces = self._detect_stack_traces(body)
        
        # 2. NLP (spaCy) parsing
        if not self.nlp:
            self.initialize()
            
        doc = self.nlp(combined_text)
        
        # 3. Extract entities, tokens, and basic punctuation stats
        entities = [ent.text for ent in doc.ents]
        tokens = [token.text.lower() for token in doc if not token.is_stop and not token.is_punct]
        
        question_count = combined_text.count("?")
        exclamation_count = combined_text.count("!")
        
        return {
            "tokens": tokens,
            "entities": list(set(entities)),
            "has_code": len(code_blocks) > 0,
            "has_stack_trace": stack_traces,
            "question_count": question_count,
            "exclamation_count": exclamation_count,
            "word_count": len(doc)
        }

    def _extract_code_blocks(self, text: str) -> List[str]:
        # Match ```code``` blocks
        pattern = r"```[\s\S]*?```"
        return re.findall(pattern, text)

    def _detect_stack_traces(self, text: str) -> bool:
        # Simple heuristics for stack traces (Error:, Exception:, at line x, Traceback)
        trace_keywords = [
            r"Traceback \(most recent call last\):",
            r"Exception:",
            r"Error:",
            r"\s+at\s+[\w\.\/<>]+\.[\w<>]+",  # JS/Java 'at Module.function'
            r".java:\d+",
            r".tsx:\d+"
        ]
        text_lower = text
        for kw in trace_keywords:
            if re.search(kw, text_lower, re.IGNORECASE):
                return True
        return False
