from sqlalchemy import Column, Integer, String, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    startup_id = Column(Integer, ForeignKey("startups.id"))
    contributor_id = Column(Integer, ForeignKey("contributors.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    rating = Column(Float)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    startup = relationship("Startup", back_populates="reviews_given")
    contributor = relationship("Contributor", back_populates="reviews_received")
