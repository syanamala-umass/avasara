from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    rating: float
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    contributor_id: int
    task_id: Optional[int] = None

class Review(ReviewBase):
    id: int
    startup_id: int
    contributor_id: int
    task_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class ReviewWithDetails(Review):
    startup_name: str
    startup_logo: Optional[str] = None
    contributor_name: str
    contributor_avatar: Optional[str] = None
    task_title: Optional[str] = None
