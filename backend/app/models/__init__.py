from app.models.user import User
from app.models.startup import Startup
from app.models.task import Task, task_skill, task_resource
from app.models.task_assignment import TaskAssignment
from app.models.review import Review
from app.models.skill import Skill
from app.models.task_compensation import TaskCompensation
from app.models.review_task import ReviewTask, ReviewTaskAssignment
from app.models.task_block import TaskBlock
from app.models.task_reviewer import TaskReviewer

# Add Resource model
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    # Relationships
    tasks = relationship("Task", secondary=task_resource, back_populates="resources")
