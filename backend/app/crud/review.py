from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from sqlalchemy.orm import Session
from typing import Optional
from app.models.task_assignment import TaskAssignment
from app.models.task import Task


def create_review(db: Session, review: ReviewCreate, reviewer_id: int, compensation_amount: float):
    db_review = Review(
        task_id=review.task_id,
        assignment_id=review.assignment_id,
        contributor_id=review.contributor_id,
        reviewer_id=reviewer_id,
        is_approved=review.is_approved,
        feedback=review.feedback,
        compensation_amount=compensation_amount
    )
    db.add(db_review)
    
    # Update assignment status
    assignment = db.query(TaskAssignment).filter(TaskAssignment.id == review.assignment_id).first()
    if assignment and assignment.status == "submitted_for_review":
        assignment.status = "reviewed"
    
    # Check majority decision for task completion
    task = db.query(Task).filter(Task.id == review.task_id).first()
    if task and task.status == "submitted_for_review":
        # Get all reviews for this task
        all_reviews = db.query(Review).filter(Review.task_id == review.task_id).all()
        
        if all_reviews:
            # Count approvals vs rejections
            approvals = sum(1 for r in all_reviews if r.is_approved)
            rejections = len(all_reviews) - approvals
            
            # Check if we have enough reviews to make a decision
            required_reviews = task.num_reviewers or 1
            
            if len(all_reviews) >= required_reviews:
                # Majority decision
                if approvals > rejections:
                    task.status = "completed"
                else:
                    task.status = "rejected"
                    # Reset assignment status for resubmission
                    if assignment:
                        assignment.status = "in_progress"
    
    db.commit()
    db.refresh(db_review)
    
    return db_review

def get_review(db: Session, review_id: int):
    return db.query(Review).filter(Review.id == review_id).first()

def get_reviews(db: Session, skip: int = 0, limit: int = 100, 
                contributor_id: Optional[int] = None,
                reviewer_id: Optional[int] = None,
                task_id: Optional[int] = None):
    query = db.query(Review)
    
    if contributor_id:
        query = query.filter(Review.user_id == contributor_id)
        
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
            
    return db_review

def get_task_review_summary(db: Session, task_id: int):
    """Get summary of reviews for a task"""
    reviews = db.query(Review).filter(Review.task_id == task_id).all()
    
    if not reviews:
        return {
            "total_reviews": 0,
            "approvals": 0,
            "rejections": 0,
            "majority_decision": None,
            "is_complete": False
        }
    
    approvals = sum(1 for r in reviews if r.is_approved)
    rejections = len(reviews) - approvals
    
    return {
        "total_reviews": len(reviews),
        "approvals": approvals,
        "rejections": rejections,
        "majority_decision": "approved" if approvals > rejections else "rejected",
        "is_complete": approvals != rejections  # No tie
    }

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
 
