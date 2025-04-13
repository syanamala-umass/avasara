from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    contributor_id = Column(Integer, ForeignKey("contributors.id"))
    status = Column(String, default="in_progress")  # in_progress, completed, reviewed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    task = relationship("Task", back_populates="assignments")
    contributor = relationship("Contributor", back_populates="assignments")
    reviews = relationship("Review", back_populates="assignment")
