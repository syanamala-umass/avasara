from sqlalchemy import Column, Integer, String, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    assignment_id = Column(Integer, ForeignKey("task_assignments.id"))
    user_id = Column(Integer, ForeignKey("users.id"))  # Person who did the task
    reviewer_id = Column(Integer, ForeignKey("users.id"))  # Person reviewing the task
    rating = Column(Float)
    comment = Column(Text, nullable=True)
    compensation_amount = Column(Float)  # Compensation for the reviewer
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="reviews")
    assignment = relationship("TaskAssignment", back_populates="reviews")
    user = relationship("User", foreign_keys=[user_id], back_populates="reviews_received")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
