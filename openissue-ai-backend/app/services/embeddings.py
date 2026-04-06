import logging
from config import settings
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingsManager:
    def __init__(self):
        self.model = None

    def initialize(self):
        if not self.model:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("Embedding model loaded.")

    def generate_embedding(self, text: str) -> np.ndarray:
        if not self.model:
            self.initialize()
            
        vector = self.model.encode(text, convert_to_numpy=True)
        return vector

    def generate_batch(self, texts: list[str]) -> np.ndarray:
        if not self.model:
            self.initialize()
            
        vectors = self.model.encode(texts, convert_to_numpy=True)
        return vectors
