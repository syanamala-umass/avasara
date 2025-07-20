from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.peer_evaluation import PeerEvaluationCreate, PeerEvaluation, PeerEvaluationUpdate
from app.crud.peer_evaluation import (
    create_peer_evaluation,
    get_peer_evaluation,
    get_peer_evaluations_by_task,
    get_peer_evaluations_by_evaluator,
    get_peer_evaluations_by_evaluatee,
    update_peer_evaluation,
    delete_peer_evaluation,
    calculate_aggregate_metrics
)

router = APIRouter(
    prefix="/peer-evaluations",
    tags=["peer evaluations"],
    responses={404: {"description": "Not found"}}
)

async def run_ai_analysis(evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run AI analysis on the evaluation data.
    This is where you would integrate your proprietary AI algorithm.
    """
    # TODO: Implement your proprietary AI analysis here
    # This is a placeholder that should be replaced with actual AI integration
    return {
        "sentiment_analysis": {
            "strengths": "positive",
            "areas_for_improvement": "constructive"
        },
        "skill_assessment": {
            "technical_proficiency": "high",
            "collaboration_effectiveness": "medium"
        },
        "recommendations": [
            "Continue focusing on technical skills",
            "Consider more pair programming opportunities"
        ]
    }

async def run_custom_algorithms(evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run custom algorithms on the evaluation data.
    This is where you would implement your proprietary scoring algorithms.
    """
    # TODO: Implement your custom algorithms here
    # This is a placeholder that should be replaced with actual algorithm implementation
    return {
        "skill_growth_trajectory": 0.85,
        "peer_comparison_percentile": 75,
        "collaboration_index": 0.92,
        "innovation_factor": 0.78
    }

@router.post("/", response_model=PeerEvaluation, status_code=status.HTTP_201_CREATED)
async def create_new_evaluation(
    evaluation: PeerEvaluationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Run AI analysis and custom algorithms
    ai_analysis = await run_ai_analysis(evaluation.dict())
    algorithm_metrics = await run_custom_algorithms(evaluation.dict())
    
    return create_peer_evaluation(
        db=db,
        evaluation=evaluation,
        evaluator_id=current_user.id,
        ai_analysis=ai_analysis,
        algorithm_metrics=algorithm_metrics
    )

@router.get("/{evaluation_id}", response_model=PeerEvaluation)
def read_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_evaluation = get_peer_evaluation(db, evaluation_id)
    if not db_evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    # Check if user has permission to view this evaluation
    if (db_evaluation.evaluator_id != current_user.id and 
        db_evaluation.evaluatee_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this evaluation")
    
    return db_evaluation

@router.get("/task/{task_id}", response_model=List[PeerEvaluation])
def read_task_evaluations(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_peer_evaluations_by_task(db, task_id)

@router.get("/evaluator/{evaluator_id}", response_model=List[PeerEvaluation])
def read_evaluator_evaluations(
    evaluator_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if evaluator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these evaluations")
    return get_peer_evaluations_by_evaluator(db, evaluator_id)

@router.get("/evaluatee/{evaluatee_id}", response_model=List[PeerEvaluation])
def read_evaluatee_evaluations(
    evaluatee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if evaluatee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these evaluations")
    return get_peer_evaluations_by_evaluatee(db, evaluatee_id)

@router.put("/{evaluation_id}", response_model=PeerEvaluation)
async def update_evaluation(
    evaluation_id: int,
    evaluation_update: PeerEvaluationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_evaluation = get_peer_evaluation(db, evaluation_id)
    if not db_evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    if db_evaluation.evaluator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this evaluation")
    
    # Run AI analysis and custom algorithms on the updated data
    ai_analysis = await run_ai_analysis(evaluation_update.dict(exclude_unset=True))
    algorithm_metrics = await run_custom_algorithms(evaluation_update.dict(exclude_unset=True))
    
    updated_evaluation = update_peer_evaluation(
        db=db,
        evaluation_id=evaluation_id,
        evaluation_update=evaluation_update,
        ai_analysis=ai_analysis,
        algorithm_metrics=algorithm_metrics
    )

    # Check if all evaluations for this task assignment are completed
    if evaluation_update.status == "completed":
        check_and_complete_task_assignment(db, updated_evaluation.assignment_id)

    return updated_evaluation

def check_and_complete_task_assignment(db: Session, assignment_id: int):
    """
    Check if all peer evaluations for a task assignment are completed.
    Determine if work is approved or rejected based on majority vote.
    If rejected, reset task to open and block original contributor for grace period.
    """
    try:
        from app.database.connection import get_db_cursor
        from app.routers.task_assignment import update_user_skill_ratings_from_task_completion

        from datetime import datetime, timedelta
        
        with get_db_cursor() as cursor:
            # Get the task assignment details
            cursor.execute("""
                SELECT ta.id, ta.task_id, ta.user_id, ta.status
                FROM task_assignments ta
                WHERE ta.id = %s
            """, (assignment_id,))
            
            assignment = cursor.fetchone()
            if not assignment or assignment['status'] != 'submitted':
                return
            
            # Get all evaluations for this assignment
            cursor.execute("""
                SELECT pe.id, pe.overall_score, pe.status, pe.evaluator_id
                FROM peer_evaluations pe
                WHERE pe.assignment_id = %s
            """, (assignment_id,))
            
            evaluations = cursor.fetchall()
            
            if not evaluations:
                return
            
            # Check if all evaluations are completed
            completed_evaluations = [e for e in evaluations if e['status'] == 'completed']
            if len(completed_evaluations) != len(evaluations):
                return  # Not all evaluations are done yet
            
            # Determine approval/rejection based on majority vote
            # Calculate average score and count approvals/rejections
            total_score = sum(e['overall_score'] for e in completed_evaluations)
            average_score = total_score / len(completed_evaluations)
            
            # Count approvals vs rejections (score >= 3.0 is approval, < 3.0 is rejection)
            approvals = sum(1 for e in completed_evaluations if e['overall_score'] >= 3.0)
            rejections = len(completed_evaluations) - approvals
            
            # Determine final status based on majority
            if approvals > rejections:
                # Majority approved - work is completed
                final_status = 'completed'
                
                # Update evaluation statuses to 'approved'
                for evaluation in completed_evaluations:
                    cursor.execute("""
                        UPDATE peer_evaluations
                        SET status = 'approved'
                        WHERE id = %s
                    """, (evaluation['id'],))
                
                # Update assignment status to completed
                cursor.execute("""
                    UPDATE task_assignments
                    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (assignment_id,))
                

                
                # Trigger positive rating updates
                update_user_skill_ratings_from_task_completion(
                    task_id=assignment['task_id'],
                    user_id=assignment['user_id'],
                    success=True,
                    average_score=average_score
                )
                
            else:
                # Majority rejected - work is rejected
                final_status = 'rejected'
                
                # Update evaluation statuses to 'rejected'
                for evaluation in completed_evaluations:
                    cursor.execute("""
                        UPDATE peer_evaluations
                        SET status = 'rejected'
                        WHERE id = %s
                    """, (evaluation['id'],))
                
                # Update assignment status to rejected
                cursor.execute("""
                    UPDATE task_assignments
                    SET status = 'rejected', completed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (assignment_id,))
                
                # Reset task status to open so others can pick it up
                cursor.execute("""
                    UPDATE tasks
                    SET status = 'open'
                    WHERE id = %s
                """, (assignment['task_id'],))
                
                # Block the original contributor from picking up this task for grace period (30 days)
                grace_period_days = 30
                blocked_until = datetime.utcnow() + timedelta(days=grace_period_days)
                
                cursor.execute("""
                    INSERT INTO task_blocks (task_id, user_id, blocked_until, reason)
                    VALUES (%s, %s, %s, 'Work rejected by majority of reviewers')
                    ON CONFLICT (task_id, user_id) 
                    DO UPDATE SET blocked_until = EXCLUDED.blocked_until, reason = EXCLUDED.reason
                """, (assignment['task_id'], assignment['user_id'], blocked_until))
                
                # Trigger negative rating updates
                update_user_skill_ratings_from_task_completion(
                    task_id=assignment['task_id'],
                    user_id=assignment['user_id'],
                    success=False,
                    average_score=average_score
                )
                
    except Exception as e:
        # Log error but don't fail the evaluation update
        print(f"Error checking task completion: {str(e)}")

@router.delete("/{evaluation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_evaluation = get_peer_evaluation(db, evaluation_id)
    if not db_evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    if db_evaluation.evaluator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this evaluation")
    
    if not delete_peer_evaluation(db, evaluation_id):
        raise HTTPException(status_code=500, detail="Failed to delete evaluation")

@router.get("/metrics/aggregate/{evaluatee_id}")
def get_aggregate_metrics(
    evaluatee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if evaluatee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these metrics")
    
    evaluations = get_peer_evaluations_by_evaluatee(db, evaluatee_id)
    return calculate_aggregate_metrics(evaluations) 