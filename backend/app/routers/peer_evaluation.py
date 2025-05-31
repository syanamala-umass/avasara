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
    
    return update_peer_evaluation(
        db=db,
        evaluation_id=evaluation_id,
        evaluation_update=evaluation_update,
        ai_analysis=ai_analysis,
        algorithm_metrics=algorithm_metrics
    )

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