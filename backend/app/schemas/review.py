from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    is_approved: bool
    feedback: Optional[str] = None

class ReviewCreate(ReviewBase):
    task_id: int
    assignment_id: int
    contributor_id: int  # Person who did the task

class ReviewUpdate(BaseModel):
    is_approved: Optional[bool] = None
    feedback: Optional[str] = None

class Review(ReviewBase):
    id: int
    task_id: int
    assignment_id: int
    contributor_id: int  # Person who did the task
    reviewer_id: int     # Person reviewing the task
    compensation_amount: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewWithDetails(Review):
    task_title: str
    contributor_name: str
    contributor_avatar: Optional[str] = None
    reviewer_name: str
    reviewer_avatar: Optional[str] = None
