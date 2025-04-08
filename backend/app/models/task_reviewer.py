# models/task_reviewer.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class TaskReviewer(Base):
    __tablename__ = "task_reviewers"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")  # pending, reviewed
    rating = Column(Integer, nullable=True)
    comment = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="reviewers")
    user = relationship("User", back_populates="task_reviews")