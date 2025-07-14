from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from app.database import get_db
from app import models
from app.schemas.skill import Skill, SkillCreate, SkillWithTaskCount

router = APIRouter(
    prefix="/skills",
    tags=["skills"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Skill])
def read_skills(db: Session = Depends(get_db)):
    """Get all skills"""
    skills = db.query(models.Skill).all()
    return skills

@router.get("/top-by-tasks", response_model=List[SkillWithTaskCount])
def get_top_skills_by_tasks(db: Session = Depends(get_db), limit: int = 5):
    """Get top skills by number of tasks"""
    # Query skills with task counts, ordered by task count descending
    # Only include skills that actually have tasks associated with them
    skills_with_counts = db.query(
        models.Skill,
        func.count(models.Task.id).label('task_count')
    ).join(
        models.Task.skills
    ).group_by(
        models.Skill.id
    ).having(
        func.count(models.Task.id) > 0
    ).order_by(
        desc(func.count(models.Task.id))
    ).limit(limit).all()
    
    # Convert to response format
    result = []
    for skill, task_count in skills_with_counts:
        if skill is not None and task_count > 0:
            result.append({
                "id": skill.id,
                "name": skill.name,
                "task_count": task_count
            })
    
    return result

@router.post("/", response_model=Skill)
def create_skill(skill: SkillCreate, db: Session = Depends(get_db)):
    """Create a new skill"""
    # Only pass fields that exist in the Skill model
    skill_data = skill.dict()
    # Remove fields that don't exist in the model
    skill_data.pop('description', None)
    skill_data.pop('category', None)
    
    db_skill = models.Skill(**skill_data)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill
