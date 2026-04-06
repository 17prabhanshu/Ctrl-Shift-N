import re
from typing import Dict, Any, Tuple

class IssueClassifier:
    def classify(self, nlp_data: Dict[str, Any], raw_text: str) -> Tuple[str, float]:
        signals = {
            "bug": 0.0,
            "feature": 0.0,
            "question": 0.0
        }
        
        text_lower = raw_text.lower()
        
        # 1. Bug signals
        if nlp_data.get("has_stack_trace", False):
            signals["bug"] += 0.4
            
        bug_keywords = ["crash", "error", "broken", "fails", "exception", "bug", "issue", "doesn't work"]
        for kw in bug_keywords:
            if re.search(r'\b' + kw + r'\b', text_lower):
                signals["bug"] += 0.15
                
        # 2. Feature signals
        feature_keywords = ["add", "support", "would like", "feature", "enhancement", "proposal", "improve"]
        for kw in feature_keywords:
            if re.search(r'\b' + kw + r'\b', text_lower):
                signals["feature"] += 0.15
        
        # 3. Question signals
        if nlp_data.get("question_count", 0) > 0:
            signals["question"] += 0.3 * min(nlp_data["question_count"], 2)
            
        question_keywords = ["how to", "why", "what is", "can i", "documentation", "help"]
        for kw in question_keywords:
            if re.search(r'\b' + kw + r'\b', text_lower):
                signals["question"] += 0.2

        # Winner
        max_type = max(signals.items(), key=lambda x: x[1])
        base_confidence = min(max_type[1], 0.95)
        
        if base_confidence < 0.2:
            return "question", 0.45 # fallback
            
        return max_type[0], round(base_confidence, 2)
