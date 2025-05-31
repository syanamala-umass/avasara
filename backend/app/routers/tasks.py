from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.startup import Startup

# from app.models.application import Application

from app.database import get_db
from app.schemas.task import TaskCreate, Task, TaskUpdate, TaskWithDetails
from app.crud.task import create_task, get_task, get_tasks, update_task
from app.dependencies import get_current_user
import random
from app import models


router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)

@router.get("/reviewable", response_model=List[TaskWithDetails])
def get_reviewable_tasks(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    print("please ikkadiki anna ra")
    from app.models.task import Task
    # Fetch all completed tasks
    tasks = db.query(Task).filter(Task.status == 'completed').all()
    print(tasks)
    # Get current user's skills
    print(current_user.skills)
    user_skills = set(current_user.skills or [])  # Assuming skills is a list or comma-separated string

    if isinstance(user_skills, str):
        user_skills = set(skill.strip() for skill in user_skills.split(","))

    # Filter tasks based on skill overlap
    matched_tasks = []
    for task in tasks:
        task_skills = set(task.skills or [])

        if isinstance(task_skills, str):
            task_skills = set(skill.strip() for skill in task_skills.split(","))

        if user_skills & task_skills:  # at least one common skill
            matched_tasks.append(task)

    # Return matching tasks
    return [
        {
            "id": task.id,
            "startup_id": task.startup_id,
            "title": task.title,
            "description": task.description,
            "compensation_type": task.compensation_type,
            "compensation_amount": task.compensation_amount,
            "deadline": task.deadline,
            "created_at": task.created_at,
            "status": task.status,
            "skills": task.skills,
            "startup_name": task.startup.name if task.startup else "",
            "startup_logo": task.startup.logo if task.startup else None,
        }
        for task in matched_tasks
    ]



@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_new_task(
    task: TaskCreate,
    startup_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    startup = db.query(models.Startup).filter(
        models.Startup.id == startup_id,
        models.Startup.user_id == current_user.id
    ).first()

    if not startup:
        raise HTTPException(status_code=403, detail="Startup not found or not owned by user.")

    return create_task(db=db, task=task, startup_id=startup.id)


@router.get("/", response_model=List[TaskWithDetails])
def read_tasks(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    # Import the SQLAlchemy models, not the Pydantic schemas
    from app.models.task import Task
    from app.models.startup import Startup
    # from app.models.application import Application
    
    # Get basic tasks
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    tasks = query.offset(skip).limit(limit).all()
    
    # Enhance with required additional fields
    result = []
    for task in tasks:
        # Get startup details
        startup = db.query(Startup).filter(Startup.id == task.startup_id).first()
        
        # Create a dictionary for this task with all required fields
        task_dict = {
            # Basic task fields
            "id": task.id,
            "startup_id": task.startup_id,
            "title": task.title,
            "description": task.description,
            "compensation_type": task.compensation_type,
            "compensation_amount": task.compensation_amount,
            "deadline": task.deadline,
            "created_at": task.created_at,
            "status": task.status,
            
            # Additional fields required by TaskWithDetails
            "skills": task.skills,
            "startup_name": startup.name if startup else "",
            "startup_logo": startup.logo if startup else None,
            "applications_count": db.query(Application).filter(Application.task_id == task.id).count()
        }
        result.append(task_dict)
    
    return result

@router.get("/{task_id}", response_model=TaskWithDetails)
def read_task(task_id: int, db: Session = Depends(get_db)):
    # Import the SQLAlchemy models
    # from app.models.application import Application
    
    # Get the base task
    db_task = get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get startup details
    startup = db.query(Startup).filter(Startup.id == db_task.startup_id).first()
    
    # Create a dictionary with all required fields
    task_dict = {
        # Basic task fields
        "id": db_task.id,
        "startup_id": db_task.startup_id,
        "title": db_task.title,
        "description": db_task.description,
        "compensation_type": db_task.compensation_type,
        "compensation_amount": db_task.compensation_amount,
        "deadline": db_task.deadline,
        "created_at": db_task.created_at,
        "status": db_task.status,
        
        # Additional fields required by TaskWithDetails
        "skills": db_task.skills,
        "startup_name": startup.name if startup else "",
        "startup_logo": startup.logo if startup else None
    }
    
    return task_dict


@router.put("/{task_id}", response_model=Task)
def update_task_details(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return update_task(db=db, task_id=task_id, task=task, startup_id=current_user.startup.id)




def assign_reviewers_randomly(db: Session, task_id: int, num_reviewers: int = 2):
    # 1. Fetch the completed task
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise Exception(f"Task with ID {task_id} not found.")

    # 2. Fetch eligible reviewers (everyone except the task completer)
    reviewers_query = db.query(models.User).filter(models.User.id != task.completed_by_id)
    reviewers = reviewers_query.all()

    if not reviewers:
        raise Exception("No eligible reviewers available.")

    # 3. Randomly pick reviewers
    selected_reviewers = random.sample(reviewers, min(num_reviewers, len(reviewers)))

    # 4. Create Review records
    for reviewer in selected_reviewers:
        review = models.Review(
            task_id=task.id,
            reviewer_id=reviewer.id,
            review_status='pending'
        )
        db.add(review)

    db.commit()

    # 5. Optionally return selected reviewer IDs
    return [reviewer.id for reviewer in selected_reviewers]


@router.post("/tasks/{task_id}/complete")
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Mark task as completed
    task.status = 'completed'
    db.commit()

    # 🔥 DO NOT assign reviewers here anymore

    return {"message": "Task marked as completed."}


