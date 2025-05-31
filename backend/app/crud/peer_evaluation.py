from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.models.peer_evaluation import PeerEvaluation
from app.schemas.peer_evaluation import PeerEvaluationCreate, PeerEvaluationUpdate
from datetime import datetime

def create_peer_evaluation(
    db: Session, 
    evaluation: PeerEvaluationCreate, 
    evaluator_id: int,
    ai_analysis: Optional[Dict[str, Any]] = None,
    algorithm_metrics: Optional[Dict[str, Any]] = None
) -> PeerEvaluation:
    db_evaluation = PeerEvaluation(
        task_id=evaluation.task_id,
        evaluator_id=evaluator_id,
        evaluatee_id=evaluation.evaluatee_id,
        assignment_id=evaluation.assignment_id,
        technical_score=evaluation.technical_score,
        collaboration_score=evaluation.collaboration_score,
        innovation_score=evaluation.innovation_score,
        reliability_score=evaluation.reliability_score,
        strengths=evaluation.strengths,
        areas_for_improvement=evaluation.areas_for_improvement,
        additional_comments=evaluation.additional_comments,
        ai_analysis=ai_analysis,
        algorithm_metrics=algorithm_metrics
    )
    
    db.add(db_evaluation)
    db.commit()
    db.refresh(db_evaluation)
    return db_evaluation

def get_peer_evaluation(db: Session, evaluation_id: int) -> Optional[PeerEvaluation]:
    return db.query(PeerEvaluation).filter(PeerEvaluation.id == evaluation_id).first()

def get_peer_evaluations_by_task(db: Session, task_id: int) -> List[PeerEvaluation]:
    return db.query(PeerEvaluation).filter(PeerEvaluation.task_id == task_id).all()

def get_peer_evaluations_by_evaluatee(db: Session, evaluatee_id: int) -> List[PeerEvaluation]:
    return db.query(PeerEvaluation).filter(PeerEvaluation.evaluatee_id == evaluatee_id).all()

def get_peer_evaluations_by_evaluator(db: Session, evaluator_id: int) -> List[PeerEvaluation]:
    return db.query(PeerEvaluation).filter(PeerEvaluation.evaluator_id == evaluator_id).all()

def update_peer_evaluation(
    db: Session,
    evaluation_id: int,
    evaluation_update: PeerEvaluationUpdate,
    ai_analysis: Optional[Dict[str, Any]] = None,
    algorithm_metrics: Optional[Dict[str, Any]] = None
) -> Optional[PeerEvaluation]:
    db_evaluation = get_peer_evaluation(db, evaluation_id)
    if db_evaluation:
        update_data = evaluation_update.dict(exclude_unset=True)
        
        if ai_analysis is not None:
            update_data["ai_analysis"] = ai_analysis
        if algorithm_metrics is not None:
            update_data["algorithm_metrics"] = algorithm_metrics
            
        for key, value in update_data.items():
            setattr(db_evaluation, key, value)
            
        db_evaluation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_evaluation)
        
    return db_evaluation

def delete_peer_evaluation(db: Session, evaluation_id: int) -> bool:
    db_evaluation = get_peer_evaluation(db, evaluation_id)
    if db_evaluation:
        db.delete(db_evaluation)
        db.commit()
        return True
    return False

# Helper function to calculate aggregate metrics
def calculate_aggregate_metrics(evaluations: List[PeerEvaluation]) -> Dict[str, float]:
    if not evaluations:
        return {
            "avg_technical_score": 0.0,
            "avg_collaboration_score": 0.0,
            "avg_innovation_score": 0.0,
            "avg_reliability_score": 0.0,
            "overall_score": 0.0
        }
    
    total_technical = sum(e.technical_score for e in evaluations)
    total_collaboration = sum(e.collaboration_score for e in evaluations)
    total_innovation = sum(e.innovation_score for e in evaluations)
    total_reliability = sum(e.reliability_score for e in evaluations)
    count = len(evaluations)
    
    return {
        "avg_technical_score": total_technical / count,
        "avg_collaboration_score": total_collaboration / count,
        "avg_innovation_score": total_innovation / count,
        "avg_reliability_score": total_reliability / count,
        "overall_score": (total_technical + total_collaboration + total_innovation + total_reliability) / (4 * count)
    } 