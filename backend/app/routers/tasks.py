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



@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_new_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    print("=== Task Creation Debug ===")
    print(f"Current user: {current_user}")
    print(f"Task data: {task}")
    
    # Create task with user_id
    return create_task(db=db, task=task, user_id=current_user.id)


@router.get("/", response_model=List[TaskWithDetails])
def read_tasks(
    request: Request,
    skip: int = 0, 
    limit: int = 100, 
    status: str = None, 
    creator_id: int = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    try:
        # Log the full URL and query parameters
        logger.info(f"Request URL: {request.url}")
        logger.info(f"Query parameters: skip={skip}, limit={limit}, status={status}, creator_id={creator_id}, category={category}")
        
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
            query = query.join(models.TaskAssignment).filter(
                models.TaskAssignment.status == 'submitted_for_review'
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
    logger.info(f"Task num_reviewers required: {task.num_reviewers}")

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
    logger.info(f"Assignment user_id (who did the work): {assignment.user_id}")
    logger.info(f"Current user_id (who is reviewing): {current_user.id}")

    try:
        # Log existing reviews before creating new one
        existing_reviews = db.query(models.Review).filter(
            models.Review.task_id == task_id
        ).all()
        logger.info(f"Existing reviews count before adding new review: {len(existing_reviews)}")
        for i, existing_review in enumerate(existing_reviews):
            logger.info(f"  Review {i+1}: ID={existing_review.id}, reviewer_id={existing_review.reviewer_id}, rating={existing_review.rating}")

        # Create review
        review = models.Review(
            task_id=task_id,
            assignment_id=assignment.id,
            user_id=assignment.user_id,
            reviewer_id=current_user.id,
            rating=review_data.get('rating'),
            comment=review_data.get('feedback')
        )
        db.add(review)
        logger.info(f"New review created: rating={review.rating}, comment_length={len(review.comment) if review.comment else 0}")

        # Update assignment status
        old_assignment_status = assignment.status
        assignment.status = 'reviewed'
        logger.info(f"Assignment status updated: {old_assignment_status} -> {assignment.status}")
        
        # Check if all required reviews have been submitted
        num_reviews = db.query(models.Review).filter(
            models.Review.task_id == task_id
        ).count()
        
        logger.info(f"Review count query result: {num_reviews}")
        logger.info(f"Required reviews: {task.num_reviewers}")
        logger.info(f"Logic check: {num_reviews}+1 >= {task.num_reviewers} = {num_reviews+1 >= task.num_reviewers}")
        
        # Only mark task as reviewed if we have all required reviews
        old_task_status = task.status
        if task.num_reviewers and num_reviews+1 >= task.num_reviewers:
            task.status = 'completed'
            logger.info(f"Task status updated: {old_task_status} -> {task.status} (all reviews submitted)")
        else:
            task.status = 'submitted_for_review'
            logger.info(f"Task status updated: {old_task_status} -> {task.status} (more reviews needed)")

        db.commit()
        logger.info("Database changes committed successfully")
        
        # Verify final state after commit
        final_review_count = db.query(models.Review).filter(
            models.Review.task_id == task_id
        ).count()
        logger.info(f"Final review count after commit: {final_review_count}")
        
        # Log all reviews after commit for verification
        all_reviews_after = db.query(models.Review).filter(
            models.Review.task_id == task_id
        ).all()
        logger.info(f"All reviews after commit:")
        for i, review_after in enumerate(all_reviews_after):
            logger.info(f"  Review {i+1}: ID={review_after.id}, reviewer_id={review_after.reviewer_id}, rating={review_after.rating}")
        
        logger.info(f"=== Review submission completed successfully ===")
        
        return {
            "message": "Review submitted successfully",
            "status": task.status,
            "reviews_submitted": num_reviews,
            "reviews_required": task.num_reviewers
        }
    except Exception as e:
        logger.error(f"Error during review submission: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


