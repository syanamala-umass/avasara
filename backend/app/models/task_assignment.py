from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))  # Changed
    assignment_type = Column(String, default="task")  # "task" or "review"
    status = Column(String, default="in_progress")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    task = relationship("Task", back_populates="assignments")
    user = relationship("User", back_populates="assignments")  # Changed
    reviews = relationship("Review", back_populates="assignment")
    peer_evaluations = relationship("PeerEvaluation", back_populates="assignment")
