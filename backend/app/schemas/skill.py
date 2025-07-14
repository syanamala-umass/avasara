from pydantic import BaseModel
from typing import Optional

class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int

    class Config:
        from_attributes = True

class SkillWithRating(SkillBase):
    id: int
    rating: float

    class Config:
        from_attributes = True

class SkillWithTaskCount(SkillBase):
    id: int
    task_count: int
    description: Optional[str] = None
    category: Optional[str] = None

    class Config:
        from_attributes = True
