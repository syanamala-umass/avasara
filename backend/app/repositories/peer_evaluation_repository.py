from typing import List, Optional, Dict, Any
from datetime import datetime
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_cursor
from app.schemas.peer_evaluation import PeerEvaluationCreate, PeerEvaluationUpdate

class PeerEvaluationRepository:
    @staticmethod
    def create_evaluation(
        evaluation: PeerEvaluationCreate,
        evaluator_id: int,
        ai_analysis: Optional[Dict[str, Any]] = None,
        algorithm_metrics: Optional[Dict[str, Any]] = None
    ) -> Dict:
        query = """
        INSERT INTO peer_evaluations (
            task_id, evaluator_id, evaluatee_id, assignment_id,
            technical_score, collaboration_score, innovation_score, reliability_score,
            strengths, areas_for_improvement, additional_comments,
            ai_analysis, algorithm_metrics
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        ) RETURNING *;
        """
        
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, (
                evaluation.task_id,
                evaluator_id,
                evaluation.evaluatee_id,
                evaluation.assignment_id,
                evaluation.technical_score,
                evaluation.collaboration_score,
                evaluation.innovation_score,
                evaluation.reliability_score,
                evaluation.strengths,
                evaluation.areas_for_improvement,
                evaluation.additional_comments,
                ai_analysis,
                algorithm_metrics
            ))
            return cursor.fetchone()

    @staticmethod
    def get_evaluation(evaluation_id: int) -> Optional[Dict]:
        query = "SELECT * FROM peer_evaluations WHERE id = %s;"
        with get_db_cursor() as cursor:
            cursor.execute(query, (evaluation_id,))
            return cursor.fetchone()

    @staticmethod
    def get_evaluations_by_task(task_id: int) -> List[Dict]:
        query = """
        SELECT pe.*, 
               e.name as evaluator_name, 
               ee.name as evaluatee_name
        FROM peer_evaluations pe
        JOIN users e ON pe.evaluator_id = e.id
        JOIN users ee ON pe.evaluatee_id = ee.id
        WHERE pe.task_id = %s;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (task_id,))
            return cursor.fetchall()

    @staticmethod
    def get_evaluations_by_evaluatee(evaluatee_id: int) -> List[Dict]:
        query = """
        SELECT pe.*, 
               e.name as evaluator_name,
               t.title as task_title
        FROM peer_evaluations pe
        JOIN users e ON pe.evaluator_id = e.id
        JOIN tasks t ON pe.task_id = t.id
        WHERE pe.evaluatee_id = %s;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (evaluatee_id,))
            return cursor.fetchall()

    @staticmethod
    def get_evaluations_by_evaluator(evaluator_id: int) -> List[Dict]:
        query = """
        SELECT pe.*, 
               ee.name as evaluatee_name,
               t.title as task_title
        FROM peer_evaluations pe
        JOIN users ee ON pe.evaluatee_id = ee.id
        JOIN tasks t ON pe.task_id = t.id
        WHERE pe.evaluator_id = %s;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (evaluator_id,))
            return cursor.fetchall()

    @staticmethod
    def update_evaluation(
        evaluation_id: int,
        evaluation: PeerEvaluationUpdate,
        ai_analysis: Optional[Dict[str, Any]] = None,
        algorithm_metrics: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict]:
        # Build update query dynamically based on provided fields
        update_fields = []
        params = []
        
        if evaluation.technical_score is not None:
            update_fields.append("technical_score = %s")
            params.append(evaluation.technical_score)
        if evaluation.collaboration_score is not None:
            update_fields.append("collaboration_score = %s")
            params.append(evaluation.collaboration_score)
        if evaluation.innovation_score is not None:
            update_fields.append("innovation_score = %s")
            params.append(evaluation.innovation_score)
        if evaluation.reliability_score is not None:
            update_fields.append("reliability_score = %s")
            params.append(evaluation.reliability_score)
        if evaluation.strengths is not None:
            update_fields.append("strengths = %s")
            params.append(evaluation.strengths)
        if evaluation.areas_for_improvement is not None:
            update_fields.append("areas_for_improvement = %s")
            params.append(evaluation.areas_for_improvement)
        if evaluation.additional_comments is not None:
            update_fields.append("additional_comments = %s")
            params.append(evaluation.additional_comments)
        if evaluation.status is not None:
            update_fields.append("status = %s")
            params.append(evaluation.status)
        if ai_analysis is not None:
            update_fields.append("ai_analysis = %s")
            params.append(ai_analysis)
        if algorithm_metrics is not None:
            update_fields.append("algorithm_metrics = %s")
            params.append(algorithm_metrics)
        
        update_fields.append("updated_at = %s")
        params.append(datetime.utcnow())
        
        # Add evaluation_id to params
        params.append(evaluation_id)
        
        query = f"""
        UPDATE peer_evaluations
        SET {", ".join(update_fields)}
        WHERE id = %s
        RETURNING *;
        """
        
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, tuple(params))
            return cursor.fetchone()

    @staticmethod
    def delete_evaluation(evaluation_id: int) -> bool:
        query = "DELETE FROM peer_evaluations WHERE id = %s;"
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, (evaluation_id,))
            return cursor.rowcount > 0

    @staticmethod
    def calculate_aggregate_metrics(evaluatee_id: int) -> Dict[str, float]:
        query = """
        SELECT 
            AVG(technical_score) as avg_technical_score,
            AVG(collaboration_score) as avg_collaboration_score,
            AVG(innovation_score) as avg_innovation_score,
            AVG(reliability_score) as avg_reliability_score,
            (AVG(technical_score) + AVG(collaboration_score) + 
             AVG(innovation_score) + AVG(reliability_score)) / 4 as overall_score
        FROM peer_evaluations
        WHERE evaluatee_id = %s AND status = 'completed';
        """
        
        with get_db_cursor() as cursor:
            cursor.execute(query, (evaluatee_id,))
            metrics = cursor.fetchone()
            
            if not metrics or metrics["avg_technical_score"] is None:
                return {
                    "avg_technical_score": 0.0,
                    "avg_collaboration_score": 0.0,
                    "avg_innovation_score": 0.0,
                    "avg_reliability_score": 0.0,
                    "overall_score": 0.0
                }
            
            return metrics 