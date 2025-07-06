from typing import List
from pydantic import BaseModel

class UserSkillsUpdate(BaseModel):
    skill_ids: List[int] 