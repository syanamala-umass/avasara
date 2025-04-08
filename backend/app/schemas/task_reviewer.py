# schemas/task_reviewer.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskReviewerBase(BaseModel):
    task_id: int


class TaskReviewerCreate(TaskReviewerBase):
    pass


class TaskReviewerUpdate(BaseModel):
    rating: int
    comment: Optional[str] = None


class TaskReviewer(BaseModel):
    id: int
    task_id: int
    user_id: int
    status: str
    rating: Optional[int] = None
    comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True


class TaskReviewerWithDetails(TaskReviewer):
    task_title: str
    user_name: str