from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

def create_task(db: Session, task: TaskCreate, startup_id: int):
    # Convert task schema to dict and add startup_id
    task_data = task.dict()
    
    # Extract skills and resources IDs
    skills = task_data.pop("skills", [])
    resources = task_data.pop("resources", [])
    
    # Create task instance
    db_task = Task(**task_data, startup_id=startup_id)
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
    return db.query(Task).filter(Task.id == task_id).first()

def get_tasks(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    return query.offset(skip).limit(limit).all()

def get_tasks_by_startup(db: Session, startup_id: int, skip: int = 0, limit: int = 100):
    return db.query(Task).filter(Task.startup_id == startup_id).offset(skip).limit(limit).all()

def update_task(db: Session, task_id: int, task: TaskUpdate, startup_id: int):
    db_task = db.query(Task).filter(Task.id == task_id, Task.startup_id == startup_id).first()
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

def delete_task(db: Session, task_id: int, startup_id: int):
    db_task = db.query(Task).filter(Task.id == task_id, Task.startup_id == startup_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False
