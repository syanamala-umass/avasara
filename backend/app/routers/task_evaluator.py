from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.dependencies import get_current_user
from app.repositories.task_evaluator_repository import TaskEvaluatorRepository
from pydantic import BaseModel

router = APIRouter(
    prefix="/task-evaluators",
    tags=["task evaluators"],
    responses={404: {"description": "Not found"}}
)

class EvaluatorAssignment(BaseModel):
    evaluator_ids: List[int]

@router.post("/{task_id}/assign")
async def assign_evaluators(
    task_id: int,
    assignment: EvaluatorAssignment,
    current_user = Depends(get_current_user)
):
    """Assign evaluators to a task"""
    # Check if the current user has permission to assign evaluators
    # This could be based on role (e.g., admin, task owner)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to assign evaluators"
        )
    
    return TaskEvaluatorRepository.assign_evaluators(
        task_id=task_id,
        evaluator_ids=assignment.evaluator_ids
    )

@router.get("/tasks/{task_id}")
async def get_task_evaluators(
    task_id: int,
    current_user = Depends(get_current_user)
):
    """Get all evaluators for a task"""
    return TaskEvaluatorRepository.get_task_evaluators(task_id)

@router.get("/evaluator/{evaluator_id}")
async def get_evaluator_tasks(
    evaluator_id: int,
    current_user = Depends(get_current_user)
):
    """Get all tasks assigned to an evaluator"""
    # Check if the current user is requesting their own tasks
    if evaluator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other evaluators' tasks"
        )
    
    return TaskEvaluatorRepository.get_evaluator_tasks(evaluator_id)

@router.put("/{task_id}/evaluator/{evaluator_id}/status")
async def update_evaluator_status(
    task_id: int,
    evaluator_id: int,
    status: str,
    current_user = Depends(get_current_user)
):
    """Update the status of an evaluator for a task"""
    # Check if the current user is the evaluator or an admin
    if evaluator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update evaluator status"
        )
    
    result = TaskEvaluatorRepository.update_evaluator_status(
        task_id=task_id,
        evaluator_id=evaluator_id,
        status=status
    )
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Evaluator assignment not found"
        )
    
    return result

@router.delete("/{task_id}/evaluator/{evaluator_id}")
async def remove_evaluator(
    task_id: int,
    evaluator_id: int,
    current_user = Depends(get_current_user)
):
    """Remove an evaluator from a task"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to remove evaluators"
        )
    
    success = TaskEvaluatorRepository.remove_evaluator(
        task_id=task_id,
        evaluator_id=evaluator_id
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Evaluator assignment not found"
        )
    
    return {"message": "Evaluator removed successfully"} 