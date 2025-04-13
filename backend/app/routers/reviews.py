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
<<<<<<< HEAD
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
=======
def read_reviews(skip: int = 0, limit: int = 100, contributor_id: int = None, db: Session = Depends(get_db)):
    # Import models
    from app.models.startup import Startup
    from app.models.contributor import Contributor
    from app.models.task import Task
    
    # Get basic reviews
    reviews = get_reviews(db, skip=skip, limit=limit, contributor_id=contributor_id)
    
    # Enhance with required additional fields
    result = []
    for review in reviews:
        # Get startup and contributor details
        startup = db.query(Startup).filter(Startup.id == review.startup_id).first()
        contributor = db.query(Contributor).filter(Contributor.id == review.contributor_id).first()
        
        # Get task details if provided
        task_title = None
        if review.task_id:
            task = db.query(Task).filter(Task.id == review.task_id).first()
            if task:
                task_title = task.title
        
        # Create a dictionary with all required fields
        review_dict = {
            # Basic review fields
            "id": review.id,
            "startup_id": review.startup_id,
            "contributor_id": review.contributor_id,
            "task_id": review.task_id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            
            # Additional fields required by ReviewWithDetails
            "startup_name": startup.name if startup else "",
            "startup_logo": startup.logo if startup else None,
            "contributor_name": contributor.name if contributor else "",
            "contributor_avatar": contributor.avatar if contributor else None,
            "task_title": task_title
        }
        result.append(review_dict)
    
    return result
>>>>>>> 8f2788b6445eae48d7ae2303597107b663943f83

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
    # Import models
    from app.models.startup import Startup
    from app.models.contributor import Contributor
    from app.models.task import Task
    
    # Get the review
    db_review = get_review(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review not found")
<<<<<<< HEAD
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
=======
    
    # Get startup and contributor details
    startup = db.query(Startup).filter(Startup.id == db_review.startup_id).first()
    contributor = db.query(Contributor).filter(Contributor.id == db_review.contributor_id).first()
    
    # Get task details if provided
    task_title = None
    if db_review.task_id:
        task = db.query(Task).filter(Task.id == db_review.task_id).first()
        if task:
            task_title = task.title
    
    # Create a dictionary with all required fields
    review_dict = {
        # Basic review fields
        "id": db_review.id,
        "startup_id": db_review.startup_id,
        "contributor_id": db_review.contributor_id,
        "task_id": db_review.task_id,
        "rating": db_review.rating,
        "comment": db_review.comment,
        "created_at": db_review.created_at,
        
        # Additional fields required by ReviewWithDetails
        "startup_name": startup.name if startup else "",
        "startup_logo": startup.logo if startup else None,
        "contributor_name": contributor.name if contributor else "",
        "contributor_avatar": contributor.avatar if contributor else None,
        "task_title": task_title
    }
    
    return review_dict
>>>>>>> 8f2788b6445eae48d7ae2303597107b663943f83
