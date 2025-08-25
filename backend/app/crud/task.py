from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

def create_task(db: Session, task: TaskCreate, user_id: int):
    # Convert task schema to dict and add user_id
    task_data = task.dict()
    
    # Extract compensation data
    compensation_type = task_data.pop("compensation_type")
    compensation_amount = task_data.pop("compensation_amount")
    review_compensation_type = task_data.pop("review_compensation_type")
    review_compensation_amount = task_data.pop("review_compensation_amount")
    
    # Extract skills IDs
    skills = task_data.pop("skills", [])
    
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
    
    # Add skills relationships
    if skills:
        from app.crud.skill import get_skills_by_ids
        db_skills = get_skills_by_ids(db, skills)
        db_task.skills = db_skills
    
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

def update_task(db: Session, task_id: int, task: TaskUpdate, user_id: int, finish_editing: bool = False):
    """
    Update task with optional finish_editing parameter to control status transition.
    
    Args:
        db: Database session
        task_id: ID of task to update
        task: Task update data
        user_id: ID of user making the update
        finish_editing: If True, change status from 'editing' to 'open'
    """
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not db_task:
        return None
        
    try:
        update_data = task.dict(exclude_unset=True)
        
        # Handle compensation data separately (similar to create_task)
        compensation_type = update_data.pop("compensation_type", None)
        compensation_amount = update_data.pop("compensation_amount", None)
        review_compensation_type = update_data.pop("review_compensation_type", None)
        review_compensation_amount = update_data.pop("review_compensation_amount", None)
        
        # Handle skills and skill review requirements separately
        skills = update_data.pop("skills", None)
        
        # Handle status management
        if finish_editing:
            # Finish editing: change status from 'editing' to 'open'
            if db_task.status == "editing":
                db_task.status = "open"
            else:
                raise ValueError("Cannot finish editing: task is not in 'editing' status")
        else:
            # Regular update: set status to "editing" if task is currently "open"
            if db_task.status == "open" or db_task.status == "draft":
                db_task.status = "editing"
        
        # Extract and handle specific fields separately (same approach as create_task)
        title = update_data.pop("title", None)
        description = update_data.pop("description", None)
        deadline = update_data.pop("deadline", None)
        category = update_data.pop("category", None)
        task_duration = update_data.pop("task_duration", None)
        num_reviewers = update_data.pop("num_reviewers", None)
        max_parallel_contributors = update_data.pop("max_parallel_contributors", None)
        

        
        # Update task attributes directly (same pattern as create_task)
        if title is not None:
            db_task.title = title
        if description is not None:
            db_task.description = description
        if deadline is not None:
            db_task.deadline = deadline
        if category is not None:
            db_task.category = category
        if task_duration is not None:
            db_task.task_duration = task_duration
        if num_reviewers is not None:
            db_task.num_reviewers = num_reviewers
        if max_parallel_contributors is not None:
            db_task.max_parallel_contributors = max_parallel_contributors
        
        # Update compensation if provided (same simple approach as create_task)
        if any([compensation_type, compensation_amount, review_compensation_type, review_compensation_amount]):
            # Build compensation JSON exactly like create_task
            compensation_json = {
                "task": {
                    "compensation_type": compensation_type or "cash",
                    "amount": compensation_amount or 0
                },
                "review": {
                    "compensation_type": review_compensation_type or "cash",
                    "amount": review_compensation_amount or 0
                }
            }
            db_task.compensation = compensation_json
        
        # Update skills if provided (same logic as create_task)
        if skills is not None:
            from app.crud.skill import get_skills_by_ids
            db_skills = get_skills_by_ids(db, skills)
            db_task.skills = db_skills
            
        db.commit()
        db.refresh(db_task)
        
        # Return task details similar to create task endpoint
        from app.models.task_assignment import TaskAssignment
        from app.models.review_task import ReviewTask
        
        # Get skills for the response
        skills = []
        if db_task.skills:
            skills = [{"id": skill.id, "name": skill.name} for skill in db_task.skills]
        
        # Get counts
        assignments_count = db.query(TaskAssignment).filter(TaskAssignment.task_id == db_task.id).count()
        reviews_count = db.query(ReviewTask).filter(ReviewTask.parent_task_id == db_task.id).count()
        num_people_working = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == db_task.id,
            TaskAssignment.status.in_(['in_progress', 'submitted'])
        ).count()
        
        # Build detailed response
        task_response = {
            # Basic task fields
            "id": db_task.id,
            "user_id": db_task.user_id,
            "title": db_task.title,
            "description": db_task.description,
            "compensation": db_task.compensation,
            "deadline": db_task.deadline,
            "created_at": db_task.created_at,
            "status": db_task.status,
            "skill_review_requirements": db_task.skill_review_requirements,
            "category": db_task.category,
            "type": "task",
            "task_duration": db_task.task_duration,
            "num_reviewers": db_task.num_reviewers,
            "max_parallel_contributors": db_task.max_parallel_contributors,
            
            # Additional fields required by TaskWithDetails
            "skills": skills,
            "creator_name": db_task.user.username if db_task.user else "Unknown User",
            "creator_avatar": None,
            "assignments_count": assignments_count,
            "reviews_count": reviews_count,
            "num_people_working": num_people_working,
            "has_assignment": False,
            "matching_skills_count": 0
        }
        
        return task_response
    except Exception as e:
        db.rollback()
        raise e



def delete_task(db: Session, task_id: int, user_id: int):
    db_task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False
