from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import random
from app.database.connection import get_db_cursor
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignment, TaskAssignmentUpdate, TaskAssignmentWithDetails
from app.dependencies import get_current_user
from app.repositories.task_assignment_repository import TaskAssignmentRepository
from app.repositories.peer_evaluation_repository import PeerEvaluationRepository
from app.crud import task_assignment as crud

router = APIRouter(
    prefix="/task-assignments",
    tags=["task assignments"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=TaskAssignment, status_code=status.HTTP_201_CREATED)
def create_new_assignment(
    assignment: TaskAssignmentCreate, 
    current_user = Depends(get_current_user)
):
    """
    Create a new task assignment.
    
    Args:
        assignment (TaskAssignmentCreate): The assignment data
        current_user: The authenticated user
        
    Returns:
        TaskAssignment: The created assignment
        
    Raises:
        HTTPException: If user already has an assignment for this task
    """
    # Check if user already has an assignment for this task
    if crud.check_existing_assignment(
        task_id=assignment.task_id,
        user_id=current_user.id,
        assignment_type=assignment.assignment_type
    ):
        raise HTTPException(
            status_code=400,
            detail="User already has an assignment for this task"
        )
    
    return crud.create_task_assignment(assignment, current_user.id)

@router.get("/", response_model=List[TaskAssignmentWithDetails])
def read_assignments(
    skip: int = 0, 
    limit: int = 100, 
    task_id: int = None,
    status: str = None,
    assignment_type: str = None,
    current_user = Depends(get_current_user)
):
    """
    Get multiple task assignments with filtering.
    
    Args:
        skip (int): Number of records to skip
        limit (int): Maximum number of records to return
        task_id (int): Filter by task ID
        status (str): Filter by status
        assignment_type (str): Filter by assignment type
        current_user: The authenticated user
        
    Returns:
        List[TaskAssignment]: List of assignments
    """
    return crud.get_task_assignments(
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        task_id=task_id,
        status=status,
        assignment_type=assignment_type
    )

@router.get("/{assignment_id}", response_model=TaskAssignmentWithDetails)
def read_assignment(
    assignment_id: int,
    current_user = Depends(get_current_user)
):
    """
    Get a specific task assignment.
    
    Args:
        assignment_id (int): The assignment ID
        current_user: The authenticated user
        
    Returns:
        TaskAssignment: The assignment
        
    Raises:
        HTTPException: If assignment not found or doesn't belong to user
    """
    assignment = crud.get_task_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    return assignment

@router.put("/{assignment_id}", response_model=TaskAssignment)
async def update_assignment_status(
    assignment_id: int, 
    assignment: TaskAssignmentUpdate, 
    current_user = Depends(get_current_user)
):
    """
    Update a task assignment.
    
    Args:
        assignment_id (int): The assignment ID
        assignment (TaskAssignmentUpdate): The updated assignment data
        current_user: The authenticated user
        
    Returns:
        TaskAssignment: The updated assignment
        
    Raises:
        HTTPException: If assignment not found or doesn't belong to user
    """
    db_assignment = crud.get_task_assignment(assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if db_assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this assignment")
    
    # Only allow updating from in_progress to completed
    if db_assignment["status"] != "in_progress" and assignment.status == "completed":
        raise HTTPException(status_code=400, detail="Can only mark in-progress assignments as completed")
    
    # Update the assignment
    updated_assignment = crud.update_task_assignment(assignment_id, assignment)
    
    # If the assignment is being marked as completed, trigger peer evaluation process
    if assignment.status == "completed":
        # Get task details
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT num_reviewers FROM tasks WHERE id = %s",
                (db_assignment["task_id"],)
            )
            task = cursor.fetchone()
        
        # Get other contributors who have completed the same task
        other_contributors = TaskAssignmentRepository.get_completed_task_contributors(
            task_id=db_assignment["task_id"],
            exclude_assignment_id=assignment_id
        )
        
        # Randomly select evaluators from the pool of other contributors
        num_evaluators = min(len(other_contributors), task["num_reviewers"] or 2)
        if other_contributors and num_evaluators > 0:
            selected_evaluators = random.sample(other_contributors, num_evaluators)
            
            # Create peer evaluation assignments
            for evaluator in selected_evaluators:
                evaluation = PeerEvaluationCreate(
                    task_id=db_assignment["task_id"],
                    evaluatee_id=current_user.id,
                    assignment_id=assignment_id,
                    technical_score=0,
                    collaboration_score=0,
                    innovation_score=0,
                    reliability_score=0,
                    strengths="",
                    areas_for_improvement=""
                )
                PeerEvaluationRepository.create_evaluation(
                    evaluation=evaluation,
                    evaluator_id=evaluator["user_id"]
                )
    
    return updated_assignment
