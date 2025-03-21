from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.contributor import contributor_skill
from app.models.task import task_skill

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    # Relationships
    contributors = relationship("Contributor", secondary=contributor_skill, back_populates="skills")
    tasks = relationship("Task", secondary=task_skill, back_populates="skills")
