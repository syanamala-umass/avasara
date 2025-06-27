from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import logging
import traceback
import sys

from app.models.task_assignment import TaskAssignment
from app.models.review import Review
from app.models.task_compensation import TaskCompensation
from app.database import get_db
from app.schemas.task import TaskCreate, Task, TaskUpdate, TaskWithDetails
from app.crud.task import create_task, get_task, get_tasks, update_task
from app.crud.task_assignment import check_existing_assignment
from app.dependencies import get_current_user
import random
from app import models
from app.database.connection import get_db_cursor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)

@router.get("/reviewable", response_model=List[TaskWithDetails])
def get_reviewable_tasks(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    print("please ikkadiki anna ra")
    from app.models.task import Task
    # Fetch all completed tasks
    tasks = db.query(Task).filter(Task.status == 'completed').all()
    print(tasks)
    # Get current user's skills
    print(current_user.skills)
    user_skills = set(current_user.skills or [])  # Assuming skills is a list or comma-separated string

    if isinstance(user_skills, str):
        user_skills = set(skill.strip() for skill in user_skills.split(","))

    # Filter tasks based on skill overlap
    matched_tasks = []
    for task in tasks:
        task_skills = set(task.skills or [])

        if isinstance(task_skills, str):
            task_skills = set(skill.strip() for skill in task_skills.split(","))

        if user_skills & task_skills:  # at least one common skill
            matched_tasks.append(task)

    # Get compensation data for all tasks
    task_compensations = {}
    task_comp_records = db.query(TaskCompensation).filter(
        TaskCompensation.task_id.in_([task.id for task in matched_tasks])
    ).all()

    for tc in task_comp_records:
        if tc.task_id not in task_compensations:
            task_compensations[tc.task_id] = {'task': None, 'review': None}
        task_compensations[tc.task_id][tc.amount_type] = tc

    # Return matching tasks
    return [
        {
            "id": task.id,
            "user_id": task.user_id,
            "title": task.title,
            "description": task.description,
            "compensation_type": task_compensations[task.id].compensation_type if task.id in task_compensations else None,
            "compensation_amount": task_compensations[task.id].amount if task.id in task_compensations else None,
            "deadline": task.deadline,
            "created_at": task.created_at,
            "status": task.status,
            "skills": task.skills,
            "startup_name": task.startup.name if task.startup else "",
            "startup_logo": task.startup.logo if task.startup else None,
            "assignments_count": db.query(TaskAssignment).filter(TaskAssignment.task_id == task.id).count(),
            "reviews_count": db.query(Review).filter(Review.task_id == task.id).count()
        }
        for task in matched_tasks
    ]



@router.post("/", response_model=TaskWithDetails, status_code=status.HTTP_201_CREATED)
def create_new_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    print("=== Task Creation Debug ===")
    print(f"Current user: {current_user}")
    print(f"Task data: {task}")
    
    # Create task with user_id
    db_task = create_task(db=db, task=task, user_id=current_user.id)
    
    # Get task assignments count
    assignments_count = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == db_task.id
    ).count()
    
    # Get reviews count
    reviews_count = db.query(Review).filter(
        Review.task_id == db_task.id
    ).count()

    # Get number of people currently working on the task
    num_people_working = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == db_task.id,
        TaskAssignment.status == 'in_progress'
    ).count()
    
    # Get task compensations
    task_compensations = {}
    for tc in db.query(TaskCompensation).filter(TaskCompensation.task_id == db_task.id).all():
        if tc.task_id not in task_compensations:
            task_compensations[tc.task_id] = {'task': None, 'review': None}
        task_compensations[tc.task_id][tc.amount_type] = tc

    # Format skills for response
    skills = [
        {
            "id": skill.id,
            "name": skill.name
        }
        for skill in db_task.skills
    ]
    
    # Create response with all required fields explicitly listed
    task_response = {
        # Basic task fields
        "id": db_task.id,
        "user_id": db_task.user_id,
        "title": db_task.title,
        "description": db_task.description,
        "compensation_type": task_compensations.get(db_task.id, {}).get('task').compensation_type if task_compensations.get(db_task.id, {}).get('task') else None,
        "compensation_amount": task_compensations.get(db_task.id, {}).get('task').amount if task_compensations.get(db_task.id, {}).get('task') else None,
        "review_compensation_type": task_compensations.get(db_task.id, {}).get('review').compensation_type if task_compensations.get(db_task.id, {}).get('review') else None,
        "review_compensation_amount": task_compensations.get(db_task.id, {}).get('review').amount if task_compensations.get(db_task.id, {}).get('review') else None,
        "deadline": db_task.deadline,
        "created_at": db_task.created_at,
        "status": db_task.status,
        "category": "task",  # Default category for newly created tasks
        
        # Additional fields required by TaskWithDetails
        "skills": skills,
        "creator_name": db_task.user.username,
        "creator_avatar": None,
        "assignments_count": assignments_count,
        "reviews_count": reviews_count,
        "num_people_working": num_people_working,
        "has_assignment": False  # Newly created tasks don't have assignments yet
    }
    
    return task_response


@router.get("/", response_model=List[TaskWithDetails])
def read_tasks(
    request: Request,
    skip: int = 0, 
    limit: int = 100, 
    status: str = None, 
    creator_id: int = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Log the full URL and query parameters
        logger.info(f"Request URL: {request.url}")
        logger.info(f"Query parameters: skip={skip}, limit={limit}, status={status}, creator_id={creator_id}, category={category}")
        logger.info(f"Current user: {current_user.id}")
        
        # Get tasks with skills and user relationships loaded
        query = db.query(models.Task).options(
            joinedload(models.Task.skills),
            joinedload(models.Task.user)
        )
        
        if status:
            query = query.filter(models.Task.status == status)
        if creator_id:
            query = query.filter(models.Task.user_id == creator_id)
        if category == 'review':
            # For review tasks, we want tasks that have submitted assignments
            # BUT exclude tasks where the current user is the original task completer
            query = query.join(models.TaskAssignment).filter(
                models.TaskAssignment.status == 'submitted_for_review',
                models.TaskAssignment.user_id != current_user.id  # Exclude tasks completed by current user
            ).distinct()
            
        tasks = query.offset(skip).limit(limit).all()
        
        # Get compensation data for all tasks
        task_compensations = {}
        task_comp_records = db.query(TaskCompensation).filter(
            TaskCompensation.task_id.in_([task.id for task in tasks])
        ).all()

        for tc in task_comp_records:
            if tc.task_id not in task_compensations:
                task_compensations[tc.task_id] = {'task': None, 'review': None}
            task_compensations[tc.task_id][tc.amount_type] = tc
        
        # Log the number of tasks found
        logger.info(f"Found {len(tasks)} tasks matching the criteria")
        
        # Enhance with required additional fields
        result = []
        for task in tasks:
            try:
                logger.info(f"Processing task {task.id}")
                # Get assignments and reviews count
                assignments_count = db.query(TaskAssignment).filter(TaskAssignment.task_id == task.id).count()
                reviews_count = db.query(Review).filter(Review.task_id == task.id).count()
                
                # Get number of people currently working on the task
                num_people_working = db.query(TaskAssignment).filter(
                    TaskAssignment.task_id == task.id,
                    TaskAssignment.status == 'in_progress'
                ).count()
                
                logger.info(f"Task {task.id} has {assignments_count} assignments and {reviews_count} reviews")
                
                # Format skills for response
                skills = [
                    {
                        "id": skill.id,
                        "name": skill.name
                    }
                    for skill in task.skills
                ]
                
                # Get compensation data
                compensation = task_compensations.get(task.id, {}).get('task')
                
                # Create a dictionary for this task with all required fields
                task_dict = {
                    # Basic task fields
                    "id": task.id,
                    "user_id": task.user_id,
                    "title": task.title,
                    "description": task.description,
                    "compensation_type": compensation.compensation_type if compensation else None,
                    "compensation_amount": compensation.amount if compensation else None,
                    "deadline": task.deadline,
                    "created_at": task.created_at,
                    "status": task.status,
                    "category": category or "task",  # Add category field
                    
                    # Additional fields required by TaskWithDetails
                    "skills": skills,
                    "creator_name": task.user.username,  # Using username since name field doesn't exist
                    "creator_avatar": None,  # Avatar field doesn't exist
                    "assignments_count": assignments_count,
                    "reviews_count": reviews_count,
                    "num_people_working": num_people_working
                }
                logger.info(f"Created task dictionary for task {task.id}")
                result.append(task_dict)
            except Exception as e:
                logger.error(f"Error processing task {task.id}: {str(e)}")
                logger.error("Traceback:", exc_info=True)
                raise
        
        logger.info(f"Successfully processed {len(result)} tasks")
        return result
    except Exception as e:
        logger.error(f"Error in read_tasks: {str(e)}")
        logger.error("Full traceback:", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{task_id}", response_model=TaskWithDetails)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Get the task with skills relationship loaded
    db_task = db.query(models.Task).options(
        joinedload(models.Task.skills)
    ).filter(models.Task.id == task_id).first()
    
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get task assignments count
    assignments_count = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id
    ).count()
    
    # Get reviews count
    reviews_count = db.query(Review).filter(
        Review.task_id == task_id
    ).count()

    # Get number of people currently working on the task
    num_people_working = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.status == 'in_progress'
    ).count()
    
    # Get task compensations
    task_compensations = {}
    for tc in db.query(TaskCompensation).filter(TaskCompensation.task_id == task_id).all():
        if tc.task_id not in task_compensations:
            task_compensations[tc.task_id] = {'task': None, 'review': None}
        task_compensations[tc.task_id][tc.amount_type] = tc

    # Check if current user has an assignment for this task
    has_assignment = check_existing_assignment(
        task_id=task_id,
        user_id=current_user.id
    )
    
    # Format skills for response
    skills = [
        {
            "id": skill.id,
            "name": skill.name
        }
        for skill in db_task.skills
    ]
    
    # Create response with all required fields explicitly listed
    task_response = {
        # Basic task fields
        "id": db_task.id,
        "user_id": db_task.user_id,
        "title": db_task.title,
        "description": db_task.description,
        "compensation_type": task_compensations.get(db_task.id, {}).get('task').compensation_type if task_compensations.get(db_task.id, {}).get('task') else None,
        "compensation_amount": task_compensations.get(db_task.id, {}).get('task').amount if task_compensations.get(db_task.id, {}).get('task') else None,
        "review_compensation_type": task_compensations.get(db_task.id, {}).get('review').compensation_type if task_compensations.get(db_task.id, {}).get('review') else None,
        "review_compensation_amount": task_compensations.get(db_task.id, {}).get('review').amount if task_compensations.get(db_task.id, {}).get('review') else None,
        "deadline": db_task.deadline,
        "created_at": db_task.created_at,
        "status": db_task.status,
        
        # Additional fields required by TaskWithDetails
        "skills": skills,
        "creator_name": db_task.user.username,
        "creator_avatar": None,
        "assignments_count": assignments_count,
        "reviews_count": reviews_count,
        "num_people_working": num_people_working,
        "has_assignment": has_assignment
    }
    
    return task_response


@router.put("/{task_id}", response_model=Task)
def update_task_details(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return update_task(db=db, task_id=task_id, task=task, user_id=current_user.id)




def assign_reviewers_randomly(db: Session, task_id: int, num_reviewers: int = 2):
    # 1. Fetch the completed task
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise Exception(f"Task with ID {task_id} not found.")

    # 2. Fetch eligible reviewers (everyone except the task completer)
    reviewers_query = db.query(models.User).filter(models.User.id != task.completed_by_id)
    reviewers = reviewers_query.all()

    if not reviewers:
        raise Exception("No eligible reviewers available.")

    # 3. Randomly pick reviewers
    selected_reviewers = random.sample(reviewers, min(num_reviewers, len(reviewers)))

    # 4. Create Review records
    for reviewer in selected_reviewers:
        review = models.Review(
            task_id=task.id,
            reviewer_id=reviewer.id,
            review_status='pending'
        )
        db.add(review)

    db.commit()

    # 5. Optionally return selected reviewer IDs
    return [reviewer.id for reviewer in selected_reviewers]


@router.post("/{task_id}/complete")
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Mark task as completed
    task.status = 'completed'
    db.commit()

    # 🔥 DO NOT assign reviewers here anymore

    return {"message": "Task marked as completed."}


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Get the task
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if the task belongs to the current user
    if task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    # Check if the task is open (not assigned to anyone)
    if task.status != 'open':
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete task that has been assigned or completed"
        )
    
    # Delete the task
    db.delete(task)
    db.commit()
    
    return None


@router.post("/{task_id}/submit")
async def submit_task(
    task_id: int,
    files: List[UploadFile] = File(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Get the task
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get the task assignment
    assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.user_id == current_user.id,
        TaskAssignment.status == 'in_progress'
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="No active assignment found for this task")

    try:
        # Update assignment status
        assignment.status = 'submitted_for_review'
        assignment.notes = notes or 'Task submitted for review'
        
        # Update task status
        task.status = 'submitted_for_review'
        
        # Save files if provided
        if files:
            # TODO: Implement file storage logic
            # For now, just store file names
            assignment.submission_files = [file.filename for file in files]

        db.commit()
        
        return {
            "message": "Task submitted successfully",
            "status": "submitted_for_review"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{task_id}/review")
async def review_task(
    task_id: int,
    review_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    logger.info(f"=== Starting review submission for task {task_id} ===")
    logger.info(f"Current user: {current_user.id} ({current_user.username})")
    logger.info(f"Review data received: {review_data}")
    
    # Get the task
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        logger.error(f"Task {task_id} not found in database")
        raise HTTPException(status_code=404, detail="Task not found")
    
    logger.info(f"Task found: {task.title} (ID: {task.id})")
    logger.info(f"Task current status: {task.status}")

    # Get the task assignment for the specific user
    assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.user_id == current_user.id
    ).first()

    if not assignment:
        logger.error(f"No assignment found for task {task_id} and user {current_user.id}")
        raise HTTPException(status_code=404, detail="No assignment found for this task and user")
    
    logger.info(f"Assignment found: ID {assignment.id}")
    logger.info(f"Assignment current status: {assignment.status}")

    # Check if user has already reviewed this task
    existing_review = db.query(models.Review).filter(
        models.Review.task_id == task_id,
        models.Review.reviewer_id == current_user.id
    ).first()
    
    if existing_review:
        logger.error(f"User {current_user.id} has already reviewed task {task_id}")
        raise HTTPException(status_code=400, detail="You have already reviewed this task")

    try:
        # Extract review data
        is_approved = review_data.get('status') == 'accepted'  # Convert accept/reject to boolean
        feedback = review_data.get('feedback', '')
        
        # Create review
        review = models.Review(
            task_id=task_id,
            assignment_id=assignment.id,
            user_id=assignment.user_id,
            reviewer_id=current_user.id,
            is_approved=is_approved,
            feedback=feedback if not is_approved else None  # Only store feedback for rejections
        )
        db.add(review)
        logger.info(f"New review created: is_approved={is_approved}, feedback_length={len(feedback) if feedback else 0}")

        # Update assignment status
        assignment.status = 'reviewed'
        logger.info(f"Assignment status updated to: {assignment.status}")
        
        # Check majority decision
        all_reviews = db.query(models.Review).filter(
            models.Review.task_id == task_id
        ).all()
        
        logger.info(f"Total reviews for task: {len(all_reviews)}")
        logger.info(f"Required reviews: {task.num_reviewers or 1}")
        
        if len(all_reviews) >= (task.num_reviewers or 1):
            # Count approvals vs rejections
            approvals = sum(1 for r in all_reviews if r.is_approved)
            rejections = len(all_reviews) - approvals
            
            logger.info(f"Approvals: {approvals}, Rejections: {rejections}")
            
            # Majority decision
            if approvals > rejections:
                task.status = 'completed'
                logger.info(f"Task approved by majority. Status: {task.status}")
            else:
                task.status = 'rejected'
                # Reset assignment for resubmission
                assignment.status = 'in_progress'
                logger.info(f"Task rejected by majority. Status: {task.status}, Assignment reset to: {assignment.status}")
        else:
            task.status = 'submitted_for_review'
            logger.info(f"More reviews needed. Status: {task.status}")

        db.commit()
        logger.info("Database changes committed successfully")
        
        return {
            "message": "Review submitted successfully",
            "status": task.status,
            "reviews_submitted": len(all_reviews),
            "reviews_required": task.num_reviewers or 1,
            "approvals": sum(1 for r in all_reviews if r.is_approved),
            "rejections": sum(1 for r in all_reviews if not r.is_approved)
        }
    except Exception as e:
        logger.error(f"Error during review submission: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{task_id}/details")
def get_task_details(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get comprehensive task details including assignments, reviews, and statistics"""
    
    logger.info(f"=== Task Details Request ===")
    logger.info(f"Task ID: {task_id}")
    logger.info(f"Current user: {current_user.id}")
    
    # Get the task with relationships loaded
    db_task = db.query(models.Task).options(
        joinedload(models.Task.skills),
        joinedload(models.Task.user)
    ).filter(models.Task.id == task_id).first()
    
    if db_task is None:
        logger.error(f"Task {task_id} not found")
        raise HTTPException(status_code=404, detail="Task not found")
    
    logger.info(f"Task found: {db_task.title}")
    
    # Check if current user is the task creator (dispatcher)
    is_dispatcher = db_task.user_id == current_user.id
    logger.info(f"User is dispatcher: {is_dispatcher}")
    
    # Check if current user is assigned as a reviewer for this task
    user_assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.user_id == current_user.id,
        TaskAssignment.assignment_type == 'review'
    ).first()
    is_reviewer = user_assignment is not None
    logger.info(f"User is reviewer: {is_reviewer}")
    
    # Get task compensations
    task_compensations = {}
    for tc in db.query(TaskCompensation).filter(TaskCompensation.task_id == task_id).all():
        if tc.task_id not in task_compensations:
            task_compensations[tc.task_id] = {'task': None, 'review': None}
        task_compensations[tc.task_id][tc.amount_type] = tc
    
    # Format skills
    skills = [
        {
            "id": skill.id,
            "name": skill.name
        }
        for skill in db_task.skills
    ]
    
    # Base task information (available to all users)
    task_details = {
        # Basic task info
        "id": db_task.id,
        "title": db_task.title,
        "description": db_task.description,
        "status": db_task.status,
        "category": "task",
        "created_at": db_task.created_at,
        "deadline": db_task.deadline,
        "creator_name": db_task.user.username if db_task.user else "Unknown Creator",
        
        # Compensation
        "compensation_type": task_compensations.get(db_task.id, {}).get('task').compensation_type if task_compensations.get(db_task.id, {}).get('task') else None,
        "compensation_amount": task_compensations.get(db_task.id, {}).get('task').amount if task_compensations.get(db_task.id, {}).get('task') else None,
        "review_compensation_type": task_compensations.get(db_task.id, {}).get('review').compensation_type if task_compensations.get(db_task.id, {}).get('review') else None,
        "review_compensation_amount": task_compensations.get(db_task.id, {}).get('review').amount if task_compensations.get(db_task.id, {}).get('review') else None,
        
        # Task configuration
        "num_reviewers": db_task.num_reviewers,
        "max_parallel_contributors": db_task.max_parallel_contributors,
        "contributor_time_limit_hours": db_task.contributor_time_limit_hours,
        
        # Skills
        "skills": skills,
        
        # Additional metadata
        "has_assignment": check_existing_assignment(task_id=task_id, user_id=current_user.id)
    }
    
    # If user is the dispatcher or a reviewer, add detailed information
    if is_dispatcher or is_reviewer:
        logger.info(f"User is dispatcher ({is_dispatcher}) or reviewer ({is_reviewer}) - adding detailed information")
        
        # Get all assignments for this task (excluding review assignments)
        assignments = db.query(TaskAssignment).options(
            joinedload(TaskAssignment.user)
        ).filter(
            TaskAssignment.task_id == task_id,
            TaskAssignment.assignment_type != 'review'  # Only show contributor assignments
        ).all()
        
        logger.info(f"Found {len(assignments)} contributor assignments for task {task_id}")
        
        # Format assignments
        formatted_assignments = []
        for assignment in assignments:
            formatted_assignments.append({
                "id": assignment.id,
                "user_id": assignment.user_id,
                "contributor_name": assignment.user.username if assignment.user else "Unknown User",
                "status": assignment.status,
                "assignment_type": assignment.assignment_type,
                "notes": assignment.notes,
                "submission_files": assignment.submission_files or [],
                "created_at": assignment.created_at,
                "updated_at": assignment.updated_at,
                "submitted_at": assignment.submitted_at
            })
        
        # Get all reviews for this task
        reviews = db.query(models.Review).options(
            joinedload(models.Review.reviewer)
        ).filter(models.Review.task_id == task_id).all()
        
        logger.info(f"Found {len(reviews)} reviews for task {task_id}")
        
        # Format reviews
        formatted_reviews = []
        for review in reviews:
            formatted_reviews.append({
                "id": review.id,
                "reviewer_id": review.reviewer_id,
                "reviewer_name": review.reviewer.username if review.reviewer else "Unknown Reviewer",
                "is_approved": review.is_approved,
                "feedback": review.feedback,
                "rating": review.rating,
                "created_at": review.created_at
            })
        
        # Calculate statistics (only for contributor assignments)
        total_assignments = len(formatted_assignments)
        active_assignments = len([a for a in formatted_assignments if a["status"] == "in_progress"])
        total_reviews = len(formatted_reviews)
        
        # Calculate average rating
        ratings = [r["rating"] for r in formatted_reviews if r["rating"] is not None]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
        
        # Add detailed information for dispatchers and reviewers
        task_details.update({
            "assignments": formatted_assignments,
            "reviews": formatted_reviews,
            "assignments_count": total_assignments,
            "active_assignments": active_assignments,
            "reviews_count": total_reviews,
            "avg_rating": avg_rating,
            "num_people_working": active_assignments
        })
        
        logger.info(f"Returning detailed view with {len(formatted_assignments)} contributor assignments and {len(formatted_reviews)} reviews")
    else:
        logger.info("User is contributor - returning basic information only")
        
        # For contributors, only add basic statistics without sensitive details
        # Count only contributor assignments (exclude review assignments)
        assignments_count = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == task_id,
            TaskAssignment.assignment_type != 'review'
        ).count()
        active_assignments = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == task_id,
            TaskAssignment.status == 'in_progress',
            TaskAssignment.assignment_type != 'review'
        ).count()
        
        task_details.update({
            "assignments": [],  # Empty array for contributors
            "reviews": [],      # Empty array for contributors
            "assignments_count": assignments_count,
            "active_assignments": active_assignments,
            "reviews_count": 0,  # Don't reveal review count to contributors
            "avg_rating": 0,     # Don't reveal ratings to contributors
            "num_people_working": active_assignments
        })
        
        logger.info(f"Returning contributor view with basic stats only")
    
    logger.info(f"Task details keys: {list(task_details.keys())}")
    
    return task_details


