from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.startup import Startup
# from app.models.application import Application

from app.database import get_db
from app.schemas.task import TaskCreate, Task, TaskUpdate, TaskWithDetails
from app.crud.task import create_task, get_task, get_tasks, update_task
from app.dependencies import get_current_startup, get_current_user

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_new_task(task: TaskCreate, db: Session = Depends(get_db), current_user = Depends(get_current_startup)):
    return create_task(db=db, task=task, startup_id=current_user.startup.id)

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
    from app.models.startup import Startup
    from app.models.application import Application
    
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
        "startup_logo": startup.logo if startup else None,
        "applications_count": db.query(Application).filter(Application.task_id == db_task.id).count()
    }
    
    return task_dict

@router.put("/{task_id}", response_model=Task)
def update_task_details(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_startup)):
    return update_task(db=db, task_id=task_id, task=task, startup_id=current_user.startup.id)
