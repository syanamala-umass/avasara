from pydantic import BaseModel
from typing import Optional, List
from app.schemas.task import Task

class StartupBase(BaseModel):
    name: str
    description: str
    website: Optional[str] = None

class StartupCreate(StartupBase):
    pass

class StartupUpdate(StartupBase):
    pass

class Startup(StartupBase):
    id: int
    user_id: int
    logo: Optional[str] = None
    
    class Config:
        orm_mode = True

class StartupWithTasks(Startup):
    tasks: List[Task] = []
