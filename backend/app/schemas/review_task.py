from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

class ReviewTaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="open", pattern="^(open|in_progress|completed|cancelled)$")
    skill_requirements: Dict[str, Any] = Field(default_factory=dict)

class ReviewTaskCreate(ReviewTaskBase):
    parent_task_id: int
    assignment_being_reviewed_id: int

class ReviewTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(open|in_progress|completed|cancelled)$")
    skill_requirements: Optional[Dict[str, Any]] = None

class ReviewTask(ReviewTaskBase):
    id: int
    parent_task_id: int
    assignment_being_reviewed_id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Review Task Assignment Schemas
class ReviewAssignmentBase(BaseModel):
    status: str = Field(default="assigned", pattern="^(assigned|in_progress|completed|cancelled)$")
    accept_reject: Optional[bool] = None  # TRUE = accept, FALSE = reject, NULL = not decided
    technical_score: Optional[Decimal] = Field(None, ge=0, le=5)
    collaboration_score: Optional[Decimal] = Field(None, ge=0, le=5)
    innovation_score: Optional[Decimal] = Field(None, ge=0, le=5)
    reliability_score: Optional[Decimal] = Field(None, ge=0, le=5)
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    additional_comments: Optional[str] = None

class ReviewAssignmentCreate(ReviewAssignmentBase):
    review_task_id: int

class ReviewAssignmentUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(assigned|in_progress|completed|cancelled)$")
    accept_reject: Optional[bool] = None  # TRUE = accept, FALSE = reject, NULL = not decided
    technical_score: Optional[Decimal] = Field(None, ge=0, le=5)
    collaboration_score: Optional[Decimal] = Field(None, ge=0, le=5)
    innovation_score: Optional[Decimal] = Field(None, ge=0, le=5)
    reliability_score: Optional[Decimal] = Field(None, ge=0, le=5)
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    additional_comments: Optional[str] = None

class ReviewAssignment(ReviewAssignmentBase):
    id: int
    review_task_id: int
    reviewer_id: int
    assigned_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Combined schemas for API responses
class ReviewTaskWithDetails(ReviewTask):
    parent_task_title: Optional[str] = None
    assignment_details: Optional[Dict[str, Any]] = None
    review_assignments: Optional[list[ReviewAssignment]] = []

class ReviewAssignmentWithDetails(ReviewAssignment):
    review_task_title: Optional[str] = None
    reviewer_name: Optional[str] = None
    parent_task_title: Optional[str] = None 