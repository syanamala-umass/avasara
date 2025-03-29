from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.review import ReviewCreate, Review, ReviewWithDetails
from app.crud.review import create_review, get_review, get_reviews
from app.dependencies import get_current_startup

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Review, status_code=status.HTTP_201_CREATED)
def create_new_review(review: ReviewCreate, db: Session = Depends(get_db), current_user = Depends(get_current_startup)):
    return create_review(db=db, review=review, startup_id=current_user.startup.id)

@router.get("/", response_model=List[ReviewWithDetails])
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
