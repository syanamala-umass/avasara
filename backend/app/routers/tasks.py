from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import logging
import traceback
import sys
from datetime import datetime

from app.models.task_assignment import TaskAssignment
# from app.models.review import Review  # Remove this import
from app.models.review_task import ReviewTask
from app.database import get_db
from app.schemas.task import TaskCreate, Task, TaskUpdate, TaskWithDetails
from app.crud.task import create_task, get_task, get_tasks, update_task
from app.crud.task_assignment import check_existing_assignment
from app.dependencies import get_current_user
import random
from app import models
from app.database.connection import get_db_cursor
from sqlalchemy import text

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
    from app.models.task import Task
    # Fetch all completed tasks
    tasks = db.query(Task).filter(Task.status == 'completed').all()
    
    # Get current user's skills
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
    # No longer using TaskCompensation table, using JSON compensation field instead

    # Return matching tasks
    return [
        {
            "id": task.id,
            "user_id": task.user_id,
            "title": task.title,
            "description": task.description,
            "compensation": task.compensation,  # Use JSON compensation field directly
            "deadline": task.deadline,
            "created_at": task.created_at,
            "status": task.status,
            "skills": task.skills,
            "startup_name": task.startup.name if task.startup else "",
            "startup_logo": task.startup.logo if task.startup else None,
            "assignments_count": db.query(TaskAssignment).filter(TaskAssignment.task_id == task.id).count(),
            "reviews_count": db.query(ReviewTask).filter(ReviewTask.parent_task_id == task.id).count()
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
    # Create task with user_id
    db_task = create_task(db=db, task=task, user_id=current_user.id)
    # Set category from primary skill
    db_task.set_category_from_skills()
    db.commit()
    db.refresh(db_task)
    
    # Get task assignments count
    assignments_count = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == db_task.id
    ).count()
    
    # Get reviews count
    reviews_count = db.query(ReviewTask).filter(
        ReviewTask.parent_task_id == db_task.id
    ).count()

    # Get number of people currently working on the task
    num_people_working = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == db_task.id,
        TaskAssignment.status == 'in_progress'
    ).count()
    
    # No longer using TaskCompensation table, using JSON compensation field instead

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
        "compensation": db_task.compensation,  # Use JSON compensation field
        "deadline": db_task.deadline,
        "created_at": db_task.created_at,
        "status": db_task.status,
        "skill_review_requirements": db_task.skill_review_requirements,
        "category": db_task.category,
        "type": "task",  # Add type field for consistency
        "task_duration": db_task.task_duration,  # Add task_duration field
        
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
        logger.info(f"=== TASKS ENDPOINT DEBUG ===")
        logger.info(f"Request URL: {request.url}")
        logger.info(f"Query parameters: skip={skip}, limit={limit}, status={status}, creator_id={creator_id}, category={category}, title={title}, compensation_type={compensation_type}, min_compensation={min_compensation}, max_compensation={max_compensation}, task_type={task_type}, skill_id={skill_id}, min_skill_rating={min_skill_rating}")
        logger.info(f"Current user: {current_user.id}")
        
        # Build filter conditions for both tasks and review_tasks
        filters = []
        if status:
            filters.append(f"t.status = '{status}'")
        if creator_id:
            filters.append(f"user_id = {creator_id}")
        if title:
            filters.append(f"t.title ILIKE '%{title}%' ")
        if category and category != 'All':
            # For minimal change, just filter on category string
            filters.append(f"category = '{category}'")
        # Compensation filters will be applied in Python after fetching
        # Skill filters will be applied in Python after fetching

        filter_sql = " AND ".join(filters)
        if filter_sql:
            filter_sql = " AND " + filter_sql
        
        logger.info(f"Filter SQL: {filter_sql}")

        # Main tasks query
        tasks_sql = f'''
            SELECT
                t.id,
                t.user_id,
                u.username AS creator_name,
                t.title,
                t.description,
                t.deadline,
                t.created_at,
                t.status,
                t.category,
                t.compensation,
                t.skill_review_requirements,
                'task' as type,
                COALESCE(
                    json_agg(json_build_object('id', s.id, 'name', s.name)) FILTER (WHERE s.id IS NOT NULL), '[]'
                ) as skills
            FROM tasks t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN task_skills ts ON t.id = ts.task_id
            LEFT JOIN skills s ON ts.skill_id = s.id
            WHERE 1=1 {filter_sql}
            GROUP BY t.id, u.username
        '''

        # Review tasks query - group by assignment to show only one review task per submission
        # Exclude review tasks where current user is the original contributor
        # For review_sql, filter_sql may contain t.status, so we need to replace it with rt.status
        review_filter_sql = filter_sql.replace('t.status', 'rt.status')
        review_sql = f'''
            SELECT 
                rt.id,
                t.user_id,
                t.creator_name,
                t.title,
                t.description,
                t.deadline,
                rt.created_at,
                rt.status,
                t.category,
                t.compensation,
                t.skill_review_requirements as skill_review_requirements,
                'review' as type,
                t.skills
            FROM (
                SELECT DISTINCT ON (rt.assignment_being_reviewed_id)
                    rt.id,
                    rt.assignment_being_reviewed_id,
                    rt.created_at,
                    rt.status
                FROM review_tasks rt
                JOIN task_assignments ta ON rt.assignment_being_reviewed_id = ta.id
                WHERE ta.user_id != :current_user_id
                  AND rt.status = 'open'
                ORDER BY rt.assignment_being_reviewed_id, rt.created_at DESC
            ) rt_distinct
            JOIN review_tasks rt ON rt.id = rt_distinct.id
            JOIN (SELECT
                    t.id as task_id,
                    t.user_id,
                    u.username AS creator_name,
                    t.title,
                    t.description,
                    t.deadline,
                    t.category,
                    t.compensation,
                    t.skill_review_requirements,
                    COALESCE(
                        json_agg(json_build_object('id', s.id, 'name', s.name)) FILTER (WHERE s.id IS NOT NULL), '[]'
                    ) as skills
                FROM tasks t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN task_skills ts ON t.id = ts.task_id
                LEFT JOIN skills s ON ts.skill_id = s.id
                GROUP BY t.id, u.username) t ON rt.parent_task_id = t.task_id
            WHERE 1=1 {review_filter_sql}
        '''

        # Apply task_type filter to union logic
        union_sql = None
        query_params = {"limit": limit, "skip": skip, "current_user_id": current_user.id}
        
        logger.info(f"Task type: {task_type}")
        logger.info(f"Query params: {query_params}")
        
        if task_type == 'task':
            union_sql = f"{tasks_sql} ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
        elif task_type == 'review':
            union_sql = f"{review_sql} ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
        else:
            union_sql = f"{tasks_sql} UNION ALL {review_sql} ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
        
        logger.info(f"Union SQL: {union_sql}")
        logger.info(f"About to execute query...")
        
        results = db.execute(text(union_sql), query_params).fetchall()
        
        logger.info(f"Query executed successfully, got {len(results)} results")

        # Convert results to list of dicts
        logger.info(f"Converting results to dicts...")
        result = [dict(row._mapping) for row in results]
        logger.info(f"Converted {len(result)} results to dicts")

        # Ensure every task has a 'type' field
        for task in result:
            if 'type' not in task:
                # Fallback: if coming from tasks table, set to 'task'; if from review_tasks, set to 'review'
                # Try to infer from presence of certain fields
                if 'parent_task_id' in task or 'assignment_being_reviewed_id' in task:
                    task['type'] = 'review'
                else:
                    task['type'] = 'task'

        # Filter out tasks missing required fields
        from datetime import datetime
        logger.info(f"Filtering tasks for missing fields...")
        filtered_result = []
        for i, task in enumerate(result):
            logger.info(f"Processing task {i+1}/{len(result)}: {task.get('id')} - {task.get('title', 'No title')}")
            if task.get('user_id') is None:
                logger.warning(f"Task {task.get('id')} missing user_id, setting to -1")
                task['user_id'] = -1
            if task.get('created_at') is None:
                logger.warning(f"Task {task.get('id')} missing created_at, setting to 1970-01-01T00:00:00Z")
                task['created_at'] = datetime(1970, 1, 1)
            if not task.get('creator_name'):
                logger.warning(f"Task {task.get('id')} missing creator_name, setting to 'Unknown User'")
                task['creator_name'] = 'Unknown User'
            filtered_result.append(task)
        
        logger.info(f"Filtered {len(filtered_result)} tasks")

        # DEBUG: Log the first returned task
        # if filtered_result:
        #     logger.info(f"First returned task: {filtered_result[0]}")

        # Apply compensation and skill filters in Python (if needed)
        # ... (existing logic for compensation_type, min_compensation, max_compensation, skill_id, min_skill_rating) ...

        # Populate skills for each task as a list of objects with id and name
        

        logger.info(f"=== TASKS ENDPOINT COMPLETED ===")
        logger.info(f"Returning {len(filtered_result)} tasks")
        return filtered_result
    except Exception as e:
        logger.error(f"=== TASKS ENDPOINT ERROR ===")
        logger.error(f"Error in read_tasks: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
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
        # print(f"Getting recommended tasks for user {current_user.id}")
        
        # Get user's skills using direct SQL query
        from sqlalchemy import text
        user_skills_query = text("""
            SELECT s.id, s.name, cs.rating
            FROM skills s
            JOIN contributor_skill cs ON s.id = cs.skill_id
            WHERE cs.user_id = :user_id
        """)
        
        user_skills_result = db.execute(user_skills_query, {"user_id": current_user.id})
        user_skills = [{"id": row.id, "name": row.name, "rating": row.rating} for row in user_skills_result]
        
        # print(f"User has {len(user_skills)} skills: {[skill['name'] for skill in user_skills]}")
        
        if not user_skills:
            # If user has no skills, return recent tasks
            # print("User has no skills, returning recent tasks")
            tasks = db.query(models.Task).filter(
                models.Task.status == 'open'
            ).order_by(models.Task.created_at.desc()).limit(limit).all()
            # print(f"Found {len(tasks)} recent tasks")
            # Convert to TaskWithDetails format
            result = []
            for task in tasks:
                try:
                    # Get compensation data
                    compensation = task.compensation
                    # Format skills
                    skills = [{"id": skill.id, "name": skill.name} for skill in task.skills]
                    task_dict = {
                        "id": task.id,
                        "user_id": task.user_id,
                        "title": task.title,
                        "description": task.description,
                        "compensation": compensation,  # Use JSON compensation field
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
                        "has_assignment": False,
                        "matching_skills_count": 0
                    }
                    result.append(task_dict)
                except Exception as e:
                    # print(f"Error processing task {task.id}: {str(e)}")
                    continue
            return result
        
        # Get skill IDs from user's skills
        skill_ids = [skill['id'] for skill in user_skills]
        # print(f"Looking for tasks with skill IDs: {skill_ids}")
        
        # Find tasks that require any of the user's skills using direct SQL query
        recommended_tasks_query = text("""
            SELECT t.id, t.user_id, t.title, t.description, t.task_duration, 
                   t.created_at, t.status, t.num_reviewers, t.max_parallel_contributors,
                   t.category,
                   COUNT(ts.skill_id) AS matching_skills_count
            FROM tasks t
            JOIN task_skills ts ON t.id = ts.task_id
            WHERE ts.skill_id = ANY(:skill_ids)
            AND t.status = 'open'
            GROUP BY t.id, t.user_id, t.title, t.description, t.task_duration, t.created_at, t.status, t.num_reviewers, t.max_parallel_contributors, t.category
            ORDER BY matching_skills_count DESC, t.created_at DESC
            LIMIT :limit
        """)
        
        recommended_tasks_result = db.execute(recommended_tasks_query, {
            "skill_ids": skill_ids,
            "limit": limit
        })
        
        # Convert to Task objects for consistency
        recommended_tasks = []
        for row in recommended_tasks_result:
            task = models.Task()
            task.id = row.id
            task.user_id = row.user_id
            task.title = row.title
            task.description = row.description
            task.task_duration = row.task_duration
            task.created_at = row.created_at
            task.status = row.status
            task.num_reviewers = row.num_reviewers
            task.max_parallel_contributors = row.max_parallel_contributors
            task.category = row.category
            task.matching_skills_count = row.matching_skills_count
            recommended_tasks.append(task)
        
        # print(f"Found {len(recommended_tasks)} skill-matching tasks")
        
        # If we don't have enough skill-matching tasks, fill with other open tasks
        if len(recommended_tasks) < limit:
            remaining_limit = limit - len(recommended_tasks)
            
            # Get additional open tasks that don't match user's skills
            additional_tasks_query = text("""
                SELECT DISTINCT t.id, t.user_id, t.title, t.description, t.task_duration, 
                       t.created_at, t.status, t.num_reviewers, t.max_parallel_contributors,
                       t.category, 0 as matching_skills_count
                FROM tasks t
                LEFT JOIN task_skills ts ON t.id = ts.task_id
                WHERE t.status = 'open'
                AND (ts.skill_id IS NULL OR ts.skill_id != ALL(:skill_ids))
                AND t.id NOT IN (
                    SELECT DISTINCT t2.id 
                    FROM tasks t2 
                    JOIN task_skills ts2 ON t2.id = ts2.task_id 
                    WHERE ts2.skill_id = ANY(:skill_ids)
                )
                ORDER BY t.created_at DESC
                LIMIT :remaining_limit
            """)
            
            additional_tasks_result = db.execute(additional_tasks_query, {
                "skill_ids": skill_ids,
                "remaining_limit": remaining_limit
            })
            
            # Add additional tasks to the list
            for row in additional_tasks_result:
                task = models.Task()
                task.id = row.id
                task.user_id = row.user_id
                task.title = row.title
                task.description = row.description
                task.task_duration = row.task_duration
                task.created_at = row.created_at
                task.status = row.status
                task.num_reviewers = row.num_reviewers
                task.max_parallel_contributors = row.max_parallel_contributors
                task.category = row.category
                task.matching_skills_count = row.matching_skills_count
                recommended_tasks.append(task)
            
            # print(f"Added {remaining_limit} additional tasks, total: {len(recommended_tasks)}")
        
        # Convert to TaskWithDetails format
        result = []
        for task in recommended_tasks:
            try:
                # Check for required fields
                # if task.user_id is None or task.created_at is None:
                #     print(f"Skipping task {task.id} due to missing user_id or created_at")
                #     continue
                # print(f"Task: {task.title} (ID: {task.id})")
                
                # Get compensation data using direct SQL
                compensation_query = text("""
                    SELECT compensation FROM tasks WHERE id = :task_id
                """)
                compensation_result = db.execute(compensation_query, {"task_id": task.id}).first()
                compensation = compensation_result.compensation if compensation_result else None
                
                # Get assignments and reviews count
                assignments_count = db.query(TaskAssignment).filter(TaskAssignment.task_id == task.id).count()
                reviews_count = db.query(ReviewTask).filter(ReviewTask.parent_task_id == task.id).count()
                num_people_working = db.query(TaskAssignment).filter(
                    TaskAssignment.task_id == task.id,
                    TaskAssignment.status == 'in_progress'
                ).count()
                
                # Get task skills using direct SQL
                task_skills_query = text("""
                    SELECT s.id, s.name
                    FROM skills s
                    JOIN task_skills ts ON s.id = ts.skill_id
                    WHERE ts.task_id = :task_id
                """)
                task_skills_result = db.execute(task_skills_query, {"task_id": task.id})
                skills = [{"id": row.id, "name": row.name} for row in task_skills_result]
                
                # Get creator name using direct SQL
                creator_query = text("""
                    SELECT username FROM users WHERE id = :user_id
                """)
                creator_result = db.execute(creator_query, {"user_id": task.user_id}).first()
                creator_name = creator_result.username if creator_result else "Unknown User"
                
                # Check if current user has an assignment for this task
                has_assignment = check_existing_assignment(task_id=task.id, user_id=current_user.id)
                
                task_dict = {
                    "id": task.id,
                    "user_id": task.user_id,
                    "title": task.title,
                    "description": task.description,
                    "compensation": compensation,  # Use JSON compensation field
                    "deadline": task.deadline,
                    "created_at": task.created_at,
                    "status": task.status,
                    "category": task.category,
                    "skill_review_requirements": None,  # Skip JSON field to avoid issues
                    "skills": skills,
                    "creator_name": creator_name,
                    "creator_avatar": None,
                    "assignments_count": assignments_count,
                    "reviews_count": reviews_count,
                    "num_people_working": num_people_working,
                    "has_assignment": has_assignment,
                    "matching_skills_count": task.matching_skills_count
                }
                result.append(task_dict)
            except Exception as e:
                # print(f"Error processing task {task.id}: {str(e)}")
                continue
        
        return result
    except Exception as e:
        # print(f"Error in get_recommended_tasks: {str(e)}")
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
    reviews_count = db.query(ReviewTask).filter(
        ReviewTask.parent_task_id == task_id
    ).count()

    # Get number of people currently working on the task
    num_people_working = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.status == 'in_progress'
    ).count()
    
    # No longer using TaskCompensation table, using JSON compensation field instead

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
        "compensation": db_task.compensation,  # Use JSON compensation field directly
        "deadline": db_task.deadline,
        "created_at": db_task.created_at,
        "status": db_task.status,
        "skill_review_requirements": db_task.skill_review_requirements,
        "task_duration": db_task.task_duration,  # Add task_duration field
        
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
    # Get the task with relationships loaded
    db_task = db.query(models.Task).options(
        joinedload(models.Task.skills),
        joinedload(models.Task.user)
    ).filter(models.Task.id == task_id).first()
    
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if current user is the task creator (dispatcher)
    is_dispatcher = db_task.user_id == current_user.id
    # logger.info(f"User is dispatcher: {is_dispatcher}")
    
    # Check if current user is assigned as a reviewer for this task
    user_assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.user_id == current_user.id,
        TaskAssignment.assignment_type == 'review'
    ).first()
    is_reviewer = user_assignment is not None
    # logger.info(f"User is reviewer: {is_reviewer}")
    
    # Check if current user is a contributor who submitted this task
    contributor_assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.user_id == current_user.id,
        TaskAssignment.assignment_type == 'task'
    ).first()
    is_contributor = contributor_assignment is not None
    # logger.info(f"User is contributor: {is_contributor}")
    
    # Get task compensations
    # No longer using TaskCompensation table, using JSON compensation field instead
    
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
        "category":  db_task.category,
        "type": "task",  # Add type field for consistency
        "created_at": db_task.created_at,
        "deadline": db_task.deadline,
        "creator_name": db_task.user.username if db_task.user else "Unknown Creator",
        
        # Compensation
        "compensation": db_task.compensation,
        
        # Task configuration
        "num_reviewers": db_task.num_reviewers,
        "max_parallel_contributors": db_task.max_parallel_contributors,
        "task_duration": db_task.task_duration,  # Add task_duration field
        
        # Skills and skill requirements
        "skills": skills,
        "skill_review_requirements": db_task.skill_review_requirements,
        
        # Additional metadata
        "has_assignment": check_existing_assignment(task_id=task_id, user_id=current_user.id)
    }
    
    # If user is the dispatcher, reviewer, or contributor, add detailed information
    if is_dispatcher or is_reviewer or is_contributor:
        # logger.info(f"User is dispatcher ({is_dispatcher}), reviewer ({is_reviewer}), or contributor ({is_contributor}) - adding detailed information")
        
        # Get all assignments for this task (excluding review assignments)
        assignments = db.query(TaskAssignment).options(
            joinedload(TaskAssignment.user)
        ).filter(
            TaskAssignment.task_id == task_id,
            TaskAssignment.assignment_type != 'review'  # Only show contributor assignments
        ).all()
        
        # logger.info(f"Found {len(assignments)} contributor assignments for task {task_id}")
        
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
        
        # Get all review tasks for this parent task
        from app.models.review_task import ReviewTask, ReviewTaskAssignment
        review_task_ids = db.query(ReviewTask.id).filter(
            ReviewTask.parent_task_id == db_task.id
        ).all()
        review_task_ids = [row.id for row in review_task_ids]

        reviews = []
        if review_task_ids:
            review_assignments = db.query(ReviewTaskAssignment).filter(
                ReviewTaskAssignment.review_task_id.in_(review_task_ids),
                ReviewTaskAssignment.status == 'completed'
            ).all()
            for ra in review_assignments:
                reviews.append({
                    "id": ra.id,
                    "reviewer_id": ra.reviewer_id,
                    "reviewer_name": ra.reviewer.username if ra.reviewer else "Unknown Reviewer",
                    "is_approved": ra.accept_reject,
                    "feedback": ra.additional_comments,  # This is already included, ensure frontend uses it
                    "created_at": ra.completed_at
                })

        formatted_reviews = reviews
        total_reviews = len(formatted_reviews)
        approved_reviews = len([r for r in formatted_reviews if r["is_approved"]])
        approval_rate = round((approved_reviews / total_reviews) * 100, 1) if total_reviews > 0 else 0
        
        # Add review status information for contributors and task creators
        review_status = {}
        if is_contributor and contributor_assignment:
            # Check if review tasks have been created for this contributor's submission
            review_tasks_created = db.query(ReviewTask).filter(
                ReviewTask.assignment_being_reviewed_id == contributor_assignment.id
            ).count()
            
            # Count completed review assignments for all review tasks for this submission
            from app.models.review_task import ReviewTaskAssignment
            review_task_ids = db.query(ReviewTask.id).filter(
                ReviewTask.assignment_being_reviewed_id == contributor_assignment.id
            ).all()
            review_task_ids = [row.id for row in review_task_ids]
            review_submissions = 0
            if review_task_ids:
                review_submissions = db.query(ReviewTaskAssignment).filter(
                    ReviewTaskAssignment.review_task_id.in_(review_task_ids),
                    ReviewTaskAssignment.status == 'completed'
                ).count()
            
            review_status = {
                "review_tasks_created": review_tasks_created > 0,
                "review_tasks_count": review_tasks_created,
                "review_submissions_received": review_submissions,
                "expected_reviewers": db_task.num_reviewers or 2,
                "review_progress": f"{review_submissions}/{db_task.num_reviewers or 2} reviews received"
            }
        elif is_dispatcher:
            # For task creators, show review status for all submitted assignments to this task
            all_submitted_assignments = db.query(TaskAssignment).options(
                joinedload(TaskAssignment.user)
            ).filter(
                TaskAssignment.task_id == task_id,
                TaskAssignment.assignment_type == 'task',
                TaskAssignment.status == 'submitted'
            ).all()
            
            all_review_status = []
            for assignment in all_submitted_assignments:
                # Check if review tasks have been created for this assignment
                review_tasks_created = db.query(ReviewTask).filter(
                    ReviewTask.assignment_being_reviewed_id == assignment.id
                ).count()
                
                # Check if any reviewers have submitted their reviews
                review_submissions = db.query(models.Review).filter(
                    models.Review.assignment_id == assignment.id
                ).count()
                
                assignment_review_status = {
                    "assignment_id": assignment.id,
                    "contributor_name": assignment.user.username if assignment.user else "Unknown User",
                    "review_tasks_created": review_tasks_created > 0,
                    "review_tasks_count": review_tasks_created,
                    "review_submissions_received": review_submissions,
                    "expected_reviewers": db_task.num_reviewers or 2,
                    "review_progress": f"{review_submissions}/{db_task.num_reviewers or 2} reviews received"
                }
                all_review_status.append(assignment_review_status)
            
            review_status = {
                "all_submissions": all_review_status,
                "total_submissions": len(all_submitted_assignments),
                "submissions_with_reviews": len([rs for rs in all_review_status if rs["review_tasks_created"]])
            }
        
        # Add detailed information for dispatchers, reviewers, and contributors
        total_assignments = len(formatted_assignments)
        active_assignments = len([a for a in formatted_assignments if a["status"] == "in_progress"])
        task_details.update({
            "assignments": formatted_assignments,
            "reviews": formatted_reviews,
            "assignments_count": total_assignments,
            "active_assignments": active_assignments,
            "reviews_count": total_reviews,
            "approval_rate": approval_rate,
            "num_people_working": active_assignments,
            "review_status": review_status
        })
        
        # logger.info(f"Returning detailed view with {len(formatted_assignments)} contributor assignments and {len(formatted_reviews)} reviews")
    else:
        # logger.info("User is not dispatcher, reviewer, or contributor - returning basic information only")
        
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
        
        # logger.info(f"Returning basic view for other users")
    
    # logger.info(f"Task details keys: {list(task_details.keys())}")
    
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

# @router.get("/public", response_model=List[TaskWithDetails])
# def get_public_tasks(
#     request: Request,
#     skip: int = 0, 
#     limit: int =100, 
#     status: str = None, 
#     creator_id: int = None,
#     category: str = None,
#     title: str = None,
#     compensation_type: str = None,
#     min_compensation: float = None,
#     max_compensation: float = None,
#     task_type: str = None,
#     skill_id: int = None,
#     min_skill_rating: float = None,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get public tasks without authentication.
    
#     This endpoint returns tasks that are available for public viewing,
#     without user-specific functionality like capability checks.
#     """
#     with get_db_cursor() as cursor:
#         # Build the base query
#         query = """
#             SELECT DISTINCT t.*, 
#                    u.username as creator_name,
#                    s.name as startup_name,
#                    s.logo as startup_logo,
#                    tc_task.compensation_type as task_compensation_type,
#                    tc_task.amount as task_compensation_amount,
#                    tc_review.compensation_type as review_compensation_type,
#                    tc_review.amount as review_compensation_amount,
#                    COUNT(DISTINCT ta.id) as assignments_count,
#                    COUNT(DISTINCT r.id) as reviews_count,
#                    COUNT(DISTINCT CASE WHEN ta.status = 'in_progress' THEN ta.id END) as num_people_working
#             FROM tasks t
#             LEFT JOIN users u ON t.user_id = u.id
#             LEFT JOIN startups s ON t.startup_id = s.id
#             LEFT JOIN task_compensations tc_task ON t.id = tc_task.task_id AND tc_task.amount_type = 'task'
#             LEFT JOIN task_compensations tc_review ON t.id = tc_review.task_id AND tc_review.amount_type = 'review'
#             LEFT JOIN task_assignments ta ON t.id = ta.task_id
#             LEFT JOIN reviews r ON t.id = r.task_id
#         """
        
#         where_conditions = ["t.status = 'open'"]  # Only show open tasks
#         params = []
        
#         # Add filters
#         if status:
#             where_conditions.append("t.status = %s")
#             params.append(status)
        
#         if creator_id:
#             where_conditions.append("t.user_id= %s")
#             params.append(creator_id)
            
#         if category:
#             where_conditions.append("t.category = %s")
#             params.append(category)
            
#         if title:
#             where_conditions.append("LOWER(t.title) LIKE LOWER(%s)")
#             params.append(f"%{title}%")
            
#         if compensation_type:
#             where_conditions.append("tc_task.compensation_type = %s")
#             params.append(compensation_type)
            
#         if min_compensation is not None:
#             where_conditions.append("tc_task.amount >= %s")
#             params.append(min_compensation)
            
#         if max_compensation is not None:
#             where_conditions.append("tc_task.amount <= %s")
#             params.append(max_compensation)
            
#         if task_type:
#             where_conditions.append("t.category = %s")
#             params.append(task_type)
            
#         if skill_id:
#             where_conditions.append("            EXISTS (
#                     SELECT 1 FROM task_skills ts 
#                     WHERE ts.task_id = t.id AND ts.skill_id = %s
#                 )")
#             params.append(skill_id)
        
#         # Add WHERE clause
#         if where_conditions:
#             query += " WHERE " + " AND ".join(where_conditions)
        
#         # Add GROUP BY and ORDER BY
#         query += """
#             GROUP BY t.id, u.username, s.name, s.logo, 
#                      tc_task.compensation_type, tc_task.amount,
#                      tc_review.compensation_type, tc_review.amount
#             ORDER BY t.created_at DESC
#             LIMIT %s OFFSET %s
#         """
#         params.extend([limit, skip])
        
#         cursor.execute(query, params)
#         tasks = cursor.fetchall()
        
#         # Format the response
#         formatted_tasks = []
#         for task in tasks:
#             # Get skills for this task
#             cursor.execute("""
#                 SELECT s.id, s.name 
#                 FROM skills s 
#                 JOIN task_skills ts ON s.id = ts.skill_id 
#                 WHERE ts.task_id = %s
#             """, (task['id'],))
#             skills = [{id: row[id], "name": row['name']} for row in cursor.fetchall()]
            
#             formatted_task = {
#                 "id": task['id'],
#                 "user_id": task['user_id'],
#                 "title": task['title'],
#                 "description": task['description'],
#                 "compensation_type": task['task_compensation_type'],
#                 "compensation_amount": task['task_compensation_amount'],
#                 "review_compensation_type": task['review_compensation_type'],
#                 "review_compensation_amount": task['review_compensation_amount'],
#                 "deadline": task['deadline'],
#                 "created_at": task['created_at'],
#                 "status": task['status'],
#                 "skill_review_requirements": task['skill_review_requirements'],
#                 "category": task['category'],
#                 "skills": skills,
#                 "creator_name": task['creator_name'] or "Unknown User",
#                 "creator_avatar": None,
#                 "assignments_count": task['assignments_count'] or 0,
#                 "reviews_count": task['reviews_count'] or 0,
#                 "num_people_working": task['num_people_working'] or 0,
#                 "has_assignment": False,  # Public endpoint doesn't show user-specific assignment status
#                 "startup_name": task['startup_name'] or "",
#                 "startup_logo": task['startup_logo']
#             }
#             formatted_tasks.append(formatted_task)
        
#         return formatted_tasks

# @router.get("/public/{task_id}", response_model=TaskWithDetails)
# def get_public_task(
#     task_id: int,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get public task details without authentication.
#     """
#     with get_db_cursor() as cursor:
#         cursor.execute("""
#             SELECT t.*, 
#                    u.username as creator_name,
#                    s.name as startup_name,
#                    s.logo as startup_logo,
#                    tc_task.compensation_type as task_compensation_type,
#                    tc_task.amount as task_compensation_amount,
#                    tc_review.compensation_type as review_compensation_type,
#                    tc_review.amount as review_compensation_amount,
#                    COUNT(DISTINCT ta.id) as assignments_count,
#                    COUNT(DISTINCT r.id) as reviews_count,
#                    COUNT(DISTINCT CASE WHEN ta.status = 'in_progress' THEN ta.id END) as num_people_working
#             FROM tasks t
#             LEFT JOIN users u ON t.user_id = u.id
#             LEFT JOIN startups s ON t.startup_id = s.id
#             LEFT JOIN task_compensations tc_task ON t.id = tc_task.task_id AND tc_task.amount_type = 'task'
#             LEFT JOIN task_compensations tc_review ON t.id = tc_review.task_id AND tc_review.amount_type = 'review'
#             LEFT JOIN task_assignments ta ON t.id = ta.task_id
#             LEFT JOIN reviews r ON t.id = r.task_id
#             WHERE t.id = %s
#             GROUP BY t.id, u.username, s.name, s.logo, 
#                      tc_task.compensation_type, tc_task.amount,
#                      tc_review.compensation_type, tc_review.amount
#         """, (task_id,))
        
#         task = cursor.fetchone()
#         if not task:
#             raise HTTPException(status_code=404, detail="Task not found")
        
#         # Get skills for this task
#         cursor.execute("""
#             SELECT s.id, s.name 
#             FROM skills s 
#             JOIN task_skills ts ON s.id = ts.skill_id 
#             WHERE ts.task_id = %s
#         """, (task_id,))
#         skills = [{id: row[id], "name": row['name']} for row in cursor.fetchall()]
        
#         formatted_task = {
#             "id": task['id'],
#             "user_id": task['user_id'],
#             "title": task['title'],
#             "description": task['description'],
#             "compensation_type": task['task_compensation_type'],
#             "compensation_amount": task['task_compensation_amount'],
#             "review_compensation_type": task['review_compensation_type'],
#             "review_compensation_amount": task['review_compensation_amount'],
#             "deadline": task['deadline'],
#             "created_at": task['created_at'],
#             "status": task['status'],
#             "skill_review_requirements": task['skill_review_requirements'],
#             "category": task['category'],
#             "skills": skills,
#             "creator_name": task['creator_name'] or "Unknown User",
#             "creator_avatar": None,
#             "assignments_count": task['assignments_count'] or 0,
#             "reviews_count": task['reviews_count'] or 0,
#             "num_people_working": task['num_people_working'] or 0,
#             "has_assignment": False,  # Public endpoint doesn't show user-specific assignment status
#             "startup_name": task['startup_name'] or "",
#             "startup_logo": task['startup_logo']
#         }
        
#         return formatted_task


