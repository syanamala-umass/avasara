from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from typing import List
from app.database import get_db
from app import models
from app.schemas.skill import Skill, SkillCreate, SkillWithTaskCount

router = APIRouter(
    prefix="/skills",
    tags=["skills"],
    responses={404: {"description": "Not found"}},
)

def to_camel_case(s):
    s = s.strip()
    if not s:
        return s
    parts = s.split()
    return parts[0].lower() + ''.join(word.capitalize() for word in parts[1:])

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
    
    # If we don't have enough skills with tasks, fill with other skills
    if len(result) < limit:
        remaining_limit = limit - len(result)
        
        # Get skills that don't have any tasks associated
        skills_without_tasks = db.query(
            models.Skill
        ).outerjoin(
            models.Task.skills
        ).filter(
            models.Task.id.is_(None)
        ).limit(remaining_limit).all()
        
        # Add skills without tasks to the result
        for skill in skills_without_tasks:
            result.append({
                "id": skill.id,
                "name": skill.name,
                "task_count": 0
            })
    
    return result

@router.post("/", response_model=Skill)
def create_skill(skill: SkillCreate, db: Session = Depends(get_db)):
    """Create a new skill"""
    skill_data = skill.dict()
    # Remove fields that don't exist in the model
    skill_data.pop('description', None)
    # Ensure category is set
    if not skill_data.get('category'):
        skill_data['category'] = 'Other'
    # Enforce camel casing for skill name
    skill_data['name'] = to_camel_case(skill_data['name'])
    db_skill = models.Skill(**skill_data)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.get("/{skill_id}", response_model=Skill)
def get_skill_details(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    # if not skill:
    #     raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@router.get("/{skill_id}/top-task-contributors")
def get_top_task_contributors(skill_id: int, db: Session = Depends(get_db), limit: int = 5):
    # Get the skill name from the skill_id
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    # if not skill:
    #     raise HTTPException(status_code=404, detail="Skill not found")
    skill_name = skill.name
    # Users who completed the most tasks with this skill
    result = db.execute(text('''
        SELECT u.id, u.username, COUNT(ta.id) as task_count
        FROM users u
        JOIN task_assignments ta ON ta.user_id = u.id
        JOIN tasks t ON t.id = ta.task_id
        WHERE ta.status = 'completed' AND t.skill_review_requirements::jsonb ? :skill_name
        GROUP BY u.id, u.username
        ORDER BY task_count DESC
        LIMIT :limit
    '''), {'skill_name': skill_name, 'limit': limit})
    return [dict(row) for row in result.mappings().all()]

@router.get("/{skill_id}/top-rated-contributors")
def get_top_rated_contributors(skill_id: int, db: Session = Depends(get_db), limit: int = 5):
    # Users with highest average rating for this skill
    result = db.execute(text('''
        SELECT u.id, u.username, AVG(us.rating) as avg_rating
        FROM users u
        JOIN user_skills us ON us.user_id = u.id
        WHERE us.skill_id = :skill_id
        GROUP BY u.id, u.username
        ORDER BY avg_rating DESC
        LIMIT :limit
    '''), {'skill_id': skill_id, 'limit': limit})
    return [dict(row) for row in result.mappings().all()]

@router.get("/{skill_id}/top-job-posters")
def get_top_job_posters(skill_id: int, db: Session = Depends(get_db), limit: int = 5):
    # Get the skill name from the skill_id
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    # if not skill:
    #     raise HTTPException(status_code=404, detail="Skill not found")
    skill_name = skill.name
    # Users who posted the most jobs requiring this skill
    result = db.execute(text('''
        SELECT u.id, u.username, COUNT(t.id) as job_post_count
        FROM users u
        JOIN tasks t ON t.user_id = u.id
        WHERE t.skill_review_requirements::jsonb ? :skill_name
        GROUP BY u.id, u.username
        ORDER BY job_post_count DESC
        LIMIT :limit
    '''), {'skill_name': skill_name, 'limit': limit})
    return [dict(row) for row in result.mappings().all()]
