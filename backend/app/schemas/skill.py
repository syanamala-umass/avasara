from pydantic import BaseModel
from typing import Optional

class SkillBase(BaseModel):
    name: str

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int
    
    class Config:
        orm_mode = True

class SkillWithRating(Skill):
    rating: Optional[int] = None
