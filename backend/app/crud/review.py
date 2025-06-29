from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from sqlalchemy.orm import Session
from typing import Optional
from app.models.task_assignment import TaskAssignment
from app.models.task import Task
from app.models.user import User
from datetime import datetime


def create_review(db: Session, review: ReviewCreate, reviewer_id: int, compensation_amount: float):
    db_review = Review(
        task_id=review.task_id,
        assignment_id=review.assignment_id,
        user_id=review.contributor_id,
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
    
    # Mark the review assignment as completed for the reviewer
    review_assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == review.task_id,
        TaskAssignment.user_id == reviewer_id,
        TaskAssignment.assignment_type == "review"
    ).first()
    
    if review_assignment:
        review_assignment.status = "completed"
        review_assignment.completed_at = datetime.utcnow()
    
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
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        return None
    
    # Get task details
    task = db.query(Task).filter(Task.id == review.task_id).first()
    
    # Get contributor details
    contributor = db.query(User).filter(User.id == review.user_id).first()
    
    # Get reviewer details
    reviewer = db.query(User).filter(User.id == review.reviewer_id).first()
    
    enhanced_review = {
        "id": review.id,
        "task_id": review.task_id,
        "assignment_id": review.assignment_id,
        "contributor_id": review.user_id,
        "reviewer_id": review.reviewer_id,
        "is_approved": review.is_approved,
        "feedback": review.feedback,
        "compensation_amount": review.compensation_amount,
        "created_at": review.created_at,
        "task_title": task.title if task else f"Task {review.task_id}",
        "contributor_name": contributor.username if contributor else "Unknown User",
        "contributor_avatar": None,
        "reviewer_name": reviewer.username if reviewer else "Unknown Reviewer",
        "reviewer_avatar": None
    }
    
    return enhanced_review

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
    
    reviews = query.offset(skip).limit(limit).all()
    
    # Enhance reviews with additional details
    enhanced_reviews = []
    for review in reviews:
        # Get task details
        task = db.query(Task).filter(Task.id == review.task_id).first()
        
        # Get contributor details
        contributor = db.query(User).filter(User.id == review.user_id).first()
        
        # Get reviewer details
        reviewer = db.query(User).filter(User.id == review.reviewer_id).first()
        
        enhanced_review = {
            "id": review.id,
            "task_id": review.task_id,
            "assignment_id": review.assignment_id,
            "contributor_id": review.user_id,
            "reviewer_id": review.reviewer_id,
            "is_approved": review.is_approved,
            "feedback": review.feedback,
            "compensation_amount": review.compensation_amount,
            "created_at": review.created_at,
            "task_title": task.title if task else f"Task {review.task_id}",
            "contributor_name": contributor.username if contributor else "Unknown User",
            "contributor_avatar": None,
            "reviewer_name": reviewer.username if reviewer else "Unknown Reviewer",
            "reviewer_avatar": None
        }
        enhanced_reviews.append(enhanced_review)
    
    return enhanced_reviews

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
    
    # Calculate approval rate instead of average rating
    reviews = db.query(Review).filter(Review.user_id == contributor_id).all()
    if reviews:
        approved_reviews = sum(1 for review in reviews if review.is_approved)
        approval_rate = (approved_reviews / len(reviews)) * 100
        
        # Update contributor's average_rating (using approval rate as rating)
        contributor = db.query(Contributor).filter(Contributor.id == contributor_id).first()
        if contributor:
            contributor.average_rating = approval_rate
            db.commit()
 
