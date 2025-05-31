from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.task_assignment import TaskAssignment
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignmentUpdate
from datetime import datetime
from app.repositories.task_assignment_repository import TaskAssignmentRepository

def create_task_assignment(
    assignment: TaskAssignmentCreate,
    user_id: int
) -> dict:
    """
    Create a new task assignment.
    
    Args:
        assignment (TaskAssignmentCreate): The assignment data
        user_id (int): The ID of the user being assigned
        
    Returns:
        dict: The created assignment
    """
    return TaskAssignmentRepository.create_assignment(assignment, user_id)

def get_task_assignment(db: Session, assignment_id: int):
    return db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()

def get_task_assignments(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    task_id: Optional[int] = None,
    status: Optional[str] = None,
    assignment_type: Optional[str] = None
) -> List[dict]:
    """
    Get multiple task assignments with filtering.
    
    Args:
        skip (int): Number of records to skip
        limit (int): Maximum number of records to return
        user_id (Optional[int]): Filter by user
        task_id (Optional[int]): Filter by task
        status (Optional[str]): Filter by status
        assignment_type (Optional[str]): Filter by assignment type
        
    Returns:
        List[dict]: List of assignments
    """
    return TaskAssignmentRepository.get_assignments(
        skip=skip,
        limit=limit,
        user_id=user_id,
        task_id=task_id,
        status=status,
        assignment_type=assignment_type
    )

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

def check_existing_assignment(
    task_id: int,
    user_id: int,
    assignment_type: str = "task"
) -> bool:
    """
    Check if a user already has an assignment for a task.
    
    Args:
        task_id (int): The task ID
        user_id (int): The user ID
        assignment_type (str): The type of assignment to check for
        
    Returns:
        bool: True if assignment exists
    """
    return TaskAssignmentRepository.check_existing_assignment(
        task_id=task_id,
        user_id=user_id,
        assignment_type=assignment_type
    )