from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from .skill import Skill

class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    category: str = "Other"  # Add category field with default value "task"
    skill_review_requirements: Optional[Dict[str, float]] = None  # {"skill_name": min_skill_level_required}
    compensation_type: str = "cash"
    compensation_amount: float = 0
    review_compensation_type: str = "cash"
    review_compensation_amount: float = 0
    skills: List[int] = []
    num_reviewers: int = 2
    # Duration field
    task_duration: Optional[int] = None  # Duration in hours before penalty applies

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    skills: Optional[List[int]] = None
    skill_review_requirements: Optional[Dict[str, float]] = None
    task_duration: Optional[int] = None

class Task(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    status: str
    num_reviewers: Optional[int] = None
    max_parallel_contributors: Optional[int] = None

    class Config:
        orm_mode = True

class TaskWithDetails(Task):
    skills: List[Skill] = []
    creator_name: str
    creator_avatar: Optional[str] = None
    assignments_count: int = 0
    reviews_count: int = 0
    num_people_working: int = 0
    compensation_type: Optional[str] = None  # "cash" or "equity"
    compensation_amount: Optional[float] = None
    review_compensation_type: Optional[str] = None  # "cash" or "equity"
    review_compensation_amount: Optional[float] = None
    has_assignment: bool = False  # Whether the current user has an assignment for this task
    type: str = "task"  # "task" or "review"
    
    class Config:
        orm_mode = True
