import os
import faiss
import numpy as np
import json
import logging

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, index_path="data/embeddings.faiss", metadata_path="data/metadata.json"):
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.index = None
        self.metadata = [] # list of dicts mapping to index rows
        self._dimension = 384 # all-MiniLM-L6-v2 dimension

    def load(self):
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded FAISS index with {self.index.ntotal} items.")
            except Exception as e:
                logger.error(f"Failed to load FAISS index: {e}. Creating new.")
                self._create_new()
        else:
            self._create_new()

    def _create_new(self):
        self.index = faiss.IndexFlatL2(self._dimension)
        self.metadata = []
        logger.info("Created new FAISS index.")

    def add(self, vector: np.ndarray, meta: dict):
        if self.index is None:
            self.load()
            
        vector = np.array(vector, dtype=np.float32).reshape(1, -1)
        faiss.normalize_L2(vector)
        self.index.add(vector)
        self.metadata.append(meta)
        
    def save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'w') as f:
            json.dump(self.metadata, f)

    def search(self, query_vector: np.ndarray, k: int = 3, threshold: float = 0.5):
        if self.index is None or self.index.ntotal == 0:
            return []
            
        vector = np.array(query_vector, dtype=np.float32).reshape(1, -1)
        faiss.normalize_L2(vector)
        
        # FAISS IndexFlatL2 with normalized vectors computes equivalent of cosine similarity
        # L2 distance D = 2 - 2 * CosineSimilarity
        # CosineSimilarity = 1 - D/2
        
        distances, indices = self.index.search(vector, min(k, self.index.ntotal))
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx == -1: # FAISS padding
                continue
            
            l2_dist = distances[0][i]
            similarity = 1.0 - (l2_dist / 2.0)
            
            if similarity >= threshold:
                meta = self.metadata[idx]
                results.append({
                    "id": meta.get("id", "Unknown"),
                    "title": meta.get("title", ""),
                    "url": meta.get("url", ""),
                    "similarity": float(similarity)
                })
                
        return results
