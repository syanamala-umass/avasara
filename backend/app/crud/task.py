from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.task import Task
from app.models.task_compensation import TaskCompensation
from app.schemas.task import TaskCreate, TaskUpdate

def create_task(db: Session, task: TaskCreate, user_id: int):
    # Convert task schema to dict and add user_id
    task_data = task.dict()
    
    # Extract compensation data
    compensation_type = task_data.pop("compensation_type")
    compensation_amount = task_data.pop("compensation_amount")
    review_compensation_type = task_data.pop("review_compensation_type")
    review_compensation_amount = task_data.pop("review_compensation_amount")
    
    # Extract skills and resources IDs
    skills = task_data.pop("skills", [])
    resources = task_data.pop("resources", [])
    
    # Build compensation JSON
    compensation_json = {
        "task": {
            "compensation_type": compensation_type,
            "amount": compensation_amount
        },
        "review": {
            "compensation_type": review_compensation_type,
            "amount": review_compensation_amount
        }
    }
    
    # Create task instance with compensation JSON
    db_task = Task(**task_data, user_id=user_id, compensation=compensation_json)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Add skills and resources relationships
    if skills:
        from app.crud.skill import get_skills_by_ids
        db_skills = get_skills_by_ids(db, skills)
        db_task.skills = db_skills
        
    if resources:
        from app.models import Resource
        db_resources = db.query(Resource).filter(Resource.id.in_(resources)).all()
        db_task.resources = db_resources
    
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: int):
    return db.query(Task).options(
        joinedload(Task.skills)
    ).filter(Task.id == task_id).first()

def get_tasks(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    return query.offset(skip).limit(limit).all()

def get_tasks_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Task).filter(Task.user_id == user_id).offset(skip).limit(limit).all()

def update_task(db: Session, task_id: int, task: TaskUpdate, user_id: int):
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if db_task:
        update_data = task.dict(exclude_unset=True)
        
        # Handle skills and resources separately
        skills = update_data.pop("skills", None)
        resources = update_data.pop("resources", None)
        
        # Update task attributes
        for key, value in update_data.items():
            setattr(db_task, key, value)
        
        # Update skills if provided
        if skills is not None:
            from app.crud.skill import get_skills_by_ids
            db_skills = get_skills_by_ids(db, skills)
            db_task.skills = db_skills
            
        # Update resources if provided
        if resources is not None:
            from app.models import Resource
            db_resources = db.query(Resource).filter(Resource.id.in_(resources)).all()
            db_task.resources = db_resources
        
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False
