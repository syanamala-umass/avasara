from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Startup(Base):
    __tablename__ = "startups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(Text)
    logo = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="startup")
    tasks = relationship("Task", back_populates="startup")
    # reviews_given = relationship("Review", back_populates="startup")
