from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    body = Column(Text)
    type = Column(String)  # bug, feature, question
    priority = Column(String) # low, medium, high, critical
    created_at = Column(DateTime, default=datetime.utcnow)
    github_url = Column(String, nullable=True)
    
    # Track historical analyses matching to this issue
    analyses = relationship("AnalysisHistory", back_populates="issue")

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"))
    classification_result = Column(JSON)
    confidence_score = Column(Float)
    similar_issues = Column(JSON) # Store array of similar IDs/urls
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="analyses")
