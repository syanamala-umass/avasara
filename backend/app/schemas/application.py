from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskAssignmentBase(BaseModel):
    notes: Optional[str] = None

class TaskAssignmentCreate(TaskAssignmentBase):
    task_id: int

class TaskAssignmentUpdate(BaseModel):
    status: str
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

class TaskAssignment(TaskAssignmentBase):
    id: int
    task_id: int
    contributor_id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class TaskAssignmentWithDetails(TaskAssignment):
    task_title: str
    contributor_name: str
    contributor_avatar: Optional[str] = None
    review_count: int = 0
