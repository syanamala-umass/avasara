from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.task_assignment import TaskAssignment
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignmentUpdate
from datetime import datetime

def create_task_assignment(db: Session, task_assignment: TaskAssignmentCreate, contributor_id: int):
    db_assignment = TaskAssignment(
        task_id=task_assignment.task_id,
        contributor_id=contributor_id,
        notes=task_assignment.notes,
        status="in_progress"
    )
    
    # Update task status
    from app.models.task import Task
    task = db.query(Task).filter(Task.id == task_assignment.task_id).first()
    if task and task.status == "open":
        task.status = "in_progress"
    
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_task_assignment(db: Session, assignment_id: int):
    return db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()

def get_task_assignments(db: Session, skip: int = 0, limit: int = 100, 
                    contributor_id: Optional[int] = None, 
                    task_id: Optional[int] = None,
                    status: Optional[str] = None):
    query = db.query(TaskAssignment)
    
    if contributor_id:
        query = query.filter(TaskAssignment.contributor_id == contributor_id)
    
    if task_id:
        query = query.filter(TaskAssignment.task_id == task_id)
        
    if status:
        query = query.filter(TaskAssignment.status == status)
        
    return query.offset(skip).limit(limit).all()

def update_task_assignment(db: Session, assignment_id: int, task_assignment: TaskAssignmentUpdate):
    db_assignment = db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()
    if db_assignment:
        update_data = task_assignment.dict(exclude_unset=True)
        
        # If status is being updated to "completed", set the completed_at timestamp
        if "status" in update_data and update_data["status"] == "completed" and not db_assignment.completed_at:
            update_data["completed_at"] = datetime.utcnow()
            
            # Also update the task status if this is the first completion
            from app.models.task import Task
            task = db.query(Task).filter(Task.id == db_assignment.task_id).first()
            if task and task.status == "in_progress":
                task.status = "completed"
        
        for key, value in update_data.items():
            setattr(db_assignment, key, value)
        
        db.commit()
        db.refresh(db_assignment)
    return db_assignment