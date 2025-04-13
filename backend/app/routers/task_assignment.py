from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignment, TaskAssignmentUpdate, TaskAssignmentWithDetails
from app.crud.task_assignment import create_task_assignment, get_task_assignment, get_task_assignments, update_task_assignment
from app.dependencies import get_current_contributor, get_current_user

router = APIRouter(
    prefix="/task-assignments",
    tags=["task assignments"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=TaskAssignment, status_code=status.HTTP_201_CREATED)
def create_new_assignment(
    assignment: TaskAssignmentCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_contributor)
):
    # Check if the task is open
    from app.crud.task import get_task
    task = get_task(db, task_id=assignment.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != "open":
        raise HTTPException(status_code=400, detail="This task is not open for assignment")
    
    # Check if the contributor already has an assignment for this task
    existing = get_task_assignments(
        db, 
        contributor_id=current_user.contributor.id, 
        task_id=assignment.task_id
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already picked up this task")
    
    return create_task_assignment(
        db=db, 
        task_assignment=assignment, 
        contributor_id=current_user.contributor.id
    )

@router.get("/", response_model=List[TaskAssignmentWithDetails])
def read_assignments(
    skip: int = 0, 
    limit: int = 100, 
    status: str = None,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Different logic based on user type
    if current_user.is_startup:
        # Get assignments for tasks created by this startup
        from app.crud.task import get_tasks_by_startup
        tasks = get_tasks_by_startup(db, startup_id=current_user.startup.id)
        task_ids = [task.id for task in tasks]
        
        assignments = []
        for task_id in task_ids:
            task_assignments = get_task_assignments(
                db, 
                skip=skip, 
                limit=limit, 
                task_id=task_id,
                status=status
            )
            assignments.extend(task_assignments)
        
        return assignments
    else:
        # Get assignments for this contributor
        return get_task_assignments(
            db, 
            skip=skip, 
            limit=limit, 
            contributor_id=current_user.contributor.id,
            status=status
        )

@router.get("/{assignment_id}", response_model=TaskAssignmentWithDetails)
def read_assignment(assignment_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_assignment = get_task_assignment(db, assignment_id=assignment_id)
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Security checks
    if current_user.is_startup:
        # Check if the task belongs to this startup
        from app.crud.task import get_task
        task = get_task(db, task_id=db_assignment.task_id)
        if task.startup_id != current_user.startup.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    else:
        # Check if the assignment belongs to this contributor
        if db_assignment.contributor_id != current_user.contributor.id:
            # Allow other contributors to see completed tasks for review purposes
            if db_assignment.status != "completed":
                raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    
    return db_assignment

@router.put("/{assignment_id}", response_model=TaskAssignment)
def update_assignment_status(
    assignment_id: int, 
    assignment: TaskAssignmentUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_contributor)
):
    db_assignment = get_task_assignment(db, assignment_id=assignment_id)
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Only the assigned contributor can update
    if db_assignment.contributor_id != current_user.contributor.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this assignment")
    
    # Only allow updating from in_progress to completed
    if db_assignment.status != "in_progress" and assignment.status == "completed":
        raise HTTPException(status_code=400, detail="Can only mark in-progress assignments as completed")
    
    return update_task_assignment(db=db, assignment_id=assignment_id, task_assignment=assignment)
