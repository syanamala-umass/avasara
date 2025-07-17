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
from app.services.rating_service import rating_service

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
        
        # Return all review tasks - skill requirements are checked when user tries to undertake the task
        return review_tasks

@router.get("/my-assignments", response_model=List[ReviewAssignmentWithDetails])
def get_my_review_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, regex="^(in_progress|completed|cancelled)$"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get review task assignments for the current user.
    
    This endpoint returns review task assignments that the user is currently working on
    or has completed.
    
    Args:
        skip (int): Number of records to skip for pagination
        limit (int): Maximum number of records to return
        status (str, optional): Filter by assignment status
        current_user: The authenticated user
        db (Session): Database session
        
    Returns:
        List[ReviewAssignmentWithDetails]: Review task assignments with details
        
    Raises:
        HTTPException 500: If database query fails
    """
    print(f"DEBUG: get_my_review_assignments called for user {current_user.id}")
    print(f"DEBUG: status filter: {status}")
    print(f"DEBUG: skip: {skip}, limit: {limit}")
    
    with get_db_cursor() as cursor:
        query = """
            SELECT rta.*, 
                   rt.parent_task_id,
                   rt.status as review_task_status,
                   t.title as parent_task_title,
                   t.description as parent_task_description,
                   ta.notes as assignment_notes,
                   u.username as submitter_name,
                   u.email as submitter_email
            FROM review_task_assignments rta
            JOIN review_tasks rt ON rta.review_task_id = rt.id
            JOIN tasks t ON rt.parent_task_id = t.id
            JOIN task_assignments ta ON rt.assignment_being_reviewed_id = ta.id
            JOIN users u ON ta.user_id = u.id
            WHERE rta.reviewer_id = %s
        """
        
        params = [current_user.id]
        
        # Add status filter if provided
        if status:
            query += " AND rta.status = %s"
            params.append(status)
        
        # Add ordering and pagination
        query += " ORDER BY rta.assigned_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, skip])
        
        print(f"DEBUG: Executing query: {query}")
        print(f"DEBUG: Query params: {params}")
        
        cursor.execute(query, params)
        assignments = cursor.fetchall()
        
        print(f"DEBUG: Found {len(assignments)} review task assignments")
        for i, assignment in enumerate(assignments):
            print(f"DEBUG: Assignment {i+1}: ID={assignment['id']}, review_task_id={assignment['review_task_id']}, status={assignment['status']}, parent_task_title={assignment['parent_task_title']}")
        
        return assignments

# @router.get("/{review_task_id}/details", response_model=ReviewTaskWithDetails)
# def get_review_task(
#     review_task_id: int,
#     current_user = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get basic information about a specific review task.
#     
#     Args:
#         review_task_id (int): The ID of the review task
#         current_user: The authenticated user
#         db (Session): Database session
#         
#     Returns:
#         ReviewTaskWithDetails: Basic review task information
#         
#     Raises:
#         HTTPException 404: If review task not found
#         HTTPException 500: If database query fails
#     """
#     with get_db_cursor() as cursor:
#         cursor.execute("""
#             SELECT rt.*, 
#                    t.title as parent_task_title,
#                    ta.notes as assignment_notes,
#                    u.username as submitter_name
#             FROM review_tasks rt
#             JOIN tasks t ON rt.parent_task_id = t.id
#             JOIN task_assignments ta ON rt.assignment_being_reviewed_id = ta.id
#             JOIN users u ON ta.user_id = u.id
#             WHERE rt.id = %s
#         """, (review_task_id,))
#         
#         review_task = cursor.fetchone()
#         if not review_task:
#             raise HTTPException(status_code=404, detail="Review task not found")
#         
#         return review_task

@router.get("/{review_task_id}/details", response_model=ReviewTaskWithDetails)
def get_review_task_details(
    review_task_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific review task including assignments and reviews.
    
    Args:
        review_task_id (int): The ID of the review task
        current_user: The authenticated user
        db (Session): Database session
        
    Returns:
        ReviewTaskWithDetails: Detailed review task information with assignments and reviews
        
    Raises:
        HTTPException 404: If review task not found
        HTTPException 500: If database query fails
    """
    print(f"DEBUG: get_review_task_details called for review_task_id: {review_task_id}")
    
    with get_db_cursor() as cursor:
        # Get the basic review task information
        cursor.execute("""
            SELECT rt.*, 
                   t.title as parent_task_title,
                   t.description as parent_task_description,
                   t.skill_requirements as parent_skill_requirements,
                   ta.notes as assignment_notes,
                   ta.status as assignment_status,
                   u.username as submitter_name,
                   u.email as submitter_email
            FROM review_tasks rt
            JOIN tasks t ON rt.parent_task_id = t.id
            JOIN task_assignments ta ON rt.assignment_being_reviewed_id = ta.id
            JOIN users u ON ta.user_id = u.id
            WHERE rt.id = %s
        """, (review_task_id,))
        
        review_task = cursor.fetchone()
        if not review_task:
            raise HTTPException(status_code=404, detail="Review task not found")
        
        print(f"DEBUG: Found review task: {review_task}")
        
        # Get review task assignments (who is reviewing this)
        cursor.execute("""
            SELECT rta.*, u.username as reviewer_name, u.email as reviewer_email
            FROM review_task_assignments rta
            JOIN users u ON rta.reviewer_id = u.id
            WHERE rta.review_task_id = %s
        """, (review_task_id,))
        
        assignments = cursor.fetchall()
        print(f"DEBUG: Found {len(assignments)} review task assignments")
        
        # Add assignments to the review task data
        review_task['assignments'] = assignments
        review_task['assignments_count'] = len(assignments)
        
        # Get completed reviews for this review task
        cursor.execute("""
            SELECT r.*, u.username as reviewer_name
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            WHERE r.task_id = %s
        """, (review_task['parent_task_id'],))
        
        reviews = cursor.fetchall()
        print(f"DEBUG: Found {len(reviews)} reviews for parent task")
        
        # Add reviews to the review task data
        review_task['reviews'] = reviews
        review_task['reviews_count'] = len(reviews)
        
        # Calculate approval rate
        if len(reviews) > 0:
            approved_reviews = len([r for r in reviews if r['is_approved']])
            review_task['approval_rate'] = (approved_reviews / len(reviews)) * 100
        else:
            review_task['approval_rate'] = 0
        
        return review_task

@router.post("/{review_task_id}/assign", response_model=ReviewAssignment)
def assign_review_task(
    review_task_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a review task to the authenticated user.
    
    This endpoint allows users to assign themselves to review tasks. The function performs
    several validations before creating the assignment:
    1. Checks if the review task exists and is open
    2. Validates that user is not already assigned to this review task
    3. Checks if user's skills meet the review task requirements
    4. Creates the assignment if all validations pass
    
    Args:
        review_task_id (int): The ID of the review task to assign
        current_user: The authenticated user making the assignment request
        db (Session): Database session for CRUD operations
        
    Returns:
        ReviewAssignment: The created review assignment with all details
        
    Raises:
        HTTPException 404: If review task not found
        HTTPException 400: If review task is not open or user already assigned
        HTTPException 403: If user's skill levels don't meet requirements
        HTTPException 500: If database operation fails
    """
    print(f"DEBUG: Starting review task assignment for user {current_user.id}, review_task_id {review_task_id}")
    
    with get_db_cursor(commit=True) as cursor:
        # Check if review task exists and is open
        cursor.execute("""
            SELECT rt.*, t.skill_review_requirements, t.title as parent_task_title
            FROM review_tasks rt
            JOIN tasks t ON rt.parent_task_id = t.id
            WHERE rt.id = %s
        """, (review_task_id,))
        
        review_task = cursor.fetchone()
        print(f"DEBUG: Review task query result: {review_task}")
        
        if not review_task:
            print(f"DEBUG: Review task {review_task_id} not found")
            raise HTTPException(
                status_code=404,
                detail="Review task not found"
            )
        
        if review_task['status'] != 'open':
            print(f"DEBUG: Review task {review_task_id} is not open (status: {review_task['status']})")
            raise HTTPException(
                status_code=400,
                detail="Review task is not available for assignment"
            )
        
        print(f"DEBUG: Review task found - parent_task_id: {review_task['parent_task_id']}, skill_requirements: {review_task['skill_review_requirements']}")
        
        # Check if user is already assigned to this review task
        cursor.execute("""
            SELECT id FROM review_task_assignments 
            WHERE review_task_id = %s AND reviewer_id = %s
        """, (review_task_id, current_user.id))
        
        existing_assignment = cursor.fetchone()
        print(f"DEBUG: Existing assignment check result: {existing_assignment}")
        
        if existing_assignment:
            print(f"DEBUG: User {current_user.id} already assigned to review task {review_task_id}")
            raise HTTPException(
                status_code=400,
                detail="You are already assigned to this review task"
            )
        
        # Check if user has required skills
        print(f"DEBUG: Checking user skills for user {current_user.id} against task {review_task['parent_task_id']}")
        skills_match = check_user_skills_match_task_requirements(db, current_user.id, review_task['parent_task_id'], "review")
        print(f"DEBUG: Skills match result: {skills_match}")
        
        if not skills_match:
            print(f"DEBUG: User {current_user.id} skills do not match requirements for review task {review_task_id}")
            raise HTTPException(
                status_code=403,
                detail="Your skill levels do not meet the requirements for this review task"
            )
        
        # Create the review assignment
        print(f"DEBUG: Creating review assignment for user {current_user.id}, review_task_id {review_task_id}")
        cursor.execute("""
            INSERT INTO review_task_assignments (
                review_task_id, reviewer_id, status
            ) VALUES (%s, %s, 'in_progress')
            RETURNING id, review_task_id, reviewer_id, status, assigned_at, updated_at
        """, (review_task_id, current_user.id))
        
        assignment = cursor.fetchone()
        print(f"DEBUG: Created assignment: {assignment}")
        
        # Update review task status to in_progress
        cursor.execute("""
            UPDATE review_tasks 
            SET status = 'in_progress' 
            WHERE id = %s
        """, (review_task_id,))
        
        print(f"DEBUG: Updated review task {review_task_id} status to in_progress")
        print(f"DEBUG: Review task assignment completed successfully for user {current_user.id}")
        
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
        
        # If review is completed, update the review task status and check aggregation
        if assignment_update.status == "completed":
            # Update the review task status to completed
            cursor.execute("""
                UPDATE review_tasks 
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (assignment['review_task_id'],))
            
            print(f"DEBUG: Updated review task {assignment['review_task_id']} status to completed")
            
            # Check if all reviews for this assignment are done
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
        # Get the task assignment details for skill rating update
        cursor.execute("""
            SELECT ta.user_id, ta.task_id, t.skill_review_requirements
            FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE ta.id = %s
        """, (assignment_id,))
        
        assignment_info = cursor.fetchone()
        task_accepted = accept_count > reject_count
        
        # Determine approval/rejection based on majority of accept/reject decisions
        if task_accepted:
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
            """, (review_tasks[0]['parent_task_id'], assignment_info['user_id'], blocked_until))
            
            print(f"Assignment {assignment_id} rejected: {accept_count} accept, {reject_count} reject")
        
        # Update skill ratings based on the final decision
        if assignment_info and assignment_info['skill_review_requirements']:
            try:
                skill_requirements = assignment_info['skill_review_requirements']
                user_id = assignment_info['user_id']
                
                # Update each required skill rating
                for skill_name in skill_requirements.keys():
                    # Get skill ID
                    cursor.execute("SELECT id FROM skills WHERE name = %s", (skill_name,))
                    skill_result = cursor.fetchone()
                    
                    if skill_result:
                        skill_id = skill_result['id']
                        # Update the user's rating for this skill
                        rating_service.update_skill_rating(user_id, skill_id, task_accepted)
                        print(f"Updated skill rating for user {user_id}, skill {skill_name}: {'accepted' if task_accepted else 'rejected'}")
                        
            except Exception as e:
                # Log error but don't fail the aggregation process
                print(f"Error updating skill ratings: {str(e)}") 