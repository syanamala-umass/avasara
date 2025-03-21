from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.review import Review
from app.schemas.review import ReviewCreate

def create_review(db: Session, review: ReviewCreate, startup_id: int):
    db_review = Review(
        startup_id=startup_id,
        contributor_id=review.contributor_id,
        task_id=review.task_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Update contributor's average rating
    update_contributor_rating(db, review.contributor_id)
    
    return db_review

def get_review(db: Session, review_id: int):
    return db.query(Review).filter(Review.id == review_id).first()

def get_reviews(db: Session, skip: int = 0, limit: int = 100, contributor_id: Optional[int] = None):
    query = db.query(Review)
    
    if contributor_id:
        query = query.filter(Review.contributor_id == contributor_id)
        
    return query.offset(skip).limit(limit).all()

def get_reviews_by_startup(db: Session, startup_id: int, skip: int = 0, limit: int = 100):
    return db.query(Review).filter(Review.startup_id == startup_id).offset(skip).limit(limit).all()

def get_reviews_by_task(db: Session, task_id: int):
    return db.query(Review).filter(Review.task_id == task_id).all()

def update_contributor_rating(db: Session, contributor_id: int):
    """Update the average rating for a contributor based on all reviews."""
    from app.models.contributor import Contributor
    
    # Calculate average rating
    reviews = db.query(Review).filter(Review.contributor_id == contributor_id).all()
    if reviews:
        avg_rating = sum(review.rating for review in reviews) / len(reviews)
        
        # Update contributor's average_rating
        contributor = db.query(Contributor).filter(Contributor.id == contributor_id).first()
        if contributor:
            contributor.average_rating = avg_rating
            db.commit()
