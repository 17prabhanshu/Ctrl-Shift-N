from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class IssueMetadata(BaseModel):
    labels: List[str] = []
    author: Optional[str] = None
    repository: Optional[str] = None

class AnalysisRequest(BaseModel):
    github_url: str = Field(..., description="The GitHub issue URL to scrape and analyze")
    
class ClassificationDetails(BaseModel):
    type: str
    confidence: float

class PriorityDetails(BaseModel):
    level: str
    score: int

class SimilarIssue(BaseModel):
    id: str
    title: str
    similarity: float
    url: Optional[str] = None

class Article(BaseModel):
    title: str
    url: str
    domain: str

class WebSuggestion(BaseModel):
    source: str
    title: str
    advice: str
    url: str
    search_query: Optional[str] = ""
    articles: Optional[List[Article]] = []

class ReasoningStep(BaseModel):
    step: str
    icon: str
    detail: str

class NLPSignals(BaseModel):
    has_code: bool = False
    has_stack_trace: bool = False
    entities: List[str] = []
    word_count: int = 0
    question_count: int = 0

class AnalysisResponse(BaseModel):
    issue_title: str
    classification: ClassificationDetails
    priority: PriorityDetails
    similar_issues: List[SimilarIssue]
    explanation: List[str]
    reasoning_steps: List[ReasoningStep]
    suggested_reply: str
    web_suggestions: List[WebSuggestion]
    suggested_labels: List[str]
    confidence_overall: float
    processing_time_ms: int
    nlp_signals: NLPSignals
