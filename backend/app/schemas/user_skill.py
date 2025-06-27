from typing import List, Optional
from pydantic import BaseModel

class UserSkillsUpdate(BaseModel):
    skill_ids: List[int]
    ratings: Optional[List[int]] = None 