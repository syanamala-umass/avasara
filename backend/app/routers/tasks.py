from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import logging
import traceback
import sys
from datetime import datetime

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
    """
    Retrieve tasks that are available for review by the current user.
    
    This endpoint filters completed tasks based on the user's skills and returns
    tasks that match the user's skill set. Only tasks with status 'completed'
    are considered for review.
    
    Args:
        db (Session): Database session dependency
        current_user (User): Currently authenticated user
        
    Returns:
        List[TaskWithDetails]: List of tasks available for review, filtered by user skills
        
    Raises:
        HTTPException: If database query fails or user skills are invalid
    """
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
    """
    Create a new task in the system.
    
    This endpoint allows authenticated users to create new tasks with specified
    requirements, compensation, and skill requirements. The task is automatically
    associated with the current user as the creator.
    
    Args:
        task (TaskCreate): Task creation data including title, description, 
                          compensation, deadline, and skill requirements
        db (Session): Database session dependency
        current_user (User): Currently authenticated user (task creator)
        
    Returns:
        TaskWithDetails: Complete task information including all relationships
                        and computed fields like assignment counts
        
    Raises:
        HTTPException: If task creation fails or validation errors occur
    """
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
        "skill_review_requirements": db_task.skill_review_requirements,
        "category": "task",  # Default category for newly created tasks
        
        # Additional fields required by TaskWithDetails
        "skills": skills,
        "creator_name": db_task.user.username if db_task.user else "Unknown User",
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
    title: str = None,
    compensation_type: str = None,
    min_compensation: float = None,
    max_compensation: float = None,
    task_type: str = None,
    skill_id: int = None,
    min_skill_rating: float = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve a paginated list of tasks with optional filtering.
    
    This endpoint provides comprehensive task listing with support for filtering
    by status, creator, category, title search, compensation type and range,
    task type, and skill requirements. For review category, it automatically 
    excludes tasks where the current user is the original task completer.
    
    Args:
        request (Request): FastAPI request object for logging
        skip (int): Number of records to skip for pagination (default: 0)
        limit (int): Maximum number of records to return (default: 100)
        status (str, optional): Filter tasks by status (e.g., 'open', 'in_progress', 'completed')
        creator_id (int, optional): Filter tasks by specific creator ID
        category (str, optional): Filter by skill category ('Development', 'Design', 'Marketing', etc.)
        title (str, optional): Search in task title
        compensation_type (str, optional): Filter by compensation type ('cash', 'equity')
        min_compensation (float, optional): Minimum compensation amount
        max_compensation (float, optional): Maximum compensation amount
        task_type (str, optional): Filter by task type ('task' or 'review')
        skill_id (int, optional): Filter tasks by specific skill ID
        db (Session): Database session dependency
        current_user (User): Currently authenticated user
        
    Returns:
        List[TaskWithDetails]: List of tasks with complete details including
                              relationships, compensation, and statistics
        
    Raises:
        HTTPException: If database query fails or processing errors occur
    """
    try:
        # Log the full URL and query parameters
        logger.info(f"Request URL: {request.url}")
        logger.info(f"Query parameters: skip={skip}, limit={limit}, status={status}, creator_id={creator_id}, category={category}, title={title}, compensation_type={compensation_type}, min_compensation={min_compensation}, max_compensation={max_compensation}, task_type={task_type}, skill_id={skill_id}, min_skill_rating={min_skill_rating}")
        logger.info(f"Current user: {current_user.id}")
        
        # Get tasks with skills and user relationships loaded
        query = db.query(models.Task).options(
            joinedload(models.Task.skills),
            joinedload(models.Task.user)
        )
        
        # Apply filters
        if status:
            query = query.filter(models.Task.status == status)
        if creator_id:
            query = query.filter(models.Task.user_id == creator_id)
        if title:
            # Search in task title
            search_term = f"%{title}%"
            query = query.filter(models.Task.title.ilike(search_term))
            logger.info(f"Filtering tasks by title: {title}")
        if task_type and task_type != 'All':
            # Filter by task type (task or review)
            query = query.filter(models.Task.category == task_type)
            logger.info(f"Filtering tasks by task type: {task_type}")
        if category and category != 'All':
            # Filter by skill category
            category_skills = {
                'Development': ['programming', 'coding', 'software', 'development', 'frontend', 'backend', 'fullstack', 'react', 'python', 'javascript', 'java', 'node.js', 'database', 'api'],
                'Design': ['design', 'ui', 'ux', 'graphic', 'visual', 'illustration', 'photoshop', 'figma', 'sketch', 'prototyping', 'wireframing'],
                'Marketing': ['marketing', 'social media', 'content', 'seo', 'advertising', 'branding', 'campaign', 'analytics', 'growth'],
                'Research': ['research', 'analysis', 'data', 'survey', 'interview', 'market research', 'competitive analysis', 'user research'],
                'Operations': ['operations', 'management', 'coordination', 'planning', 'strategy', 'process', 'optimization', 'efficiency'],
                'Other': []
            }
            
            skill_names = category_skills.get(category, [])
            if skill_names:
                # Create OR conditions for skill names using subquery
                from sqlalchemy import exists, or_
                skill_conditions = []
                for skill_name in skill_names:
                    skill_conditions.append(models.Skill.name.ilike(f"%{skill_name}%"))
                
                if skill_conditions:
                    category_subquery = db.query(models.Task.id).join(
                        models.Task.skills
                    ).filter(or_(*skill_conditions)).subquery()
                    query = query.filter(exists().where(models.Task.id == category_subquery.c.id))
                    logger.info(f"Filtering tasks by skill category: {category}")
        
        # Handle skill_id filtering
        if skill_id:
            # Get the skill name for the selected skill_id
            selected_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
            if selected_skill:
                # Use a subquery to check both skills relationship and skill_review_requirements
                from sqlalchemy import exists, or_, and_
                
                # Check if task has the skill in its skills relationship OR in skill_review_requirements
                skill_subquery = db.query(models.Task.id).join(
                    models.Task.skills
                ).filter(
                    models.Skill.id == skill_id  # Skill in skills relationship
                ).subquery()
                query = query.filter(exists().where(models.Task.id == skill_subquery.c.id))
                logger.info(f"Filtering tasks by skill ID: {skill_id} (skill name: {selected_skill.name})")
            else:
                logger.warning(f"Skill with ID {skill_id} not found")
            
        # Handle min_skill_rating filtering
        if min_skill_rating is not None:
            logger.info(f"Filtering tasks by minimum skill rating: {min_skill_rating}")
            # This will be applied during the result processing phase
            # since we need to check the skill_review_requirements JSON field
            
        # Handle review tasks special case
        if task_type == 'review':
            # For review tasks, we want tasks that have submitted assignments
            # BUT exclude tasks where the current user is the original task completer
            query = query.join(models.TaskAssignment).filter(
                models.TaskAssignment.status == 'submitted',
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
                
                # Skip tasks with null user_id or created_at
                if task.user_id is None or task.created_at is None:
                    logger.warning(f"Skipping task {task.id} - missing user_id or created_at")
                    continue
                
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
                
                # Apply compensation filters
                if compensation_type and compensation_type != 'All':
                    if not compensation or compensation.compensation_type != compensation_type:
                        logger.info(f"Skipping task {task.id} - compensation type mismatch")
                        continue
                
                # Only apply min/max compensation filters for cash compensation
                if compensation_type == 'cash':
                    if min_compensation is not None:
                        if not compensation or compensation.amount < min_compensation:
                            logger.info(f"Skipping task {task.id} - below minimum compensation")
                            continue
                    
                    if max_compensation is not None:
                        if not compensation or compensation.amount > max_compensation:
                            logger.info(f"Skipping task {task.id} - above maximum compensation")
                            continue
                
                # Apply min_skill_rating filter
                if min_skill_rating is not None and skill_id is not None:
                    # Get the skill name for the selected skill_id
                    selected_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
                    
                    if selected_skill:
                        # First check if the task has the skill
                        has_skill = any(skill.id == skill_id for skill in task.skills)
                        if not has_skill:
                            logger.info(f"Skipping task {task.id} - doesn't have skill ID {skill_id}")
                            continue
                        
                        # Then check the rating requirement if it exists
                        if task.skill_review_requirements and selected_skill.name in task.skill_review_requirements:
                            skill_requirement = task.skill_review_requirements[selected_skill.name]
                            skill_requirement_float = float(skill_requirement)
                            
                            # If task requires a lower level than user specified, skip it
                            if skill_requirement_float < min_skill_rating:
                                logger.info(f"Skipping task {task.id} - skill {selected_skill.name} requires {skill_requirement_float} but user specified minimum {min_skill_rating}")
                                continue
                            else:
                                logger.info(f"Including task {task.id} - skill {selected_skill.name} requires {skill_requirement_float} which meets user minimum {min_skill_rating}")
                        else:
                            # If no specific requirement for this skill, include it (but only if it has the skill)
                            logger.info(f"Task {task.id} has skill {selected_skill.name} but no specific requirement - including it")
                            continue
                    else:
                        logger.warning(f"Skill with ID {skill_id} not found")
                        continue
                
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
                    "category": task.category,  # Use actual database value
                    "skill_review_requirements": task.skill_review_requirements,
                    
                    # Additional fields required by TaskWithDetails
                    "skills": skills,
                    "creator_name": task.user.username if task.user else "Unknown User",
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

@router.get("/recommended", response_model=List[TaskWithDetails])
def get_recommended_tasks(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get recommended tasks based on user's skills"""
    try:
        print(f"Getting recommended tasks for user {current_user.id}")
        
        # Get user's skills
        user_skills = current_user.skills
        
        print(f"User has {len(user_skills)} skills: {[skill.name for skill in user_skills]}")
        
        if not user_skills:
            # If user has no skills, return recent tasks
            print("User has no skills, returning recent tasks")
            tasks = db.query(models.Task).filter(
                models.Task.status == 'open'
            ).order_by(models.Task.created_at.desc()).limit(limit).all()
            print(f"Found {len(tasks)} recent tasks")
            
            # Convert to TaskWithDetails format
            result = []
            for task in tasks:
                try:
                    # Get compensation data
                    compensation = db.query(TaskCompensation).filter(
                        TaskCompensation.task_id == task.id,
                        TaskCompensation.amount_type == 'task'
                    ).first()
                    
                    # Format skills
                    skills = [{"id": skill.id, "name": skill.name} for skill in task.skills]
                    
                    task_dict = {
                        "id": task.id,
                        "user_id": task.user_id,
                        "title": task.title,
                        "description": task.description,
                        "compensation_type": compensation.compensation_type if compensation else None,
                        "compensation_amount": compensation.amount if compensation else None,
                        "deadline": task.deadline,
                        "created_at": task.created_at,
                        "status": task.status,
                        "category": task.category,
                        "skill_review_requirements": task.skill_review_requirements,
                        "skills": skills,
                        "creator_name": task.user.username if task.user else "Unknown User",
                        "creator_avatar": None,
                        "assignments_count": 0,
                        "reviews_count": 0,
                        "num_people_working": 0,
                        "has_assignment": False
                    }
                    result.append(task_dict)
                except Exception as e:
                    print(f"Error processing task {task.id}: {str(e)}")
                    continue
            
            return result
        
        # Get skill IDs from user's skills
        skill_ids = [skill.id for skill in user_skills]
        print(f"Looking for tasks with skill IDs: {skill_ids}")
        
        # Find tasks that require any of the user's skills using the task_skills association table
        from app.models.task import task_skill
        recommended_tasks = db.query(models.Task).join(
            task_skill
        ).filter(
            task_skill.c.skill_id.in_(skill_ids),
            models.Task.status == 'open'
        ).distinct().order_by(
            models.Task.created_at.desc()
        ).limit(limit).all()
        
        print(f"Found {len(recommended_tasks)} recommended tasks")
        
        # Convert to TaskWithDetails format
        result = []
        for task in recommended_tasks:
            try:
                print(f"Task: {task.title} (ID: {task.id})")
                
                # Get compensation data
                compensation = db.query(TaskCompensation).filter(
                    TaskCompensation.task_id == task.id,
                    TaskCompensation.amount_type == 'task'
                ).first()
                
                # Get assignments and reviews count
                assignments_count = db.query(TaskAssignment).filter(TaskAssignment.task_id == task.id).count()
                reviews_count = db.query(Review).filter(Review.task_id == task.id).count()
                num_people_working = db.query(TaskAssignment).filter(
                    TaskAssignment.task_id == task.id,
                    TaskAssignment.status == 'in_progress'
                ).count()
                
                # Format skills
                skills = [{"id": skill.id, "name": skill.name} for skill in task.skills]
                
                # Check if current user has an assignment for this task
                has_assignment = check_existing_assignment(task_id=task.id, user_id=current_user.id)
                
                task_dict = {
                    "id": task.id,
                    "user_id": task.user_id,
                    "title": task.title,
                    "description": task.description,
                    "compensation_type": compensation.compensation_type if compensation else None,
                    "compensation_amount": compensation.amount if compensation else None,
                    "deadline": task.deadline,
                    "created_at": task.created_at,
                    "status": task.status,
                    "category": task.category,
                    "skill_review_requirements": task.skill_review_requirements,
                    "skills": skills,
                    "creator_name": task.user.username if task.user else "Unknown User",
                    "creator_avatar": None,
                    "assignments_count": assignments_count,
                    "reviews_count": reviews_count,
                    "num_people_working": num_people_working,
                    "has_assignment": has_assignment
                }
                result.append(task_dict)
            except Exception as e:
                print(f"Error processing task {task.id}: {str(e)}")
                continue
        
        return result
    except Exception as e:
        print(f"Error in get_recommended_tasks: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error getting recommended tasks: {str(e)}")

@router.get("/{task_id}", response_model=TaskWithDetails)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve detailed information about a specific task.
    
    This endpoint returns comprehensive information about a single task including
    all relationships, compensation details, skill requirements, and whether
    the current user has an assignment for this task.
    
    Args:
        task_id (int): Unique identifier of the task to retrieve
        db (Session): Database session dependency
        current_user (User): Currently authenticated user
        
    Returns:
        TaskWithDetails: Complete task information with all relationships
                        and computed fields
        
    Raises:
        HTTPException: If task is not found (404) or database errors occur
    """
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
        "skill_review_requirements": db_task.skill_review_requirements,
        
        # Additional fields required by TaskWithDetails
        "skills": skills,
        "creator_name": db_task.user.username if db_task.user else "Unknown User",
        "creator_avatar": None,
        "assignments_count": assignments_count,
        "reviews_count": reviews_count,
        "num_people_working": num_people_working,
        "has_assignment": has_assignment
    }
    
    return task_response

@router.put("/{task_id}", response_model=Task)
def update_task_details(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Update an existing task's details.
    
    This endpoint allows task creators to modify their tasks. Only the original
    task creator can update task details.
    
    Args:
        task_id (int): Unique identifier of the task to update
        task (TaskUpdate): Updated task data
        db (Session): Database session dependency
        current_user (User): Currently authenticated user
        
    Returns:
        Task: Updated task information
        
    Raises:
        HTTPException: If task not found, user not authorized, or update fails
    """
    return update_task(db=db, task_id=task_id, task=task, user_id=current_user.id)

def assign_reviewers_randomly(db: Session, task_id: int, num_reviewers: int = 2):
    """
    Randomly assign reviewers to a completed task.
    
    This helper function selects random reviewers from eligible users
    (excluding the task completer) and creates Review records for them.
    
    Args:
        db (Session): Database session
        task_id (int): ID of the completed task
        num_reviewers (int): Number of reviewers to assign (default: 2)
        
    Returns:
        List[int]: List of assigned reviewer user IDs
        
    Raises:
        Exception: If task not found or no eligible reviewers available
    """
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
    """
    Mark a task as completed.
    
    This endpoint changes the task status to 'completed'. Note that this
    function no longer automatically assigns reviewers - that is handled
    by the peer evaluation system.
    
    Args:
        task_id (int): Unique identifier of the task to complete
        db (Session): Database session dependency
        
    Returns:
        dict: Success message confirming task completion
        
    Raises:
        HTTPException: If task not found or completion fails
    """
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
    """
    Delete a task from the system.
    
    This endpoint allows task creators to delete their tasks, but only if
    the task is still in 'open' status (not assigned or completed).
    
    Args:
        task_id (int): Unique identifier of the task to delete
        db (Session): Database session dependency
        current_user (User): Currently authenticated user
        
    Returns:
        None: 204 No Content on successful deletion
        
    Raises:
        HTTPException: If task not found, user not authorized, or task cannot be deleted
    """
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
    """
    Submit a completed task for peer review.
    
    This endpoint allows contributors to submit their completed work for review.
    The task assignment status changes from 'in_progress' to 'submitted', and
    peer evaluations are automatically created for review.
    
    Args:
        task_id (int): Unique identifier of the task being submitted
        files (List[UploadFile], optional): Files submitted with the task
        notes (str, optional): Additional notes about the submission
        db (Session): Database session dependency
        current_user (User): Currently authenticated user (task contributor)
        
    Returns:
        dict: Success message and submission status
        
    Raises:
        HTTPException: If task not found, no active assignment, or submission fails
    """
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
        # Update assignment status to submitted
        assignment.status = 'submitted'
        assignment.notes = notes or 'Task submitted for review'
        assignment.submitted_at = datetime.utcnow()
        
        # Save files if provided
        if files:
            # TODO: Implement file storage logic
            # For now, just store file names
            assignment.submission_files = [file.filename for file in files]

        db.commit()
        
        return {
            "message": "Task submitted successfully. Peer evaluations will be created automatically.",
            "status": "submitted"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}/details")
def get_task_details(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get comprehensive task details with role-based access control.
    
    This endpoint provides detailed task information with different levels of
    detail based on the user's role:
    - Dispatchers (task creators): Full access to all assignments and reviews
    - Reviewers: Access to assignments and reviews for tasks they're reviewing
    - Contributors: Access to their own assignments and related reviews
    - Other users: Basic task information only
    
    Args:
        task_id (int): Unique identifier of the task
        db (Session): Database session dependency
        current_user (User): Currently authenticated user
        
    Returns:
        dict: Task details with role-appropriate information including:
              - Basic task info (all users)
              - Assignments and reviews (role-based)
              - Statistics and metrics (role-based)
              - User relationship indicators
        
    Raises:
        HTTPException: If task not found or database errors occur
    """
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
    
    # Check if current user is a contributor who submitted this task
    contributor_assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.user_id == current_user.id,
        TaskAssignment.assignment_type == 'task'
    ).first()
    is_contributor = contributor_assignment is not None
    logger.info(f"User is contributor: {is_contributor}")
    
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
        
        # Skills and skill requirements
        "skills": skills,
        "skill_review_requirements": db_task.skill_review_requirements,
        
        # Additional metadata
        "has_assignment": check_existing_assignment(task_id=task_id, user_id=current_user.id)
    }
    
    # If user is the dispatcher, reviewer, or contributor, add detailed information
    if is_dispatcher or is_reviewer or is_contributor:
        logger.info(f"User is dispatcher ({is_dispatcher}), reviewer ({is_reviewer}), or contributor ({is_contributor}) - adding detailed information")
        
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
                "created_at": review.created_at
            })
        
        # Calculate statistics (only for contributor assignments)
        total_assignments = len(formatted_assignments)
        active_assignments = len([a for a in formatted_assignments if a["status"] == "in_progress"])
        total_reviews = len(formatted_reviews)
        
        # Calculate approval rate instead of average rating
        approved_reviews = len([r for r in formatted_reviews if r["is_approved"]])
        approval_rate = round((approved_reviews / total_reviews) * 100, 1) if total_reviews > 0 else 0
        
        # Add detailed information for dispatchers, reviewers, and contributors
        task_details.update({
            "assignments": formatted_assignments,
            "reviews": formatted_reviews,
            "assignments_count": total_assignments,
            "active_assignments": active_assignments,
            "reviews_count": total_reviews,
            "approval_rate": approval_rate,
            "num_people_working": active_assignments
        })
        
        logger.info(f"Returning detailed view with {len(formatted_assignments)} contributor assignments and {len(formatted_reviews)} reviews")
    else:
        logger.info("User is not dispatcher, reviewer, or contributor - returning basic information only")
        
        # For other users, only add basic statistics without sensitive details
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
            "assignments": [],  # Empty array for other users
            "reviews": [],      # Empty array for other users
            "assignments_count": assignments_count,
            "active_assignments": active_assignments,
            "reviews_count": 0,  # Don't reveal review count to other users
            "approval_rate": 0,   # Don't reveal approval rate to other users
            "num_people_working": active_assignments
        })
        
        logger.info(f"Returning basic view for other users")
    
    logger.info(f"Task details keys: {list(task_details.keys())}")
    
    return task_details

@router.get("/{task_id}/review-submissions")
def get_review_submissions(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all review submissions for a specific task.
    
    This endpoint retrieves all submitted assignments for a task along with
    their associated reviews. This is useful for dispatchers and reviewers
    to see the complete review status of all submissions.
    
    Args:
        task_id (int): Unique identifier of the task
        db (Session): Database session dependency
        current_user (User): Currently authenticated user
        
    Returns:
        dict: Task information and list of submissions with their reviews,
              including submission metadata and review details
        
    Raises:
        HTTPException: If task not found or database errors occur
    """
    # Get the task
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get all assignments for this task that are submitted for review
    assignments = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.status == "submitted"
    ).all()
    
    # Get all reviews for this task
    reviews = db.query(models.Review).filter(
        models.Review.task_id == task_id
    ).all()
    
    # Format the response
    submissions = []
    for assignment in assignments:
        # Get the user who submitted this assignment
        user = db.query(models.User).filter(models.User.id == assignment.user_id).first()
        
        # Get reviews for this specific assignment
        assignment_reviews = [r for r in reviews if r.assignment_id == assignment.id]
        
        submission = {
            "assignment_id": assignment.id,
            "user_id": assignment.user_id,
            "user_name": user.username if user else "Unknown User",
            "submitted_at": assignment.submitted_at,
            "notes": assignment.notes,
            "submission_files": assignment.submission_files,
            "reviews": [
                {
                    "id": review.id,
                    "reviewer_id": review.reviewer_id,
                    "reviewer_name": db.query(models.User).filter(models.User.id == review.reviewer_id).first().username if db.query(models.User).filter(models.User.id == review.reviewer_id).first() else "Unknown Reviewer",
                    "is_approved": review.is_approved,
                    "feedback": review.feedback,
                    "created_at": review.created_at
                }
                for review in assignment_reviews
            ],
            "review_count": len(assignment_reviews)
        }
        submissions.append(submission)
    
    return {
        "task_id": task_id,
        "task_title": task.title,
        "submissions": submissions,
        "total_submissions": len(submissions),
        "total_reviews": len(reviews)
    }


