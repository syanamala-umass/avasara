from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from sqlalchemy.orm import Session
from typing import Optional
from app.models.task_assignment import TaskAssignment


def create_review(db: Session, review: ReviewCreate, reviewer_id: int, compensation_amount: float):
    db_review = Review(
        task_id=review.task_id,
        assignment_id=review.assignment_id,
        contributor_id=review.contributor_id,
        reviewer_id=reviewer_id,
        rating=review.rating,
        comment=review.comment,
        compensation_amount=compensation_amount
    )
    db.add(db_review)
    
    # Update assignment status
    assignment = db.query(TaskAssignment).filter(TaskAssignment.id == review.assignment_id).first()
    if assignment and assignment.status == "completed":
        assignment.status = "reviewed"
        
    # Check if all assignments for this task have been reviewed
    # If so, update task status
    from app.models.task import Task
    task = db.query(Task).filter(Task.id == review.task_id).first()
    if task and task.status == "completed":
        pending_reviews = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == review.task_id,
            TaskAssignment.status == "completed"
        ).count()
        
        if pending_reviews == 0:
            task.status = "reviewed"
    
    db.commit()
    db.refresh(db_review)
    
    # Update contributor's average rating
    update_contributor_rating(db, review.contributor_id)
    
    return db_review

def get_review(db: Session, review_id: int):
    return db.query(Review).filter(Review.id == review_id).first()

def get_reviews(db: Session, skip: int = 0, limit: int = 100, 
                contributor_id: Optional[int] = None,
                reviewer_id: Optional[int] = None,
                task_id: Optional[int] = None):
    query = db.query(Review)
    
    if contributor_id:
        query = query.filter(Review.contributor_id == contributor_id)
        
    if reviewer_id:
        query = query.filter(Review.reviewer_id == reviewer_id)
        
    if task_id:
        query = query.filter(Review.task_id == task_id)
        
    return query.offset(skip).limit(limit).all()

def update_review(db: Session, review_id: int, review: ReviewUpdate, reviewer_id: int):
    db_review = db.query(Review).filter(
        Review.id == review_id,
        Review.reviewer_id == reviewer_id
    ).first()
    
    if db_review:
        update_data = review.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_review, key, value)
        
        db.commit()
        db.refresh(db_review)
        
        # If rating was updated, recalculate contributor's average
        if "rating" in update_data:
            update_contributor_rating(db, db_review.contributor_id)
            
    return db_review

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
