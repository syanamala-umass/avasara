from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.review import ReviewCreate, Review, ReviewUpdate, ReviewWithDetails
from app.crud.review import create_review, get_review, get_reviews, update_review, get_task_review_summary
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Review, status_code=status.HTTP_201_CREATED)
def create_new_review(
    review: ReviewCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Verify the task exists and is submitted for review
    from app.crud.task import get_task
    task = get_task(db, task_id=review.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != "submitted_for_review":
        raise HTTPException(status_code=400, detail="Only tasks submitted for review can be reviewed")
    
    # Verify the assignment exists and is submitted for review
    from app.crud.task_assignment import get_task_assignment
    assignment = get_task_assignment(db, assignment_id=review.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.status != "submitted_for_review":
        raise HTTPException(status_code=400, detail="Only assignments submitted for review can be reviewed")
    
    # Verify the contributor is the one who completed the task
    if assignment.user_id != review.contributor_id:
        raise HTTPException(status_code=400, detail="Contributor ID does not match assignment")
    
    # Verify reviewer is not reviewing their own work
    if current_user.id == review.contributor_id:
        raise HTTPException(status_code=400, detail="You cannot review your own work")
    
    # Check if reviewer has already reviewed this task
    existing_review = db.query(Review).filter(
        Review.task_id == review.task_id,
        Review.reviewer_id == current_user.id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this task")
    
    # Calculate review compensation (10% of task compensation)
    compensation_amount = task.compensation_amount * 0.1 if task.compensation_amount else 0
    
    return create_review(
        db=db, 
        review=review, 
        reviewer_id=current_user.id,
        compensation_amount=compensation_amount
    )

@router.get("/task/{task_id}/summary")
def get_review_summary(task_id: int, db: Session = Depends(get_db)):
    """Get review summary for a specific task"""
    return get_task_review_summary(db, task_id)

@router.get("/", response_model=List[ReviewWithDetails])
def read_reviews(
    skip: int = 0, 
    limit: int = 100, 
    contributor_id: int = None,
    reviewer_id: int = None,
    task_id: int = None,
    db: Session = Depends(get_db)
):
    reviews = get_reviews(
        db, 
        skip=skip, 
        limit=limit, 
        contributor_id=contributor_id,
        reviewer_id=reviewer_id,
        task_id=task_id
    )
    return reviews

@router.get("/my-reviews", response_model=List[ReviewWithDetails])
def read_my_reviews(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_reviews(
        db, 
        skip=skip, 
        limit=limit, 
        reviewer_id=current_user.id
    )

@router.get("/my-received-reviews", response_model=List[ReviewWithDetails])
def read_my_received_reviews(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_reviews(
        db, 
        skip=skip, 
        limit=limit, 
        contributor_id=current_user.id
    )

@router.get("/{review_id}", response_model=ReviewWithDetails)
def read_review(review_id: int, db: Session = Depends(get_db)):
    # Import models
    from app.models.startup import Startup
    from app.models.contributor import Contributor
    from app.models.task import Task
    
    # Get the review
    db_review = get_review(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return db_review

@router.put("/{review_id}", response_model=Review)
def update_review_details(
    review_id: int, 
    review: ReviewUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Only the reviewer can update their review
    db_review = get_review(db, review_id=review_id)
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if db_review.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    return update_review(
        db=db, 
        review_id=review_id, 
        review=review, 
        reviewer_id=current_user.id
    )
