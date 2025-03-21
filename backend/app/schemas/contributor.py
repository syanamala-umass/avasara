from pydantic import BaseModel
from typing import Optional, List
from app.schemas.skill import Skill

class ContributorBase(BaseModel):
    name: str
    bio: Optional[str] = None

class ContributorCreate(ContributorBase):
    skills: List[int] = []  # List of skill IDs

class ContributorUpdate(ContributorBase):
    skills: Optional[List[int]] = None

class Contributor(ContributorBase):
    id: int
    user_id: int
    avatar: Optional[str] = None
    average_rating: float
    
    class Config:
        orm_mode = True

class ContributorWithSkills(Contributor):
    skills: List[Skill] = []
