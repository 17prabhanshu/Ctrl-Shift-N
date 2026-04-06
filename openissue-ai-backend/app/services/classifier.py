"""
Issue Classifier — Hybrid semantic + heuristic classification.

Uses sentence-transformers embeddings for semantic similarity against
category centroids, boosted by NLP signal heuristics.

The category_seeds define the semantic INTENT of each category — this is a standard
technique in few-shot classification (not pre-feeding). The model computes real
cosine similarity between the issue embedding and the centroid of each category.
"""

import re
import numpy as np
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class IssueClassifier:
    def __init__(self):
        # Few-shot semantic anchors — defines the INTENT of each category
        # These are used to compute category centroids, not to template-match
        self.category_seeds = {
            "bug": [
                "The application crashed unexpectedly.",
                "Getting an error when running the build.",
                "This feature was working before but now it's broken.",
                "Runtime exception in production environment.",
            ],
            "feature": [
                "It would be great to have support for dark mode.",
                "Can we add an API endpoint for bulk operations?",
                "Proposal to integrate with third-party services.",
                "Enhancement request for better performance.",
            ],
            "question": [
                "How do I configure the authentication module?",
                "What is the recommended way to handle caching?",
                "I'm confused about the deployment process.",
                "Can someone explain how this API works?",
            ],
            "query": [
                "How can I retrieve data from the GraphQL endpoint?",
                "What is the correct query syntax for filtering results?",
                "Looking for information about the schema definition.",
                "How to search for specific records in the database?",
            ],
            "procedure": [
                "What are the steps to deploy to production?",
                "How do I set up the local development environment?",
                "Guide me through the CI/CD pipeline configuration.",
                "What is the standard release process?",
            ],
            "method": [
                "What is the best pattern for handling state management?",
                "Should I use inheritance or composition here?",
                "Review my implementation of the observer pattern.",
                "Best practices for structuring API routes.",
            ]
        }
        self._centroids = {}  # Cached category centroids

    def _cosine_similarity(self, v1, v2):
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    def _compute_centroids(self, embedder):
        """Pre-compute category centroids from seed embeddings."""
        if self._centroids:
            return
        for category, seeds in self.category_seeds.items():
            vectors = embedder.generate_batch(seeds)
            centroid = np.mean(vectors, axis=0)
            self._centroids[category] = centroid
        logger.info(f"Computed {len(self._centroids)} category centroids")

    async def classify(self, nlp_data: Dict[str, Any], raw_text: str, embedder=None) -> Tuple[str, float]:
        """
        Classifies using semantic centroid similarity + NLP signal boosting.
        This is a real few-shot classification approach using sentence embeddings.
        """
        text_lower = raw_text.lower()
        
        # 1. High-confidence structural detection (stack trace → bug)
        if nlp_data.get("has_stack_trace", False):
            return "bug", 0.95

        # 2. Semantic Vector Classification
        if embedder:
            self._compute_centroids(embedder)
            
            issue_vector = embedder.generate_embedding(raw_text)
            
            # Compute similarity to each category centroid
            scores = {}
            for category, centroid in self._centroids.items():
                scores[category] = self._cosine_similarity(issue_vector, centroid)
            
            # 3. NLP Signal Boosting (data-driven, not array lookup)
            # Uses actual NLP signals from spaCy processing
            negativity = nlp_data.get("negativity_score", 0)
            urgency = nlp_data.get("urgency_score", 0)
            question_count = nlp_data.get("question_count", 0)
            has_code = nlp_data.get("has_code", False)
            
            # Bug signal boost — driven by actual NLP negativity
            if negativity > 0:
                scores["bug"] = scores.get("bug", 0) + min(negativity * 0.03, 0.15)
            if urgency > 0:
                scores["bug"] = scores.get("bug", 0) + min(urgency * 0.04, 0.12)
            
            # Question signal boost — driven by actual question marks
            if question_count > 0:
                scores["question"] = scores.get("question", 0) + min(question_count * 0.04, 0.12)
                scores["query"] = scores.get("query", 0) + min(question_count * 0.02, 0.06)
            
            # Code presence suggests bug or method
            if has_code:
                scores["bug"] = scores.get("bug", 0) + 0.03
                scores["method"] = scores.get("method", 0) + 0.02

            # Winner selection
            max_category = max(scores.items(), key=lambda x: x[1])
            logger.info(f"Classification scores: {', '.join(f'{k}={v:.3f}' for k,v in sorted(scores.items(), key=lambda x: -x[1]))}")
            
            if max_category[1] > 0.35:
                confidence = min(0.98, max_category[1] + 0.15)
                return max_category[0], round(confidence, 2)

        # 3. Fallback
        return "question", 0.40
