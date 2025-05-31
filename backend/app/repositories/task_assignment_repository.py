"""
TaskAssignmentRepository

This repository handles all database operations related to task assignments in the system.
It manages the lifecycle of task assignments from creation to completion, including:
- Creating new task assignments
- Updating assignment status and progress
- Managing task completion states
- Coordinating with the peer evaluation system

The repository uses raw SQL queries with psycopg2 for database operations, providing better control
over query execution and performance compared to ORM-based approaches.

Key Features:
- Task assignment creation and management
- Status tracking and updates
- Automatic task completion handling
- Integration with peer evaluation system
- Comprehensive assignment queries with filtering
"""

from typing import List, Optional, Dict
from datetime import datetime
from app.database.connection import get_db_cursor
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignmentUpdate

class TaskAssignmentRepository:
    @staticmethod
    def create_assignment(
        assignment: TaskAssignmentCreate,
        user_id: int
    ) -> Dict:
        """
        Create a new task assignment and update the task status.
        
        This method handles the creation of a new task assignment and ensures the task
        status is properly updated to 'in_progress'. It performs both operations in a
        single transaction to maintain data consistency.
        
        Args:
            assignment (TaskAssignmentCreate): The assignment data including task_id and notes
            user_id (int): The ID of the user being assigned to the task
            
        Returns:
            Dict: The created assignment record with all fields
            
        Note:
            - Updates task status to 'in_progress' if it was 'open'
            - Creates a new assignment record with initial status
            - Returns the complete assignment record
        """
        # First update task status if it's open
        task_update_query = """
        UPDATE tasks 
        SET status = 'in_progress'
        WHERE id = %s AND status = 'open';
        """
        
        assignment_query = """
        INSERT INTO task_assignments (
            task_id, user_id, assignment_type, notes
        ) VALUES (
            %s, %s, %s, %s
        ) RETURNING *;
        """
        
        with get_db_cursor(commit=True) as cursor:
            # Update task status
            cursor.execute(task_update_query, (assignment.task_id,))
            
            # Create assignment
            cursor.execute(assignment_query, (
                assignment.task_id,
                user_id,
                assignment.assignment_type,
                assignment.notes
            ))
            return cursor.fetchone()

    @staticmethod
    def get_assignment(assignment_id: int) -> Optional[Dict]:
        """
        Retrieve a single task assignment with detailed information.
        
        This method fetches a specific assignment and includes related information
        from the tasks and users tables to provide a complete view of the assignment.
        
        Args:
            assignment_id (int): The ID of the assignment to retrieve
            
        Returns:
            Optional[Dict]: The assignment record with task and user details, or None if not found
            
        Note:
            Includes:
            - Basic assignment information
            - Task title and description
            - User name
        """
        query = """
        SELECT ta.*, 
               t.title as task_title,
               t.description as task_description,
               u.name as user_name
        FROM task_assignments ta
        JOIN tasks t ON ta.task_id = t.id
        JOIN users u ON ta.user_id = u.id
        WHERE ta.id = %s;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (assignment_id,))
            return cursor.fetchone()

    @staticmethod
    def get_assignments(
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        task_id: Optional[int] = None,
        status: Optional[str] = None,
        assignment_type: Optional[str] = None
    ) -> List[Dict]:
        """
        Retrieve multiple task assignments with filtering and pagination.
        
        This method provides a flexible way to query assignments with various filters
        and supports pagination for handling large result sets.
        
        Args:
            skip (int): Number of records to skip (for pagination)
            limit (int): Maximum number of records to return
            user_id (Optional[int]): Filter by specific user
            task_id (Optional[int]): Filter by specific task
            status (Optional[str]): Filter by assignment status
            assignment_type (Optional[str]): Filter by assignment type ('task' or 'review')
            
        Returns:
            List[Dict]: List of assignment records with task and user details
            
        Note:
            - Results are ordered by creation date (newest first)
            - Includes task and user information
            - Supports multiple filter combinations
        """
        query = """
        SELECT ta.*, 
               t.title as task_title,
               t.description as task_description,
               u.name as user_name
        FROM task_assignments ta
        JOIN tasks t ON ta.task_id = t.id
        JOIN users u ON ta.user_id = u.id
        WHERE 1=1
        """
        params = []
        
        if user_id:
            query += " AND ta.user_id = %s"
            params.append(user_id)
        if task_id:
            query += " AND ta.task_id = %s"
            params.append(task_id)
        if status:
            query += " AND ta.status = %s"
            params.append(status)
        if assignment_type:
            query += " AND ta.assignment_type = %s"
            params.append(assignment_type)
            
        query += " ORDER BY ta.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, skip])
        
        with get_db_cursor() as cursor:
            cursor.execute(query, tuple(params))
            return cursor.fetchall()

    @staticmethod
    def update_assignment(
        assignment_id: int,
        assignment: TaskAssignmentUpdate
    ) -> Optional[Dict]:
        """
        Update an existing task assignment.
        
        This method handles updating assignment status and notes, with special handling
        for completion status. When an assignment is marked as completed, it also
        checks if the parent task should be marked as completed.
        
        Args:
            assignment_id (int): The ID of the assignment to update
            assignment (TaskAssignmentUpdate): The update data including status and notes
            
        Returns:
            Optional[Dict]: The updated assignment record, or None if not found
            
        Note:
            - Dynamically builds update query based on provided fields
            - Handles task completion status automatically
            - Updates completed_at timestamp when status changes to 'completed'
            - Checks if all assignments are completed to update task status
        """
        # Build update query dynamically based on provided fields
        update_fields = []
        params = []
        
        if assignment.status is not None:
            update_fields.append("status = %s")
            params.append(assignment.status)
            if assignment.status == "completed":
                update_fields.append("completed_at = %s")
                params.append(datetime.utcnow())
        if assignment.notes is not None:
            update_fields.append("notes = %s")
            params.append(assignment.notes)
            
        # Add assignment_id to params
        params.append(assignment_id)
        
        query = f"""
        UPDATE task_assignments
        SET {", ".join(update_fields)}
        WHERE id = %s
        RETURNING *;
        """
        
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, tuple(params))
            updated_assignment = cursor.fetchone()
            
            # If status is completed, check if we need to update task status
            if assignment.status == "completed":
                # Check if all assignments for this task are completed
                check_query = """
                SELECT COUNT(*) as count
                FROM task_assignments
                WHERE task_id = %s AND status != 'completed';
                """
                cursor.execute(check_query, (updated_assignment["task_id"],))
                result = cursor.fetchone()
                
                if result["count"] == 0:
                    # All assignments are completed, update task status
                    update_task_query = """
                    UPDATE tasks
                    SET status = 'completed'
                    WHERE id = %s;
                    """
                    cursor.execute(update_task_query, (updated_assignment["task_id"],))
            
            return updated_assignment

    @staticmethod
    def get_completed_task_contributors(task_id: int, exclude_assignment_id: int) -> List[Dict]:
        """
        Get all users who have completed a specific task.
        
        This method is used to find potential peer evaluators who have completed
        the same task. It excludes the current assignment to prevent self-evaluation.
        
        Args:
            task_id (int): The ID of the task to find contributors for
            exclude_assignment_id (int): The ID of the assignment to exclude
            
        Returns:
            List[Dict]: List of completed assignments with user information
            
        Note:
            Used primarily for peer evaluation assignment
            Excludes the current assignment to prevent self-evaluation
        """
        query = """
        SELECT ta.*, u.name as user_name
        FROM task_assignments ta
        JOIN users u ON ta.user_id = u.id
        WHERE ta.task_id = %s 
        AND ta.status = 'completed'
        AND ta.id != %s;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (task_id, exclude_assignment_id))
            return cursor.fetchall()

    @staticmethod
    def check_existing_assignment(task_id: int, user_id: int, assignment_type: str = "task") -> bool:
        """
        Check if a user already has an assignment for a specific task.
        
        Args:
            task_id (int): The ID of the task to check
            user_id (int): The ID of the user to check
            assignment_type (str): The type of assignment to check for ('task' or 'review')
            
        Returns:
            bool: True if an assignment exists, False otherwise
        """
        query = """
        SELECT EXISTS(
            SELECT 1 
            FROM task_assignments 
            WHERE task_id = %s 
            AND user_id = %s
            AND assignment_type = %s
        ) as exists;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (task_id, user_id, assignment_type))
            result = cursor.fetchone()
            return result["exists"] 