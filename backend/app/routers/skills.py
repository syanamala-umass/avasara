from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.skill import SkillCreate, Skill
from app.crud.skill import create_skill, get_skill, get_skills

router = APIRouter(
    prefix="/skills",
    tags=["skills"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Skill, status_code=status.HTTP_201_CREATED)
def create_new_skill(skill: SkillCreate, db: Session = Depends(get_db)):
    return create_skill(db=db, skill=skill)

@router.get("/", response_model=List[Skill])
def read_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skills = get_skills(db, skip=skip, limit=limit)
    return skills

@router.get("/{skill_id}", response_model=Skill)
def read_skill(skill_id: int, db: Session = Depends(get_db)):
    db_skill = get_skill(db, skill_id=skill_id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return db_skill
