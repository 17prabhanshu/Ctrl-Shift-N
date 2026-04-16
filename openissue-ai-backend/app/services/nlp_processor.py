"""
NLP Processor — spaCy-powered linguistic analysis engine.
Uses real NLP pipeline: tokenization, NER, POS tagging, dependency parsing,
sentence segmentation. Not regex-only.
"""

import spacy
import re
import logging
from typing import Dict, Any, List
from collections import Counter

logger = logging.getLogger(__name__)

class NLPProcessor:
    def __init__(self):
        self.nlp = None

    def initialize(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy NLP model (en_core_web_sm).")
        except OSError as e:
            logger.warning("spaCy model 'en_core_web_sm' not found. Falling back to blank English model.")
            self.nlp = spacy.blank("en")
        except Exception as e:
            logger.error(f"Failed to load spaCy model: {e}")
            raise

    def process_text(self, title: str, body: str) -> Dict[str, Any]:
        combined_text = f"{title}\n{body}"
        
        # 1. Regex-based structural extraction (pre-NLP)
        code_blocks = self._extract_code_blocks(body)
        has_stack_trace = self._detect_stack_traces(body)
        urls = self._extract_urls(combined_text)
        
        # 2. spaCy NLP pipeline
        if not self.nlp:
            self.initialize()
            
        doc = self.nlp(combined_text)
        
        # 3. Named Entity Recognition (NER)
        entities = []
        entity_labels = {}
        for ent in doc.ents:
            entities.append(ent.text)
            label = ent.label_
            entity_labels[label] = entity_labels.get(label, 0) + 1
        
        # 4. POS tagging — extract key tokens by part of speech
        nouns = [token.text.lower() for token in doc if token.pos_ in ("NOUN", "PROPN") and not token.is_stop and len(token.text) > 2]
        verbs = [token.lemma_.lower() for token in doc if token.pos_ == "VERB" and not token.is_stop]
        adjectives = [token.text.lower() for token in doc if token.pos_ == "ADJ" and not token.is_stop]
        
        # 5. Key noun phrases via dependency parsing
        noun_phrases = [chunk.text.lower() for chunk in doc.noun_chunks if len(chunk.text) > 3]
        
        # 6. Sentence-level analysis
        sentences = list(doc.sents)
        avg_sentence_length = sum(len(sent) for sent in sentences) / max(len(sentences), 1)
        
        # 7. Sentiment proxy — urgency/negativity markers from tokens
        negative_tokens = [token.text.lower() for token in doc if token.text.lower() in 
                          {"crash", "error", "fail", "broken", "bug", "issue", "wrong", "bad", 
                           "slow", "freeze", "stuck", "unable", "cannot", "impossible", "terrible",
                           "corrupt", "loss", "leak", "panic", "abort", "killed", "segfault"}]
        
        urgency_tokens = [token.text.lower() for token in doc if token.text.lower() in
                         {"urgent", "critical", "blocker", "asap", "immediately", "production",
                          "outage", "downtime", "security", "vulnerability", "exploit"}]
        
        # 8. Technical term detection (not hardcoded suggestions — just signal extraction)
        tech_tokens = self._extract_tech_terms(doc, noun_phrases)
        
        # 9. Punctuation & tone signals
        question_count = combined_text.count("?")
        exclamation_count = combined_text.count("!")
        
        # 10. Content quality signals
        has_reproduction_steps = bool(re.search(r'(steps to reproduce|reproduction|repro steps|how to reproduce)', combined_text, re.IGNORECASE))
        has_expected_behavior = bool(re.search(r'(expected behavior|expected result|should)', combined_text, re.IGNORECASE))
        has_environment_info = bool(re.search(r'(node|npm|python|version|os|operating system|windows|linux|macos|docker)', combined_text, re.IGNORECASE))
        
        return {
            # Core NLP
            "tokens": [token.text.lower() for token in doc if not token.is_stop and not token.is_punct],
            "entities": list(set(entities)),
            "entity_types": entity_labels,
            "noun_phrases": noun_phrases[:15],
            "key_nouns": list(Counter(nouns).most_common(10)),
            "key_verbs": list(Counter(verbs).most_common(8)),
            "key_adjectives": adjectives[:8],
            
            # Structural signals
            "has_code": len(code_blocks) > 0,
            "code_block_count": len(code_blocks),
            "has_stack_trace": has_stack_trace,
            "url_count": len(urls),
            
            # Sentence-level
            "sentence_count": len(sentences),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "word_count": len(doc),
            
            # Semantic tone
            "question_count": question_count,
            "exclamation_count": exclamation_count,
            "negative_signals": negative_tokens,
            "urgency_signals": urgency_tokens,
            "negativity_score": len(negative_tokens),
            "urgency_score": len(urgency_tokens),
            
            # Technical
            "tech_terms": tech_tokens,
            
            # Content quality
            "has_reproduction_steps": has_reproduction_steps,
            "has_expected_behavior": has_expected_behavior,
            "has_environment_info": has_environment_info,
            "quality_score": self._compute_quality_score(
                has_reproduction_steps, has_expected_behavior, 
                has_environment_info, len(code_blocks), len(sentences)
            ),
        }

    def _extract_code_blocks(self, text: str) -> List[str]:
        """Extract fenced code blocks."""
        return re.findall(r"```[\s\S]*?```", text)

    def _detect_stack_traces(self, text: str) -> bool:
        """Detect stack traces using structural patterns."""
        trace_patterns = [
            r"Traceback \(most recent call last\):",
            r"at\s+[\w\./<>]+\([\w\.]+:\d+\)",     # JS/Java stack frame
            r"File \"[^\"]+\", line \d+",              # Python frame
            r"panic: runtime error",                    # Go panic
            r"Segmentation fault",
            r"FATAL ERROR:",
            r"Unhandled(?:Promise)?Rejection",
            r"TypeError:|ReferenceError:|SyntaxError:",
            r"Exception in thread",
            r"\.java:\d+\)",
            r"\.tsx?:\d+:\d+",
        ]
        for pattern in trace_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    def _extract_urls(self, text: str) -> List[str]:
        """Extract URLs from text."""
        return re.findall(r'https?://[^\s\)>\]]+', text)

    def _extract_tech_terms(self, doc, noun_phrases: list) -> list:
        """Extract technology-specific terms dynamically from the text using NLP."""
        tech_terms = set()
        
        # Check for proper nouns that look like tech names
        for token in doc:
            if token.pos_ == "PROPN" and len(token.text) > 2:
                text_lower = token.text.lower()
                # Filter out common non-tech proper nouns
                if text_lower not in {"i", "we", "they", "he", "she", "it", "my", "our"}:
                    tech_terms.add(token.text)
        
        # Check noun phrases for multi-word tech terms
        for phrase in noun_phrases:
            if any(char in phrase for char in ['.', '-', '_']) or phrase.endswith('js') or phrase.endswith('py'):
                tech_terms.add(phrase)
        
        return list(tech_terms)[:12]

    def _compute_quality_score(self, has_repro: bool, has_expected: bool, 
                                has_env: bool, code_count: int, sentence_count: int) -> int:
        """Compute issue report quality score (0-100)."""
        score = 20  # base
        if has_repro: score += 25
        if has_expected: score += 20
        if has_env: score += 15
        if code_count > 0: score += 10
        if sentence_count >= 3: score += 10
        return min(100, score)
