from sqlalchemy import Column, Integer, String, ForeignKey, Text, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class PeerEvaluation(Base):
    __tablename__ = "peer_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    evaluator_id = Column(Integer, ForeignKey("users.id"))
    evaluatee_id = Column(Integer, ForeignKey("users.id"))
    assignment_id = Column(Integer, ForeignKey("task_assignments.id"))
    
    # Core evaluation metrics
    technical_score = Column(Float)  # Technical competency score
    collaboration_score = Column(Float)  # Collaboration and communication score
    innovation_score = Column(Float)  # Innovation and creativity score
    reliability_score = Column(Float)  # Reliability and timeliness score
    
    # AI-enhanced evaluation data
    ai_analysis = Column(JSON)  # Stores AI model outputs and insights
    algorithm_metrics = Column(JSON)  # Stores custom algorithm results
    
    # Qualitative feedback
    strengths = Column(Text)
    areas_for_improvement = Column(Text)
    additional_comments = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String, default="pending")  # pending, completed
    
    # Relationships
    task = relationship("Task", back_populates="peer_evaluations")
    evaluator = relationship("User", foreign_keys=[evaluator_id], back_populates="evaluations_given")
    evaluatee = relationship("User", foreign_keys=[evaluatee_id], back_populates="evaluations_received")
    assignment = relationship("TaskAssignment", back_populates="peer_evaluations") 