from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

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
    tasks = get_tasks(db, skip=skip, limit=limit, status=status)
    return tasks

@router.get("/{task_id}", response_model=TaskWithDetails)
def read_task(task_id: int, db: Session = Depends(get_db)):
    db_task = get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.put("/{task_id}", response_model=Task)
def update_task_details(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_startup)):
    return update_task(db=db, task_id=task_id, task=task, startup_id=current_user.startup.id)
