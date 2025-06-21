from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.skill import Skill

class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    category: str = "task"  # Add category field with default value "task"

class TaskCreate(TaskBase):
    skills: List[int] = []  # List of skill IDs
    resources: List[int] = []  # List of resource IDs
    compensation_type: str  # "cash" or "equity"
    compensation_amount: float
    review_compensation_type: str  # "cash" or "equity"
    review_compensation_amount: float
    num_reviewers: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    skills: Optional[List[int]] = None
    resources: Optional[List[int]] = None

class Task(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    status: str
    
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
    
    class Config:
        orm_mode = True
