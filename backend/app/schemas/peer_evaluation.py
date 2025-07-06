from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class PeerEvaluationBase(BaseModel):
    overall_score: float = Field(..., ge=0, le=5, description="Overall evaluation score from 0-5")
    strengths: str
    areas_for_improvement: str
    additional_comments: Optional[str] = None

class PeerEvaluationCreate(PeerEvaluationBase):
    task_id: int
    evaluatee_id: int
    assignment_id: int

class PeerEvaluationUpdate(BaseModel):
    overall_score: Optional[float] = Field(None, ge=0, le=5)
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    additional_comments: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    algorithm_metrics: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class PeerEvaluation(PeerEvaluationBase):
    id: int
    task_id: int
    evaluator_id: int
    evaluatee_id: int
    assignment_id: int
    ai_analysis: Optional[Dict[str, Any]] = None
    algorithm_metrics: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 