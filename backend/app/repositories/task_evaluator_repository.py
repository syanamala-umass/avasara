"""
TaskEvaluatorRepository

This repository handles all database operations related to task evaluators in the peer evaluation system.
It implements a skill-based matching system where evaluators are selected based on their matching skills
with the task requirements rather than task completion history.

Key Features:
- Skill-based evaluator matching and assignment
- Automatic and manual evaluator assignment
- Comprehensive evaluator management
- Detailed task and evaluator queries with skill information

The repository uses raw SQL queries with psycopg2 for database operations, providing better control
over query execution and performance compared to ORM-based approaches.
"""

from typing import List, Optional, Dict
from app.database.connection import get_db_cursor

class TaskEvaluatorRepository:
    @staticmethod
    def get_users_with_matching_skills(task_id: int, exclude_user_id: Optional[int] = None) -> List[Dict]:
        """
        Find users who have skills matching the task requirements.
        
        This method uses a CTE (Common Table Expression) to first identify the skills required for the task,
        then finds users who have those skills. Users are ranked by the number of matching skills they have.
        
        Args:
            task_id (int): The ID of the task to find matching evaluators for
            exclude_user_id (Optional[int]): User ID to exclude from the results (e.g., task creator)
            
        Returns:
            List[Dict]: List of users with matching skills, including:
                - id: User ID
                - name: User's name
                - email: User's email
                - matching_skills: Array of matching skill names
                - matching_skill_count: Number of matching skills
        """
        query = """
        WITH task_skills AS (
            SELECT skill_id 
            FROM task_skills 
            WHERE task_id = %s
        )
        SELECT DISTINCT u.id, u.name, u.email,
               array_agg(s.name) as matching_skills,
               COUNT(DISTINCT cs.skill_id) as matching_skill_count
        FROM users u
        JOIN contributor_skills cs ON u.id = cs.user_id
        JOIN skills s ON cs.skill_id = s.id
        WHERE cs.skill_id IN (SELECT skill_id FROM task_skills)
        AND u.is_active = true
        """
        
        params = [task_id]
        if exclude_user_id:
            query += " AND u.id != %s"
            params.append(exclude_user_id)
            
        query += """
        GROUP BY u.id, u.name, u.email
        ORDER BY matching_skill_count DESC;
        """
        
        with get_db_cursor() as cursor:
            cursor.execute(query, tuple(params))
            return cursor.fetchall()

    @staticmethod
    def assign_evaluators_by_skills(
        task_id: int,
        num_evaluators: int,
        exclude_user_id: Optional[int] = None
    ) -> List[Dict]:
        """
        Automatically assign evaluators based on matching skills.
        
        This method implements the core skill-based matching logic:
        1. Finds users with matching skills using get_users_with_matching_skills
        2. Selects the top N users with the most matching skills
        3. Assigns them as evaluators for the task
        
        Args:
            task_id (int): The ID of the task to assign evaluators to
            num_evaluators (int): Number of evaluators to assign
            exclude_user_id (Optional[int]): User ID to exclude from assignment
            
        Returns:
            List[Dict]: List of assigned evaluators with their details
        """
        # First, get users with matching skills
        potential_evaluators = TaskEvaluatorRepository.get_users_with_matching_skills(
            task_id=task_id,
            exclude_user_id=exclude_user_id
        )
        
        # Take the top N users with most matching skills
        selected_evaluators = potential_evaluators[:num_evaluators]
        
        # Assign them as evaluators
        results = []
        with get_db_cursor(commit=True) as cursor:
            for evaluator in selected_evaluators:
                query = """
                INSERT INTO task_evaluators (task_id, evaluator_id)
                VALUES (%s, %s)
                ON CONFLICT (task_id, evaluator_id) DO NOTHING
                RETURNING *;
                """
                cursor.execute(query, (task_id, evaluator["id"]))
                result = cursor.fetchone()
                if result:
                    results.append({**result, **evaluator})
        
        return results

    @staticmethod
    def assign_evaluators(task_id: int, evaluator_ids: List[int]) -> List[Dict]:
        """
        Manually assign specific evaluators to a task.
        
        This method allows for manual assignment of evaluators, bypassing the skill-based
        matching system. Useful for cases where specific evaluators need to be assigned
        regardless of their skills.
        
        Args:
            task_id (int): The ID of the task to assign evaluators to
            evaluator_ids (List[int]): List of user IDs to assign as evaluators
            
        Returns:
            List[Dict]: List of assigned evaluators with their details
        """
        query = """
        INSERT INTO task_evaluators (task_id, evaluator_id)
        VALUES (%s, %s)
        ON CONFLICT (task_id, evaluator_id) DO NOTHING
        RETURNING *;
        """
        
        results = []
        with get_db_cursor(commit=True) as cursor:
            for evaluator_id in evaluator_ids:
                cursor.execute(query, (task_id, evaluator_id))
                result = cursor.fetchone()
                if result:
                    results.append(result)
        return results

    @staticmethod
    def get_task_evaluators(task_id: int) -> List[Dict]:
        """
        Get all evaluators assigned to a task with their details.
        
        This method retrieves comprehensive information about evaluators assigned to a task,
        including their personal details and skills.
        
        Args:
            task_id (int): The ID of the task to get evaluators for
            
        Returns:
            List[Dict]: List of evaluators with their details and skills
        """
        query = """
        SELECT te.*, 
               u.name as evaluator_name, 
               u.email as evaluator_email,
               array_agg(s.name) as evaluator_skills
        FROM task_evaluators te
        JOIN users u ON te.evaluator_id = u.id
        LEFT JOIN contributor_skills cs ON u.id = cs.user_id
        LEFT JOIN skills s ON cs.skill_id = s.id
        WHERE te.task_id = %s
        GROUP BY te.id, u.name, u.email;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (task_id,))
            return cursor.fetchall()

    @staticmethod
    def get_evaluator_tasks(evaluator_id: int) -> List[Dict]:
        """
        Get all tasks assigned to an evaluator with their details.
        
        This method retrieves comprehensive information about tasks assigned to an evaluator,
        including task details and required skills.
        
        Args:
            evaluator_id (int): The ID of the evaluator to get tasks for
            
        Returns:
            List[Dict]: List of tasks with their details and required skills
        """
        query = """
        SELECT te.*, 
               t.title as task_title, 
               t.description as task_description,
               t.status as task_status, 
               t.deadline,
               array_agg(s.name) as task_skills
        FROM task_evaluators te
        JOIN tasks t ON te.task_id = t.id
        LEFT JOIN task_skills ts ON t.id = ts.task_id
        LEFT JOIN skills s ON ts.skill_id = s.id
        WHERE te.evaluator_id = %s
        GROUP BY te.id, t.title, t.description, t.status, t.deadline;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (evaluator_id,))
            return cursor.fetchall()

    @staticmethod
    def update_evaluator_status(task_id: int, evaluator_id: int, status: str) -> Optional[Dict]:
        """
        Update the status of an evaluator for a task.
        
        This method allows updating the status of an evaluator (e.g., active, completed, declined)
        for a specific task.
        
        Args:
            task_id (int): The ID of the task
            evaluator_id (int): The ID of the evaluator
            status (str): The new status to set
            
        Returns:
            Optional[Dict]: Updated evaluator record if successful, None otherwise
        """
        query = """
        UPDATE task_evaluators
        SET status = %s
        WHERE task_id = %s AND evaluator_id = %s
        RETURNING *;
        """
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, (status, task_id, evaluator_id))
            return cursor.fetchone()

    @staticmethod
    def remove_evaluator(task_id: int, evaluator_id: int) -> bool:
        """
        Remove an evaluator from a task.
        
        This method removes an evaluator's assignment from a task.
        
        Args:
            task_id (int): The ID of the task
            evaluator_id (int): The ID of the evaluator to remove
            
        Returns:
            bool: True if the evaluator was removed, False otherwise
        """
        query = """
        DELETE FROM task_evaluators
        WHERE task_id = %s AND evaluator_id = %s;
        """
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, (task_id, evaluator_id))
            return cursor.rowcount > 0

    @staticmethod
    def get_active_evaluators(task_id: int) -> List[Dict]:
        """
        Get all active evaluators for a task.
        
        This method retrieves only the active evaluators assigned to a task,
        including their personal details and skills.
        
        Args:
            task_id (int): The ID of the task to get active evaluators for
            
        Returns:
            List[Dict]: List of active evaluators with their details and skills
        """
        query = """
        SELECT te.*, 
               u.name as evaluator_name, 
               u.email as evaluator_email,
               array_agg(s.name) as evaluator_skills
        FROM task_evaluators te
        JOIN users u ON te.evaluator_id = u.id
        LEFT JOIN contributor_skills cs ON u.id = cs.user_id
        LEFT JOIN skills s ON cs.skill_id = s.id
        WHERE te.task_id = %s AND te.status = 'active'
        GROUP BY te.id, u.name, u.email;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (task_id,))
            return cursor.fetchall()

    @staticmethod
    def check_is_evaluator(task_id: int, evaluator_id: int) -> bool:
        """
        Check if a user is an evaluator for a task.
        
        This method provides a quick way to verify if a user is assigned as an evaluator
        for a specific task.
        
        Args:
            task_id (int): The ID of the task
            evaluator_id (int): The ID of the user to check
            
        Returns:
            bool: True if the user is an evaluator for the task, False otherwise
        """
        query = """
        SELECT EXISTS(
            SELECT 1 FROM task_evaluators
            WHERE task_id = %s AND evaluator_id = %s
        ) as exists;
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (task_id, evaluator_id))
            result = cursor.fetchone()
            return result["exists"] 