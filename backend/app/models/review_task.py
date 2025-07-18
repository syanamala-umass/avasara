from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, JSON, Boolean, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ReviewTask(Base):
    __tablename__ = "review_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="open")  # open, in_progress, completed, cancelled
    
    # Links to original task and assignment
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    assignment_being_reviewed_id = Column(Integer, ForeignKey("task_assignments.id"), nullable=False)
    
    # Skill requirements for reviewers
    skill_requirements = Column(JSON, default={})
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    parent_task = relationship("Task", foreign_keys=[parent_task_id])
    assignment_being_reviewed = relationship("TaskAssignment", foreign_keys=[assignment_being_reviewed_id])
    assignments = relationship("ReviewTaskAssignment", back_populates="review_task")

class ReviewTaskAssignment(Base):
    __tablename__ = "review_task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    review_task_id = Column(Integer, ForeignKey("review_tasks.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="assigned")  # assigned, in_progress, completed, cancelled
    
    # Review decision
    accept_reject = Column(Boolean, nullable=True)  # TRUE = accept, FALSE = reject, NULL = not decided
    
    # Review details
    technical_score = Column(Numeric(3, 2), nullable=True)
    collaboration_score = Column(Numeric(3, 2), nullable=True)
    innovation_score = Column(Numeric(3, 2), nullable=True)
    reliability_score = Column(Numeric(3, 2), nullable=True)
    
    # Feedback
    strengths = Column(Text, nullable=True)
    areas_for_improvement = Column(Text, nullable=True)
    additional_comments = Column(Text, nullable=True)
    
    # Metadata
    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    review_task = relationship("ReviewTask", back_populates="assignments")
    reviewer = relationship("User", foreign_keys=[reviewer_id]) 