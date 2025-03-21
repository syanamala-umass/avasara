from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationBase(BaseModel):
    message: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    task_id: int

class ApplicationUpdate(BaseModel):
    status: str

class Application(ApplicationBase):
    id: int
    task_id: int
    contributor_id: int
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class ApplicationWithDetails(Application):
    task_title: str
    contributor_name: str
    contributor_avatar: Optional[str] = None
