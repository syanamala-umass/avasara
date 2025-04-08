from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.review import ReviewCreate, Review, ReviewUpdate, ReviewWithDetails
from app.crud.review import create_review, get_review, get_reviews, update_review
from app.dependencies import get_current_contributor

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Review, status_code=status.HTTP_201_CREATED)
def create_new_review(
    review: ReviewCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_contributor)
):
    # Verify the task exists and is completed
    from app.crud.task import get_task
    task = get_task(db, task_id=review.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status not in ["completed", "reviewed"]:
        raise HTTPException(status_code=400, detail="Only completed tasks can be reviewed")
    
    # Verify the assignment exists and is completed
    from app.crud.task_assignment import get_task_assignment
    assignment = get_task_assignment(db, assignment_id=review.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.status != "completed":
        raise HTTPException(status_code=400, detail="Only completed assignments can be reviewed")
    
    # Verify the contributor is the one who completed the task
    if assignment.contributor_id != review.contributor_id:
        raise HTTPException(status_code=400, detail="Contributor ID does not match assignment")
    
    # Verify reviewer is not reviewing their own work
    if current_user.contributor.id == review.contributor_id:
        raise HTTPException(status_code=400, detail="You cannot review your own work")
    
    # Calculate review compensation
    # For example, 10% of the task compensation
    compensation_amount = task.compensation_amount * 0.1
    
    return create_review(
        db=db, 
        review=review, 
        reviewer_id=current_user.contributor.id,
        compensation_amount=compensation_amount
    )

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
    current_user = Depends(get_current_contributor)
):
    return get_reviews(
        db, 
        skip=skip, 
        limit=limit, 
        reviewer_id=current_user.contributor.id
    )

@router.get("/my-received-reviews", response_model=List[ReviewWithDetails])
def read_my_received_reviews(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_contributor)
):
    return get_reviews(
        db, 
        skip=skip, 
        limit=limit, 
        contributor_id=current_user.contributor.id
    )

@router.get("/{review_id}", response_model=ReviewWithDetails)
def read_review(review_id: int, db: Session = Depends(get_db)):
    db_review = get_review(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return db_review

@router.put("/{review_id}", response_model=Review)
def update_review_details(
    review_id: int, 
    review: ReviewUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_contributor)
):
    # Only the reviewer can update their review
    db_review = get_review(db, review_id=review_id)
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if db_review.reviewer_id != current_user.contributor.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    return update_review(
        db=db, 
        review_id=review_id, 
        review=review, 
        reviewer_id=current_user.contributor.id
    )
