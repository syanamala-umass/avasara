from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Enum, Table, Float, JSON
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
    category = Column(String, default="Other")  # Add category field with default value "task"
    skill_review_requirements = Column(JSON, nullable=True)  # {"skill_name": min_skill_level_required}
    compensation = Column(JSON, nullable=True)  # JSON field for task and review compensation

    # Relationships
    user = relationship("User", back_populates="tasks")
    skills = relationship("Skill", secondary=task_skill, back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task")
    reviews = relationship("Review", back_populates="task")
    # peer_evaluations = relationship("PeerEvaluation", back_populates="task")

    # When creating a task, set category from the primary skill's category if available
    def set_category_from_skills(self):
        if self.skills and len(self.skills) > 0:
            # Assume the first skill is the primary skill
            primary_skill = self.skills[0]
            if hasattr(primary_skill, 'category') and primary_skill.category:
                self.category = primary_skill.category
            else:
                self.category = 'Other'
        else:
            self.category = 'Other'
