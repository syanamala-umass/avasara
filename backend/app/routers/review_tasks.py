from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.review_task import (
    ReviewTask, ReviewTaskCreate, ReviewTaskUpdate, ReviewTaskWithDetails,
    ReviewAssignment, ReviewAssignmentCreate, ReviewAssignmentUpdate, ReviewAssignmentWithDetails
)
from app.database.connection import get_db_cursor
from app.routers.task_assignment import check_user_skills_match_task_requirements

router = APIRouter(
    prefix="/review-tasks",
    tags=["review tasks"],
    responses={404: {"description": "Not found"}}
)

@router.get("/", response_model=List[ReviewTaskWithDetails])
def get_review_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, regex="^(open|in_progress|completed|cancelled)$"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get available review tasks that the current user can pick up.
    
    This endpoint returns review tasks that:
    1. Are in 'open' status (available for assignment)
    2. The user has the required skills for
    3. The user hasn't already been assigned to
    
    Args:
        skip (int): Number of records to skip for pagination
        limit (int): Maximum number of records to return
        status (str, optional): Filter by review task status
        current_user: The authenticated user
        db (Session): Database session
        
    Returns:
        List[ReviewTaskWithDetails]: Available review tasks with details
        
    Raises:
        HTTPException 400: If invalid parameters provided
        HTTPException 500: If database query fails
    """
    with get_db_cursor() as cursor:
        # Build the base query - show only one review task per parent task
        query = """
            SELECT DISTINCT ON (rt.parent_task_id) rt.*, 
                   t.title as parent_task_title,
                   ta.notes as assignment_notes,
                   u.username as submitter_name
            FROM review_tasks rt
            JOIN tasks t ON rt.parent_task_id = t.id
            JOIN task_assignments ta ON rt.assignment_being_reviewed_id = ta.id
            JOIN users u ON ta.user_id = u.id
            WHERE rt.status = 'open'
        """
        
        params = []
        
        # Add status filter if provided
        if status:
            query += " AND rt.status = %s"
            params.append(status)
        
        # Exclude tasks the user is already assigned to
        query += """
            AND rt.id NOT IN (
                SELECT rta.review_task_id 
                FROM review_task_assignments rta 
                WHERE rta.reviewer_id = %s
            )
        """
        params.append(current_user.id)
        
        # Add ordering and pagination - order by parent_task_id first for DISTINCT ON, then by created_at
        query += " ORDER BY rt.parent_task_id, rt.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, skip])
        
        cursor.execute(query, params)
        review_tasks = cursor.fetchall()
        
        # Filter by user skills (this could be optimized with a JOIN)
        available_tasks = []
        for task in review_tasks:
            if check_user_skills_match_task_requirements(db, current_user.id, task['parent_task_id']):
                available_tasks.append(task)
        
        return available_tasks

@router.get("/{review_task_id}", response_model=ReviewTaskWithDetails)
def get_review_task(
    review_task_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific review task.
    
    Args:
        review_task_id (int): The ID of the review task
        current_user: The authenticated user
        db (Session): Database session
        
    Returns:
        ReviewTaskWithDetails: Detailed review task information
        
    Raises:
        HTTPException 404: If review task not found
        HTTPException 500: If database query fails
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT rt.*, 
                   t.title as parent_task_title,
                   ta.notes as assignment_notes,
                   u.username as submitter_name
            FROM review_tasks rt
            JOIN tasks t ON rt.parent_task_id = t.id
            JOIN task_assignments ta ON rt.assignment_being_reviewed_id = ta.id
            JOIN users u ON ta.user_id = u.id
            WHERE rt.id = %s
        """, (review_task_id,))
        
        review_task = cursor.fetchone()
        if not review_task:
            raise HTTPException(status_code=404, detail="Review task not found")
        
        return review_task

@router.post("/{review_task_id}/assign", response_model=ReviewAssignment)
def assign_review_task(
    review_task_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a review task to the current user.
    
    This endpoint allows users to pick up review tasks. The function validates:
    1. Review task is available (status = 'open')
    2. User has required skills
    3. User isn't already assigned to this review task
    
    Args:
        review_task_id (int): The ID of the review task to assign
        current_user: The authenticated user
        db (Session): Database session
        
    Returns:
        ReviewAssignment: The created review assignment
        
    Raises:
        HTTPException 404: If review task not found
        HTTPException 400: If review task is not available or user already assigned
        HTTPException 403: If user doesn't meet skill requirements
        HTTPException 500: If database operation fails
    """
    with get_db_cursor() as cursor:
        # Check if review task exists and is available
        cursor.execute("""
            SELECT rt.*, t.title as parent_task_title
            FROM review_tasks rt
            JOIN tasks t ON rt.parent_task_id = t.id
            WHERE rt.id = %s
        """, (review_task_id,))
        
        review_task = cursor.fetchone()
        if not review_task:
            raise HTTPException(status_code=404, detail="Review task not found")
        
        if review_task['status'] != 'open':
            raise HTTPException(
                status_code=400, 
                detail=f"Review task is not available. Current status: {review_task['status']}"
            )
        
        # Check if user is already assigned
        cursor.execute("""
            SELECT id FROM review_task_assignments 
            WHERE review_task_id = %s AND reviewer_id = %s
        """, (review_task_id, current_user.id))
        
        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="You are already assigned to this review task"
            )
        
        # Check if user has required skills
        if not check_user_skills_match_task_requirements(db, current_user.id, review_task['parent_task_id']):
            raise HTTPException(
                status_code=403,
                detail="Your skill levels do not meet the requirements for this review task"
            )
        
        # Create the review assignment
        cursor.execute("""
            INSERT INTO review_task_assignments (
                review_task_id, reviewer_id, status
            ) VALUES (%s, %s, 'assigned')
            RETURNING id, review_task_id, reviewer_id, status, assigned_at, updated_at
        """, (review_task_id, current_user.id))
        
        assignment = cursor.fetchone()
        
        # Update review task status to in_progress
        cursor.execute("""
            UPDATE review_tasks 
            SET status = 'in_progress' 
            WHERE id = %s
        """, (review_task_id,))
        
        return assignment

@router.put("/assignments/{assignment_id}", response_model=ReviewAssignment)
def update_review_assignment(
    assignment_id: int,
    assignment_update: ReviewAssignmentUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a review assignment (submit review).
    
    This endpoint allows reviewers to submit their review with scores and feedback.
    When completed, it triggers the review aggregation process.
    
    Args:
        assignment_id (int): The ID of the review assignment
        assignment_update (ReviewAssignmentUpdate): The review data (scores, feedback)
        current_user: The authenticated user
        db (Session): Database session
        
    Returns:
        ReviewAssignment: The updated review assignment
        
    Raises:
        HTTPException 404: If assignment not found
        HTTPException 403: If user is not authorized to update this assignment
        HTTPException 400: If invalid data provided
        HTTPException 500: If database operation fails
    """
    with get_db_cursor(commit=True) as cursor:
        # Check if assignment exists and belongs to user
        cursor.execute("""
            SELECT rta.*, rt.parent_task_id, rt.assignment_being_reviewed_id
            FROM review_task_assignments rta
            JOIN review_tasks rt ON rta.review_task_id = rt.id
            WHERE rta.id = %s
        """, (assignment_id,))
        
        assignment = cursor.fetchone()
        if not assignment:
            raise HTTPException(status_code=404, detail="Review assignment not found")
        
        if assignment['reviewer_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this review assignment")
        
        # Build update query
        update_fields = []
        params = []
        
        for field, value in assignment_update.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = %s")
                params.append(value)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Add updated_at timestamp
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        # If status is being set to completed, add completed_at
        if assignment_update.status == "completed":
            update_fields.append("completed_at = CURRENT_TIMESTAMP")
        
        params.append(assignment_id)
        
        query = f"""
            UPDATE review_task_assignments
            SET {", ".join(update_fields)}
            WHERE id = %s
            RETURNING *
        """
        
        cursor.execute(query, params)
        updated_assignment = cursor.fetchone()
        
        # If review is completed, check if all reviews for this assignment are done
        if assignment_update.status == "completed":
            check_and_aggregate_reviews(cursor, assignment['assignment_being_reviewed_id'])
        
        return updated_assignment

def check_and_aggregate_reviews(cursor, assignment_id: int):
    """
    Check if all reviews for an assignment are completed and aggregate results.
    
    This function determines if the assignment should be approved or rejected
    based on the majority of accept/reject decisions from reviewers.
    """
    # Get all review tasks for this assignment
    cursor.execute("""
        SELECT rt.id, rt.parent_task_id
        FROM review_tasks rt
        WHERE rt.assignment_being_reviewed_id = %s
    """, (assignment_id,))
    
    review_tasks = cursor.fetchall()
    
    # Check if all reviews are completed
    all_completed = True
    accept_count = 0
    reject_count = 0
    total_reviews = 0
    
    for review_task in review_tasks:
        # Get ALL assignments for this review task, not just the first one
        cursor.execute("""
            SELECT rta.status, rta.accept_reject
            FROM review_task_assignments rta
            WHERE rta.review_task_id = %s
        """, (review_task['id'],))
        
        review_assignments = cursor.fetchall()  # Get all assignments, not just one
        
        # Check if any assignment for this review task is not completed
        task_completed = False
        for review_assignment in review_assignments:
            if review_assignment['status'] == 'completed':
                task_completed = True
                # Count accept/reject decisions
                if review_assignment['accept_reject'] is True:
                    accept_count += 1
                elif review_assignment['accept_reject'] is False:
                    reject_count += 1
                total_reviews += 1
                break  # Only count one completed review per review task
        
        if not task_completed:
            all_completed = False
            break
    
    if all_completed and total_reviews > 0:
        # Determine approval/rejection based on majority of accept/reject decisions
        if accept_count > reject_count:
            # Majority accepted - approve the assignment
            cursor.execute("""
                UPDATE task_assignments
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (assignment_id,))
            
            # Update parent task status
            cursor.execute("""
                UPDATE tasks
                SET status = 'completed'
                WHERE id = %s
            """, (review_tasks[0]['parent_task_id'],))
            
            print(f"Assignment {assignment_id} approved: {accept_count} accept, {reject_count} reject")
        else:
            # Majority rejected or tie - reject the assignment
            cursor.execute("""
                UPDATE task_assignments
                SET status = 'rejected', completed_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (assignment_id,))
            
            # Reset parent task to open
            cursor.execute("""
                UPDATE tasks
                SET status = 'open'
                WHERE id = %s
            """, (review_tasks[0]['parent_task_id'],))
            
            # Block the original contributor
            from datetime import datetime, timedelta
            blocked_until = datetime.utcnow() + timedelta(days=30)
            
            cursor.execute("""
                INSERT INTO task_blocks (task_id, user_id, blocked_until, reason)
                VALUES (%s, %s, %s, 'Work rejected by majority of reviewers')
                ON CONFLICT (task_id, user_id) 
                DO UPDATE SET blocked_until = EXCLUDED.blocked_until, reason = EXCLUDED.reason
            """, (review_tasks[0]['parent_task_id'], assignment_id, blocked_until))
            
            print(f"Assignment {assignment_id} rejected: {accept_count} accept, {reject_count} reject") 