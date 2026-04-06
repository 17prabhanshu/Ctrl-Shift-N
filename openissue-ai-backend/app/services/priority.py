from typing import Tuple, Dict, Any
import re

class PriorityScorer:
    def score(self, nlp_data: Dict[str, Any], raw_text: str, issue_type: str, metadata: Any, comments: int = 0, reactions: int = 0) -> Tuple[str, int]:
        score = 0
        text_lower = raw_text.lower()
        
        # 1. Severity Keywords with weights
        severity_map = {
            "critical": 35, "crash": 30, "blocker": 35, "blocking": 30,
            "urgent": 25, "asap": 20, "memory leak": 30, "security": 40,
            "data loss": 45, "regression": 25, "broken": 20, "production": 30,
            "outage": 40, "vulnerability": 45, "exploit": 45, "panic": 35,
        }
        for kw, pts in severity_map.items():
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                score += pts
                
        # 2. Metadata / Labels
        if metadata and getattr(metadata, 'labels', None):
            for label in metadata.labels:
                lbl = label.lower()
                if any(x in lbl for x in ["high", "critical", "p0", "p1", "blocker", "urgent"]):
                    score += 40
                elif any(x in lbl for x in ["security", "priority"]):
                    score += 30
                elif any(x in lbl for x in ["bug", "regression"]):
                    score += 15
                    
        # 3. Stack Trace bump
        if nlp_data.get('has_stack_trace', False):
            score += 25
            
        # 4. Code blocks indicate reproducibility (slight bump)
        if nlp_data.get('has_code', False):
            score += 8
            
        # 5. Issue type
        if issue_type == "bug":
            score += 15
        elif issue_type == "feature":
            score -= 10
            
        # 6. Urgency markers
        exclamations = nlp_data.get('exclamation_count', 0)
        score += min(exclamations * 5, 15)
        
        # 7. Community engagement bump (comments/reactions indicate importance)
        if comments > 10:
            score += 15
        elif comments > 5:
            score += 8
        if reactions > 10:
            score += 10
        
        score = max(0, min(100, score))
        
        if score > 85:
            level = "critical"
        elif score > 60:
            level = "high"
        elif score > 30:
            level = "medium"
        else:
            level = "low"
            
        return level, int(score)
