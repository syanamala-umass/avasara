import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.repositories.task_assignment_repository import TaskAssignmentRepository
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignmentUpdate
from app.database.connection import get_db_cursor
import time

def print_separator():
    print("\n" + "="*50 + "\n")

def print_step(step_num, description):
    print(f"\nStep {step_num}: {description}")
    print("-" * 30)

def get_or_create_users():
    """Get existing users or create new ones if they don't exist"""
    with get_db_cursor() as cursor:
        # Check if users exist
        cursor.execute("""
            SELECT id, username FROM users 
            WHERE email IN ('john@example.com', 'jane@example.com', 'bob@example.com')
        """)
        existing_users = cursor.fetchall()
        
        if len(existing_users) == 3:
            print("Using existing test users:")
            for user in existing_users:
                print(f"- {user['username']} (ID: {user['id']})")
            return existing_users
            
        # Create new users if they don't exist
        print("Creating new test users:")
        cursor.execute("""
            INSERT INTO users (email, username, hashed_password, is_startup, is_active) VALUES 
            ('john@example.com', 'johndoe', 'dummy_hash', false, true),
            ('jane@example.com', 'janesmith', 'dummy_hash', false, true),
            ('bob@example.com', 'bobwilson', 'dummy_hash', false, true)
            RETURNING id, username;
        """)
        new_users = cursor.fetchall()
        for user in new_users:
            print(f"- {user['username']} (ID: {user['id']})")
        return new_users

def demo_task_flow():
    print("Starting Task Selection and Completion Flow Demo")
    print_separator()

    # Step 1: Get or create test users
    print_step(1, "Setting Up Test Users")
    users = get_or_create_users()

    # Step 2: Create an open task
    print_step(2, "Creating an Open Task")
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("""
            INSERT INTO tasks (title, description, status, max_parallel_contributors) VALUES 
            ('Implement User Authentication', 'Create a secure authentication system with JWT', 'open', 2)
            RETURNING id, title, status;
        """)
        task = cursor.fetchone()
        print(f"Created task: {task['title']} (ID: {task['id']})")
        print(f"Initial status: {task['status']}")
        print("Task is now open for contributors to pick up")

    # Step 3: First user picks up the task
    print_step(3, "John Picks Up the Task")
    assignment_data = TaskAssignmentCreate(
        task_id=task['id'],
        notes="John has chosen to work on this task"
    )
    
    assignment = TaskAssignmentRepository.create_assignment(
        assignment=assignment_data,
        user_id=users[0]['id']
    )
    print(f"John has picked up the task (Assignment ID: {assignment['id']})")
    
    # Verify task status
    with get_db_cursor() as cursor:
        cursor.execute("SELECT status FROM tasks WHERE id = %s", (task['id'],))
        task_status = cursor.fetchone()
        print(f"Task status after first pickup: {task_status['status']}")

    # Step 4: First user completes the task
    print_step(4, "John Completes the Task")
    update_data = TaskAssignmentUpdate(
        status="completed",
        notes="Authentication system implemented successfully"
    )
    
    updated_assignment = TaskAssignmentRepository.update_assignment(
        assignment_id=assignment['id'],
        assignment=update_data
    )
    print(f"John has completed the task at: {updated_assignment['completed_at']}")
    
    # Verify task status
    with get_db_cursor() as cursor:
        cursor.execute("SELECT status FROM tasks WHERE id = %s", (task['id'],))
        task_status = cursor.fetchone()
        print(f"Task status after completion: {task_status['status']}")

    # Step 5: Second user picks up the task for peer review
    print_step(5, "Jane Picks Up the Task for Peer Review")
    second_assignment_data = TaskAssignmentCreate(
        task_id=task['id'],
        notes="Jane has chosen to review this task"
    )
    
    second_assignment = TaskAssignmentRepository.create_assignment(
        assignment=second_assignment_data,
        user_id=users[1]['id']
    )
    print(f"Jane has picked up the task for review (Assignment ID: {second_assignment['id']})")

    # Step 6: Show available peer reviewers
    print_step(6, "Checking Available Peer Reviewers")
    contributors = TaskAssignmentRepository.get_completed_task_contributors(
        task_id=task['id'],
        exclude_assignment_id=second_assignment['id']
    )
    print(f"Number of available peer reviewers: {len(contributors)}")
    for contributor in contributors:
        print(f"- {contributor['username']}")

    # Step 7: Second user completes peer review
    print_step(7, "Jane Completes Peer Review")
    review_update = TaskAssignmentUpdate(
        status="completed",
        notes="Peer review completed with positive feedback"
    )
    
    TaskAssignmentRepository.update_assignment(
        assignment_id=second_assignment['id'],
        assignment=review_update
    )
    print("Jane has completed the peer review")

    # Step 8: Show final state
    print_step(8, "Final State")
    with get_db_cursor() as cursor:
        # Get task status
        cursor.execute("""
            SELECT t.*, 
                   COUNT(ta.id) as total_assignments,
                   COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) as completed_assignments
            FROM tasks t
            LEFT JOIN task_assignments ta ON t.id = ta.task_id
            WHERE t.id = %s
            GROUP BY t.id;
        """, (task['id'],))
        final_task = cursor.fetchone()
        
        print(f"Task: {final_task['title']}")
        print(f"Status: {final_task['status']}")
        print(f"Total contributors: {final_task['total_assignments']}")
        print(f"Completed contributions: {final_task['completed_assignments']}")

    print_separator()
    print("Demo completed successfully!")

if __name__ == "__main__":
    try:
        demo_task_flow()
    except Exception as e:
        print(f"Error during demo: {str(e)}")
    finally:
        # Clean up demo data in correct order
        with get_db_cursor(commit=True) as cursor:
            # First delete task assignments
            cursor.execute("""
                DELETE FROM task_assignments 
                WHERE task_id IN (
                    SELECT id FROM tasks 
                    WHERE title = 'Implement User Authentication'
                )
            """)
            # Then delete the task
            cursor.execute("DELETE FROM tasks WHERE title = 'Implement User Authentication'")
            # Note: We're not deleting users anymore since they might be used in other demos 