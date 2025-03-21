from pydantic import BaseModel

class SkillBase(BaseModel):
    name: str

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int
    
    class Config:
        orm_mode = True
