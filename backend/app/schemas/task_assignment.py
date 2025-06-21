from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskAssignmentBase(BaseModel):
    notes: Optional[str] = None

class TaskAssignmentCreate(TaskAssignmentBase):
    task_id: int
    assignment_type: str = "task"  # Default to "task" for backward compatibility

class TaskAssignmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class TaskAssignment(TaskAssignmentBase):
    id: int
    task_id: int
    user_id: int
    assignment_type: str
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class TaskAssignmentWithDetails(TaskAssignment):
    task_title: str
    user_name: str
    user_avatar: Optional[str] = None
    review_count: int = 0
