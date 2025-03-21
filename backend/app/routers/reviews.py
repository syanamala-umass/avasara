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
    reviews = get_reviews(db, skip=skip, limit=limit, contributor_id=contributor_id)
    return reviews

@router.get("/{review_id}", response_model=ReviewWithDetails)
def read_review(review_id: int, db: Session = Depends(get_db)):
    db_review = get_review(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return db_review
