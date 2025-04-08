from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.skill import Skill

class TaskBase(BaseModel):
    title: str
    description: str
    compensation_type: str  # "cash" or "equity"
    compensation_amount: float
    deadline: datetime

class TaskCreate(TaskBase):
    skills: List[int] = []  # List of skill IDs
    resources: List[int] = []  # List of resource IDs

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    compensation_type: Optional[str] = None
    compensation_amount: Optional[float] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    skills: Optional[List[int]] = None
    resources: Optional[List[int]] = None

class Task(TaskBase):
    id: int
    startup_id: int
    created_at: datetime
    status: str
    
    class Config:
        orm_mode = True

class TaskWithDetails(Task):
    skills: List[Skill] = []
    startup_name: str
    startup_logo: Optional[str] = None
    assignments_count: int = 0
    reviews_count: int = 0
