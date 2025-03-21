from sqlalchemy import Column, Integer, String, ForeignKey, Text, Table, Float
from sqlalchemy.orm import relationship
from app.database import Base

# Association table for contributor skills
contributor_skill = Table(
    "contributor_skills",
    Base.metadata,
    Column("contributor_id", Integer, ForeignKey("contributors.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True)
)

class Contributor(Base):
    __tablename__ = "contributors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    bio = Column(Text, nullable=True)
    avatar = Column(String, nullable=True)
    average_rating = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="contributor")
    skills = relationship("Skill", secondary=contributor_skill, back_populates="contributors")
    applications = relationship("Application", back_populates="contributor")
    reviews_received = relationship("Review", back_populates="contributor")
