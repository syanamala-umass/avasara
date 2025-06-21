from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Enum, Table, Float
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import datetime
# Association table for task skills
task_skill = Table(
    "task_skills",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True)
)

# Association table for task resources
task_resource = Table(
    "task_resources",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
    Column("resource_id", Integer, ForeignKey("resources.id"), primary_key=True)
)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="open")  # open, in_progress, completed, reviewed
    num_reviewers = Column(Integer, nullable=True)  # Optional
    max_parallel_contributors = Column(Integer, nullable=True)
    contributor_time_limit_hours = Column(Integer, nullable=True)
    category = Column(String, default="task")  # Add category field with default value "task"

    # Relationships
    user = relationship("User", back_populates="tasks")
    skills = relationship("Skill", secondary=task_skill, back_populates="tasks")
    resources = relationship("Resource", secondary=task_resource, back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task")
    reviews = relationship("Review", back_populates="task")
    peer_evaluations = relationship("PeerEvaluation", back_populates="task")
    compensations = relationship("TaskCompensation", back_populates="task")
