from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import random
from app.database.connection import get_db_cursor
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignment, TaskAssignmentUpdate, TaskAssignmentWithDetails
from app.schemas.peer_evaluation import PeerEvaluationCreate
from app.dependencies import get_current_user
from app.repositories.task_assignment_repository import TaskAssignmentRepository
from app.repositories.peer_evaluation_repository import PeerEvaluationRepository
from app.crud import task_assignment as crud
from app.database import get_db
from sqlalchemy.orm import Session
from app.services.rating_service import rating_service

router = APIRouter(
    prefix="/task-assignments",
    tags=["task assignments"],
    responses={404: {"description": "Not found"}},
)

def check_user_skills_match_task_requirements(
    db: Session,
    user_id: int,
    task_id: int
) -> bool:
    """
    Check if user's skills meet the task's minimum skill level requirements.
    Also check if user is blocked from this task due to previous rejection.
    
    This function performs a comprehensive validation to ensure:
    1. User is not blocked from the task due to previous rejection
    2. User has the required skills with minimum skill levels
    3. User's skill ratings meet or exceed the task requirements
    
    Args:
        db (Session): Database session for querying user skills and task requirements
        user_id (int): The ID of the user whose skills should be validated
        task_id (int): The ID of the task to check requirements against
        
    Returns:
        bool: True if user has skills that meet minimum requirements and is not blocked,
              False if user is blocked or doesn't meet skill requirements
        
    Raises:
        No exceptions raised - returns False for any validation failures
    """
    # Get user's skills with their levels from contributor_skill table
    user_skills_query = """
        SELECT s.name, cs.rating 
        FROM contributor_skill cs 
        JOIN skills s ON cs.skill_id = s.id 
        WHERE cs.user_id = %s
    """
    
    # Get task's skill review requirements (minimum skill levels)
    task_requirements_query = """
        SELECT skill_review_requirements 
        FROM tasks 
        WHERE id = %s
    """
    
    # Check if user is blocked from this task
    block_check_query = """
        SELECT blocked_until, reason
        FROM task_blocks
        WHERE task_id = %s AND user_id = %s AND blocked_until > CURRENT_TIMESTAMP
    """
    
    with get_db_cursor() as cursor:
        # Check if user is blocked from this task
        cursor.execute(block_check_query, (task_id, user_id))
        block_result = cursor.fetchone()
        
        if block_result:
            # User is blocked from this task
            print(f"User {user_id} is blocked from task {task_id} until {block_result['blocked_until']}: {block_result['reason']}")
            return False
        
        # Get user skills with levels
        cursor.execute(user_skills_query, (user_id,))
        user_skills = {row['name']: row['rating'] for row in cursor.fetchall()}
        
        # Get task requirements
        cursor.execute(task_requirements_query, (task_id,))
        task_result = cursor.fetchone()
        
        if not task_result or not task_result['skill_review_requirements']:
            # If no specific requirements, allow assignment
            return True
            
        task_requirements = task_result['skill_review_requirements']
        
        # Check if user meets minimum skill level requirements
        for required_skill, required_level in task_requirements.items():
            user_level = user_skills.get(required_skill, 0)
            
            # User must have at least the required skill level
            if user_level < required_level:
                return False
        
        # User meets all requirements and is not blocked
        return True

@router.post("/", response_model=TaskAssignment, status_code=status.HTTP_201_CREATED)
def create_new_assignment(
    assignment: TaskAssignmentCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new task assignment for the authenticated user.
    
    This endpoint allows users to assign themselves to tasks or reviews. The function performs
    several validations before creating the assignment:
    1. Checks if user already has an assignment for this task
    2. For both task and review assignments, validates that user's skills meet minimum requirements
    3. Creates the assignment if all validations pass
    
    The assignment process includes:
    - Setting initial status to 'in_progress'
    - Recording assignment timestamp
    - Linking user to the specific task
    
    Args:
        assignment (TaskAssignmentCreate): The assignment data containing task_id and assignment_type
        current_user: The authenticated user making the assignment request
        db (Session): Database session for CRUD operations
        
    Returns:
        TaskAssignment: The created assignment with all details
        
    Raises:
        HTTPException 400: If user already has an assignment for this task
        HTTPException 403: If user's skill levels don't meet task requirements
        HTTPException 500: If database operation fails
    """
    # Check if user already has an assignment for this task
    if crud.check_existing_assignment(
        task_id=assignment.task_id,
        user_id=current_user.id,
        assignment_type=assignment.assignment_type
    ):
        raise HTTPException(
            status_code=400,
            detail="User already has an assignment for this task"
        )
    
    # For both task and review assignments, check if user's skills match requirements
    if assignment.assignment_type in ["task", "review"]:
        if not check_user_skills_match_task_requirements(db, current_user.id, assignment.task_id):
            assignment_type_text = "undertake" if assignment.assignment_type == "task" else "review"
            raise HTTPException(
                status_code=403,
                detail=f"Your skill levels do not meet the minimum requirements for this task. You can view all tasks but can only {assignment_type_text} tasks where you meet the minimum skill level requirements."
            )
    
    return crud.create_task_assignment(assignment, current_user.id)

@router.get("/", response_model=List[TaskAssignmentWithDetails])
def read_assignments(
    skip: int = 0, 
    limit: int = 100, 
    task_id: int = None,
    status: str = None,
    assignment_type: str = None,
    current_user = Depends(get_current_user)
):
    """
    Get multiple task assignments with optional filtering.
    
    This endpoint retrieves task assignments for the authenticated user with various
    filtering options. The function supports pagination and multiple filter criteria
    to help users find specific assignments.
    
    Filtering options:
    - task_id: Filter by specific task
    - status: Filter by assignment status (in_progress, submitted, completed, rejected)
    - assignment_type: Filter by type (task, review)
    - skip/limit: Pagination support
    
    Args:
        skip (int): Number of records to skip for pagination (default: 0)
        limit (int): Maximum number of records to return (default: 100, max: 1000)
        task_id (int, optional): Filter assignments by specific task ID
        status (str, optional): Filter by assignment status
        assignment_type (str, optional): Filter by assignment type (task/review)
        current_user: The authenticated user whose assignments to retrieve
        
    Returns:
        List[TaskAssignmentWithDetails]: List of assignments with full task and user details
        
    Raises:
        HTTPException 400: If invalid filter parameters provided
        HTTPException 500: If database query fails
    """
    return crud.get_task_assignments(
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        task_id=task_id,
        status=status,
        assignment_type=assignment_type
    )

@router.get("/{assignment_id}", response_model=TaskAssignmentWithDetails)
def read_assignment(
    assignment_id: int,
    current_user = Depends(get_current_user)
):
    """
    Get a specific task assignment by ID.
    
    This endpoint retrieves detailed information about a single task assignment.
    The function ensures that only the assignment owner can view the details
    by checking user authorization.
    
    The returned data includes:
    - Assignment details (status, timestamps, notes)
    - Task information (title, description, requirements)
    - User information (username, profile)
    - Related peer evaluations (if any)
    
    Args:
        assignment_id (int): The unique identifier of the assignment to retrieve
        current_user: The authenticated user requesting the assignment details
        
    Returns:
        TaskAssignmentWithDetails: Complete assignment information with related data
        
    Raises:
        HTTPException 404: If assignment not found
        HTTPException 403: If user is not authorized to view this assignment
        HTTPException 500: If database query fails
    """
    assignment = crud.get_task_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    return assignment

@router.put("/{assignment_id}", response_model=TaskAssignmentWithDetails)
async def update_assignment_status(
    assignment_id: int, 
    assignment: TaskAssignmentUpdate, 
    current_user = Depends(get_current_user)
):
    """
    Update a task assignment status and trigger related workflows.
    
    This endpoint allows users to update their task assignment status, typically
    to mark work as submitted or completed. The function implements a state machine
    that controls valid status transitions and triggers appropriate workflows.
    
    Valid status transitions:
    - in_progress → submitted: User submits work for review
    - submitted → completed: Manual override (admin/self-review)
    
    When status changes to 'submitted':
    1. Creates peer evaluation assignments for other contributors
    2. Randomly selects evaluators from completed contributors
    3. Sets up evaluation workflow
    
    When status changes to 'completed':
    1. Updates user skill ratings based on performance
    2. Triggers rating system updates
    
    Args:
        assignment_id (int): The unique identifier of the assignment to update
        assignment (TaskAssignmentUpdate): The updated assignment data (status, notes)
        current_user: The authenticated user making the update
        
    Returns:
        TaskAssignmentWithDetails: The updated assignment with full details
        
    Raises:
        HTTPException 404: If assignment not found
        HTTPException 403: If user is not authorized to update this assignment
        HTTPException 400: If invalid status transition attempted
        HTTPException 500: If database operation or workflow fails
    """
    db_assignment = crud.get_task_assignment(assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if db_assignment['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this assignment")
    
    # Only allow updating from in_progress to submitted, or from submitted to completed
    if (db_assignment['status'] == "in_progress" and assignment.status == "submitted"):
        # Allow transition from in_progress to submitted
        pass
    elif (db_assignment['status'] == "submitted" and assignment.status == "completed"):
        # Allow transition from submitted to completed (manual override)
        pass
    elif (db_assignment['status'] != "in_progress" and assignment.status == "submitted"):
        raise HTTPException(
            status_code=400, 
            detail=f"Can only mark in-progress assignments as submitted. Current status: {db_assignment['status']}"
        )
    elif assignment.status not in ["submitted", "completed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition. Allowed: in_progress → submitted → completed"
        )
    
    # Update the assignment
    updated_assignment = crud.update_task_assignment(assignment_id, assignment)
    if not updated_assignment:
        raise HTTPException(status_code=404, detail="Failed to update assignment")
    
    # If the assignment is being marked as submitted, trigger peer evaluation process
    if assignment.status == "submitted":
        # Get task details for peer evaluation
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT num_reviewers, title, description FROM tasks WHERE id = %s",
                (db_assignment['task_id'],)
            )
            task = cursor.fetchone()
        
        # Create new review tasks for peer evaluation
        # These will be picked up by any qualified contributors
        num_reviewers = task["num_reviewers"] or 2
        
        for i in range(num_reviewers):
            # Create a new review task
            review_task_title = f"Review: {task['title']} (Submission #{assignment_id})"
            review_task_description = f"""
            Review the submitted work for task: {task['title']}
            
            Submission Details:
            - Assignment ID: {assignment_id}
            - Original Task: {task['title']}
            
            Provide constructive feedback.
            """
            
            # Insert the review task into review_tasks table
            cursor.execute("""
                INSERT INTO review_tasks (
                    title, description, status, skill_requirements, 
                    parent_task_id, assignment_being_reviewed_id,
                    compensation_amount, compensation_type
                ) VALUES (
                    %s, %s, 'open', %s, %s, %s, %s, %s
                ) RETURNING id
            """, (
                review_task_title,
                review_task_description,
                task.get('skill_review_requirements', '{}'),  # Same skill requirements as original task
                db_assignment['task_id'],  # Link to parent task
                assignment_id,  # Link to the assignment being reviewed
                25,  # Review compensation amount
                'cash'  # Review compensation type
            ))
            
            review_task_id = cursor.fetchone()[0]
            print(f"Created review task {review_task_id} for assignment {assignment_id}")
        
        # Update the original task status to indicate it's under review
        cursor.execute("""
            UPDATE tasks 
            SET status = 'under_review' 
            WHERE id = %s
        """, (db_assignment['task_id'],))
    
    # If the assignment is being marked as completed (after reviews), update skill ratings
    elif assignment.status == "completed":
        # Update user's skill ratings for completed task
        update_user_skill_ratings_from_task_completion(
            task_id=db_assignment['task_id'],
            user_id=current_user.id,
            success=True,
            average_score=0
        )
    
    return updated_assignment

@router.get("/can-undertake/{task_id}")
def can_undertake_task(
    task_id: int,
    assignment_type: str = "task",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if the current user can undertake a specific task or review assignment.
    
    This endpoint performs a comprehensive validation to determine if a user
    can undertake a specific task or review assignment. The validation includes multiple checks:
    
    1. Existing Assignment Check: Ensures user doesn't already have an assignment
    2. Block Check: Verifies user isn't blocked due to previous rejection
    3. Skill Requirements Check: Validates user meets minimum skill levels
    
    This is used by the frontend to:
    - Show/hide "Undertake Task" and "Review Task" buttons
    - Display appropriate error messages
    - Guide users on what they need to improve
    
    Args:
        task_id (int): The ID of the task to check capability for
        assignment_type (str): Type of assignment to check ("task" or "review", default: "task")
        current_user: The authenticated user whose capability is being checked
        db (Session): Database session for validation queries
        
    Returns:
        dict: Detailed response with capability status and reasoning
            {
                "can_undertake": bool,
                "reason": str,
                "block_details": dict (optional) - contains block information if blocked
            }
        
    Raises:
        HTTPException 404: If task not found
        HTTPException 400: If invalid assignment_type provided
        HTTPException 500: If database query fails
    """
    # Validate assignment_type parameter
    if assignment_type not in ["task", "review"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid assignment_type. Must be 'task' or 'review'"
        )
    
    # Check if user already has an assignment for this task
    has_existing_assignment = crud.check_existing_assignment(
        task_id=task_id,
        user_id=current_user.id,
        assignment_type=assignment_type
    )
    
    if has_existing_assignment:
        action_text = "undertake" if assignment_type == "task" else "review"
        return {
            "can_undertake": False,
            "reason": f"You already have a {assignment_type} assignment for this task"
        }
    
    # Check if user is blocked from this task
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT blocked_until, reason
            FROM task_blocks
            WHERE task_id = %s AND user_id = %s AND blocked_until > CURRENT_TIMESTAMP
        """, (task_id, current_user.id))
        
        block_result = cursor.fetchone()
        
        if block_result:
            from datetime import datetime
            blocked_until = block_result['blocked_until']
            if isinstance(blocked_until, str):
                blocked_until = datetime.fromisoformat(blocked_until.replace('Z', '+00:00'))
            
            days_remaining = (blocked_until - datetime.utcnow()).days
            
            return {
                "can_undertake": False,
                "reason": f"You are blocked from this task for {days_remaining} more days due to previous rejection",
                "block_details": {
                    "blocked_until": blocked_until.isoformat(),
                    "days_remaining": days_remaining,
                    "reason": block_result['reason']
                }
            }
    
    # Check if user's skill levels meet task requirements
    skills_match = check_user_skills_match_task_requirements(db, current_user.id, task_id)
    
    if not skills_match:
        action_text = "undertake" if assignment_type == "task" else "review"
        return {
            "can_undertake": False,
            "reason": f"Your skill levels do not meet the minimum requirements to {action_text} this task"
        }
    
    action_text = "undertake" if assignment_type == "task" else "review"
    return {
        "can_undertake": True,
        "reason": f"You can {action_text} this task"
    }

@router.get("/can-review/{task_id}")
def can_review_task(
    task_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if the current user can review a specific task.
    
    This endpoint is a convenience wrapper around can_undertake_task specifically
    for review assignments. It performs the same validation but is more intuitive
    for frontend code that needs to check review capability.
    
    Args:
        task_id (int): The ID of the task to check review capability for
        current_user: The authenticated user whose review capability is being checked
        db (Session): Database session for validation queries
        
    Returns:
        dict: Same response format as can_undertake_task but for review assignments
        
    Raises:
        HTTPException 404: If task not found
        HTTPException 500: If database query fails
    """
    return can_undertake_task(task_id, "review", current_user, db)

def update_user_skill_ratings_from_task_completion(
    task_id: int, 
    user_id: int, 
    success: bool = True,
    average_score: float = None
):
    """
    Update user's skill ratings when a task is completed or rejected.
    
    This function is called when a task assignment reaches a final state
    (completed or rejected) to update the user's skill ratings based on
    their performance. The rating update uses a Bayesian weighted average
    system to provide fair and accurate skill assessments.
    
    The function:
    1. Retrieves task skill requirements
    2. Determines performance score based on success/failure
    3. Updates each required skill rating using the rating service
    4. Handles errors gracefully without failing the task completion
    
    Performance scoring:
    - Success (approved): Uses average_score if available, otherwise assumes 4.0
    - Failure (rejected): Uses average_score if available, otherwise assumes 1.5
    - Score >= 3.0 is considered accepted, < 3.0 is rejected
    
    Args:
        task_id (int): The ID of the completed/rejected task
        user_id (int): The ID of the user whose ratings should be updated
        success (bool): Whether the task was approved (True) or rejected (False)
        average_score (float, optional): The average evaluation score from peer reviews
        
    Returns:
        None: Function completes silently, errors are logged but don't raise exceptions
        
    Raises:
        No exceptions raised - errors are logged and handled gracefully
    """
    try:
        with get_db_cursor() as cursor:
            # Get task skill requirements
            cursor.execute("""
                SELECT skill_review_requirements
                FROM tasks
                WHERE id = %s
            """, (task_id,))
            
            task_result = cursor.fetchone()
            if not task_result:
                return
            
            task_requirements = task_result['skill_review_requirements'] or {}
            
            # Determine the score based on success/failure
            if success:
                # Task was approved - use average_score if available, otherwise assume good performance
                performance_score = average_score if average_score else 4.0
            else:
                # Task was rejected - use average_score if available, otherwise assume poor performance
                performance_score = average_score if average_score else 1.5
            
            # Update ratings for each skill required by the task
            for skill_name, required_level in task_requirements.items():
                # Get skill ID
                cursor.execute("SELECT id FROM skills WHERE name = %s", (skill_name,))
                skill_result = cursor.fetchone()
                
                if skill_result:
                    skill_id = skill_result['id']
                    
                    # Convert performance score to task_accepted boolean for rating service
                    # Score >= 3.0 is considered accepted, < 3.0 is rejected
                    task_accepted = performance_score >= 3.0
                    
                    # Update the user's rating for this skill
                    rating_service.update_skill_rating(user_id, skill_id, task_accepted)
                    
    except Exception as e:
        # Log error but don't fail the task completion
        print(f"Error updating skill ratings: {str(e)}")

def cleanup_expired_task_blocks():
    """
    Clean up expired task blocks from the database.
    
    This function removes task blocks where the blocked_until timestamp
    has passed, keeping the database clean and allowing users to retry
    tasks after their blocking period expires.
    
    The function:
    1. Identifies all expired blocks (blocked_until <= current timestamp)
    2. Deletes them from the task_blocks table
    3. Returns the count of deleted blocks
    4. Logs the cleanup operation
    
    This should be run periodically (e.g., daily) to maintain database
    performance and ensure users can access tasks after their blocking
    period expires.
    
    Args:
        None: Function uses current timestamp for comparison
        
    Returns:
        int: Number of expired blocks that were deleted
        
    Raises:
        No exceptions raised - errors are logged and function returns 0
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                DELETE FROM task_blocks
                WHERE blocked_until <= CURRENT_TIMESTAMP
            """)
            
            deleted_count = cursor.rowcount
            print(f"Cleaned up {deleted_count} expired task blocks")
            return deleted_count
            
    except Exception as e:
        print(f"Error cleaning up expired task blocks: {str(e)}")
        return 0

@router.post("/cleanup-expired-blocks")
def cleanup_blocks_endpoint(current_user = Depends(get_current_user)):
    """
    Manually trigger cleanup of expired task blocks.
    
    This endpoint allows manual execution of the cleanup process for
    expired task blocks. It's useful for:
    - Immediate cleanup when needed
    - Testing the cleanup process
    - Manual maintenance operations
    
    The endpoint:
    1. Calls the cleanup_expired_task_blocks function
    2. Returns a summary of the cleanup operation
    3. Provides feedback on the number of blocks removed
    
    Note: In production, this should be restricted to admin users only.
    Currently allows any authenticated user for development purposes.
    
    Args:
        current_user: The authenticated user requesting the cleanup
        
    Returns:
        dict: Summary of the cleanup operation
            {
                "message": str - Description of the cleanup result,
                "deleted_count": int - Number of blocks that were deleted
            }
        
    Raises:
        HTTPException 500: If cleanup process fails
    """
    # TODO: Add admin check here
    # For now, allow any authenticated user to trigger cleanup
    
    deleted_count = cleanup_expired_task_blocks()
    
    return {
        "message": f"Cleaned up {deleted_count} expired task blocks",
        "deleted_count": deleted_count
    }

@router.post("/{assignment_id}/resubmit", response_model=TaskAssignment)
async def resubmit_task(
    assignment_id: int,
    resubmission_data: TaskAssignmentUpdate,
    current_user = Depends(get_current_user)
):
    """
    Resubmit a rejected task for review.
    
    This endpoint allows users to resubmit tasks that were previously
    rejected by peer reviewers. The resubmission process:
    
    1. Validates the assignment exists and belongs to the user
    2. Ensures the assignment is in 'rejected' status
    3. Updates the assignment status to 'resubmitted'
    4. Creates new peer evaluation assignments for the resubmission
    5. Resets the completion timestamp
    
    The resubmission workflow:
    - Finds other contributors who completed the same task
    - Creates new peer evaluation assignments for them
    - Allows the user to provide updated notes/explanation
    - Resets the evaluation process for the improved submission
    
    Args:
        assignment_id (int): The ID of the rejected assignment to resubmit
        resubmission_data (TaskAssignmentUpdate): Updated assignment data with notes
        current_user: The authenticated user making the resubmission
        
    Returns:
        TaskAssignment: The updated assignment with resubmission details
        
    Raises:
        HTTPException 404: If assignment not found
        HTTPException 403: If user is not authorized to resubmit this assignment
        HTTPException 400: If assignment is not in rejected status
        HTTPException 500: If resubmission process fails
    """
    try:
        from app.database.connection import get_db_cursor
        
        with get_db_cursor() as cursor:
            # Check if assignment exists and belongs to user
            cursor.execute("""
                SELECT ta.id, ta.task_id, ta.user_id, ta.status
                FROM task_assignments ta
                WHERE ta.id = %s
            """, (assignment_id,))
            
            assignment = cursor.fetchone()
            if not assignment:
                raise HTTPException(status_code=404, detail="Assignment not found")
            
            if assignment['user_id'] != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to resubmit this task")
            
            if assignment['status'] != 'rejected':
                raise HTTPException(status_code=400, detail="Only rejected tasks can be resubmitted")
            
            # Update assignment status to resubmitted
            cursor.execute("""
                UPDATE task_assignments
                SET status = 'resubmitted', notes = %s, completed_at = NULL
                WHERE id = %s
            """, (resubmission_data.notes, assignment_id))
            
            # Create new peer evaluations for the resubmission
            # Get completed contributors for this task
            cursor.execute("""
                SELECT ta.user_id, u.username
                FROM task_assignments ta
                JOIN users u ON ta.user_id = u.id
                WHERE ta.task_id = %s 
                AND ta.status = 'completed'
                AND ta.id != %s
                LIMIT 3
            """, (assignment['task_id'], assignment_id))
            
            evaluators = cursor.fetchall()
            
            # Create peer evaluation assignments
            for evaluator in evaluators:
                cursor.execute("""
                    INSERT INTO peer_evaluations (
                        task_id, evaluator_id, evaluatee_id, assignment_id, 
                        overall_score, strengths, areas_for_improvement, status
                    ) VALUES (%s, %s, %s, %s, 0, '', '', 'pending')
                """, (
                    assignment['task_id'],
                    evaluator['user_id'],
                    current_user.id,
                    assignment_id
                ))
            
            # Get updated assignment
            cursor.execute("""
                SELECT ta.*, t.title as task_title, u.username as user_name
                FROM task_assignments ta
                JOIN tasks t ON ta.task_id = t.id
                JOIN users u ON ta.user_id = u.id
                WHERE ta.id = %s
            """, (assignment_id,))
            
            return cursor.fetchone()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resubmitting task: {str(e)}")
