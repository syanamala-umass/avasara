import sys
import os
import logging
import pdb
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import get_db_cursor, get_db
from app.repositories.task_assignment_repository import TaskAssignmentRepository
from app.schemas.task_assignment import TaskAssignmentCreate, TaskAssignmentUpdate
from app.core.security import create_access_token
from app.schemas.user import UserCreate
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from contextlib import contextmanager

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create test client
client = TestClient(app)

def print_separator():
    print("\n" + "="*50 + "\n")

def print_step(step_num, description):
    print(f"\nStep {step_num}: {description}")
    print("-" * 30)

def log_database_state(cursor, table_name):
    """Log the current state of a database table"""
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    logger.debug(f"\nCurrent state of {table_name}:")
    for row in rows:
        logger.debug(f"Row: {dict(row)}")

def show_task_status(task_id=None):
    """Show current status of tasks"""
    logger.debug(f"Showing task status for task_id: {task_id}")
    with get_db_cursor() as cursor:
        if task_id:
            cursor.execute("""
                SELECT t.*, 
                       COUNT(ta.id) as total_assignments,
                       COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) as completed_assignments
                FROM tasks t
                LEFT JOIN task_assignments ta ON t.id = ta.task_id
                WHERE t.id = %s
                GROUP BY t.id;
            """, (task_id,))
        else:
            cursor.execute("""
                SELECT t.*, 
                       COUNT(ta.id) as total_assignments,
                       COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) as completed_assignments
                FROM tasks t
                LEFT JOIN task_assignments ta ON t.id = ta.task_id
                GROUP BY t.id;
            """)
        tasks = cursor.fetchall()
        logger.debug(f"Found {len(tasks)} tasks")
        print("\nCurrent Tasks:")
        for task in tasks:
            print(f"\nTask: {task['title']}")
            print(f"ID: {task['id']}")
            print(f"Status: {task['status']}")
            print(f"Total contributors: {task['total_assignments']}")
            print(f"Completed contributions: {task['completed_assignments']}")

def show_assignments(task_id=None):
    """Show current task assignments"""
    logger.debug(f"Showing assignments for task_id: {task_id}")
    with get_db_cursor() as cursor:
        if task_id:
            cursor.execute("""
                SELECT ta.*, u.username
                FROM task_assignments ta
                JOIN users u ON ta.user_id = u.id
                WHERE ta.task_id = %s;
            """, (task_id,))
        else:
            cursor.execute("""
                SELECT ta.*, u.username
                FROM task_assignments ta
                JOIN users u ON ta.user_id = u.id;
            """)
        assignments = cursor.fetchall()
        logger.debug(f"Found {len(assignments)} assignments")
        print("\nCurrent Assignments:")
        for assignment in assignments:
            print(f"\nAssignment ID: {assignment['id']}")
            print(f"Task ID: {assignment['task_id']}")
            print(f"User: {assignment['username']}")
            print(f"Type: {assignment['assignment_type']}")
            print(f"Status: {assignment['status']}")
            print(f"Notes: {assignment['notes']}")
            print(f"Created at: {assignment['created_at']}")
            if assignment['completed_at']:
                print(f"Completed at: {assignment['completed_at']}")

def get_or_create_test_users(cursor):
    """Get existing test users or create them if they don't exist"""
    test_users = [
        ('john@example.com', 'johndoe', 'password123'),
        ('jane@example.com', 'janesmith', 'password123'),
        ('bob@example.com', 'bobwilson', 'password123')
    ]
    
    users = []
    for email, username, password in test_users:
        # Check if user exists
        cursor.execute("""
            SELECT id, email, username FROM users 
            WHERE email = %s
        """, (email,))
        user = cursor.fetchone()
        
        if not user:
            # Create user if doesn't exist
            user_data = UserCreate(
                email=email,
                username=username,
                password=password
            )
            response = client.post("/auth/register", json=user_data.dict())
            if response.status_code == 200:
                user = response.json()
                logger.debug(f"Created new user: {username}")
            else:
                logger.error(f"Failed to create user {username}: {response.json()}")
                continue
        else:
            logger.debug(f"Using existing user: {username}")
        
        users.append(user)
    
    return users

def get_auth_headers(user_id: int):
    """Create authentication headers for a user"""
    # Get the user's email from their ID
    with get_db_cursor() as cursor:
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        email = user['email']
    
    access_token = create_access_token(data={"sub": email})
    return {"Authorization": f"Bearer {access_token}"}

def create_user(db: Session, email: str, password: str, username: str) -> dict:
    """Create a new user"""
    user_data = {
        "email": email,
        "password": password,
        "username": username
    }
    
    response = client.post(
        "/auth/register",
        json=user_data
    )
    response.raise_for_status()
    
    # Get the user's ID from the database
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            raise Exception(f"Failed to find created user with email {email}")
        
        return {"id": user['id'], "email": email}

def create_startup(db: Session, owner_id: int, name: str, description: str) -> dict:
    """Create a new startup"""
    # Get auth token for the user
    headers = get_auth_headers(owner_id)
    
    startup_data = {
        "name": name,
        "description": description
    }
    
    response = client.post(
        "/startups/",
        json=startup_data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def test_route(route: str, method: str = "GET", json_data: dict = None, user_id: int = None):
    """Test an API route and print the response"""
    print(f"\nTesting {method} {route}")
    print("-" * 30)
    
    headers = {}
    if user_id:
        # Map user_id to the correct email
        email_map = {
            1: "john@example.com",
            2: "jane@example.com",
            3: "bob@example.com"
        }
        # First get a token for the user
        login_data = {
            "username": email_map.get(user_id, "john@example.com"),  # Default to john if user_id not found
            "password": "password123"
        }
        login_response = client.post("/auth/token", data=login_data)
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print(f"Failed to get token: {login_response.json()}")
            return login_response
    
    if method == "GET":
        response = client.get(route, headers=headers)
    elif method == "POST":
        response = client.post(route, json=json_data, headers=headers)
    elif method == "PUT":
        response = client.put(route, json=json_data, headers=headers)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    print(f"Status code: {response.status_code}")
    print("Response:")
    print(response.json())
    return response

def create_task(db: Session, startup_id: int, title: str, description: str) -> dict:
    """Create a new task"""
    # Get the startup owner's ID
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT s.user_id 
            FROM startups s 
            WHERE s.id = %s
        """, (startup_id,))
        startup_owner = cursor.fetchone()
        if not startup_owner:
            raise ValueError(f"Startup with ID {startup_id} not found")
        
        owner_id = startup_owner['user_id']
    
    # Get auth token for the startup owner
    headers = get_auth_headers(owner_id)
    
    task_data = {
        "title": title,
        "description": description,
        "status": "open",
        "max_parallel_contributors": 2,
        "compensation_type": "fixed",
        "compensation_amount": 100,
        "deadline": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    response = client.post(
        f"/tasks/?startup_id={startup_id}",
        json=task_data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def pick_up_task(db: Session, task_id: int, user_id: int) -> dict:
    """A user picks up a task to work on"""
    assignment_data = {
        "task_id": task_id,
        "assignment_type": "task",
        "notes": f"User {user_id} has picked up this task to work on"
    }
    
    # Get auth token for the user
    headers = get_auth_headers(user_id)
    
    response = client.post(
        "/task-assignments/",
        json=assignment_data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def complete_task(db: Session, task_id: int) -> dict:
    """Complete a task assignment"""
    # First get the assignment ID for this task
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT id, user_id, status 
            FROM task_assignments 
            WHERE task_id = %s AND assignment_type = 'task'
        """, (task_id,))
        assignment = cursor.fetchone()
        if not assignment:
            raise ValueError(f"No task assignment found for task {task_id}")
        
        if assignment['status'] == 'completed':
            raise ValueError(f"Task {task_id} is already completed")
        
        assignment_id = assignment['id']
        user_id = assignment['user_id']
    
    # Update the assignment status
    update_data = {
        "status": "completed",
        "notes": "Task completed successfully"
    }
    
    headers = get_auth_headers(user_id)
    
    logger.debug(f"Sending update request with data: {update_data}")
    response = client.put(
        f"/task-assignments/{assignment_id}",
        json=update_data,
        headers=headers
    )
    if response.status_code != 200:
        logger.error(f"Error response: {response.text}")
    response.raise_for_status()
    return response.json()

def pick_up_review(db: Session, task_id: int, user_id: int) -> dict:
    """A user picks up a task to review"""
    assignment_data = {
        "task_id": task_id,
        "assignment_type": "review",
        "notes": f"User {user_id} has picked up this task for review"
    }
    
    # Get auth token for the user
    headers = get_auth_headers(user_id)
    
    response = client.post(
        "/task-assignments/",
        json=assignment_data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def submit_peer_evaluation(db: Session, task_id: int, evaluator_id: int, evaluatee_id: int, assignment_id: int) -> dict:
    """Submit a peer evaluation for a task"""
    evaluation_data = {
        "task_id": task_id,
        "evaluator_id": evaluator_id,
        "evaluatee_id": evaluatee_id,
        "assignment_id": assignment_id,
        "technical_score": 4.5,
        "collaboration_score": 4.0,
        "innovation_score": 4.2,
        "reliability_score": 4.8,
        "strengths": "Great technical skills and communication",
        "areas_for_improvement": "Could improve documentation",
        "additional_comments": "Overall excellent work"
    }
    
    # Get auth token for the evaluator
    headers = get_auth_headers(evaluator_id)
    
    response = client.post(
        "/peer-evaluations/",
        json=evaluation_data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

def cleanup_demo_data(db: Session):
    """Clean up all demo data"""
    with get_db_cursor(commit=True) as cursor:
        # Delete in correct order to respect foreign key constraints
        cursor.execute("DELETE FROM peer_evaluations")  # Delete peer evaluations first
        cursor.execute("DELETE FROM reviews")  # Then reviews
        cursor.execute("DELETE FROM task_skills")  # Then task skills
        cursor.execute("DELETE FROM task_assignments")  # Then task assignments
        cursor.execute("DELETE FROM tasks")  # Then tasks
        cursor.execute("DELETE FROM contributor_skill")  # Then contributor skills
        cursor.execute("DELETE FROM startups")  # Then startups
        cursor.execute("DELETE FROM users WHERE email LIKE '%@example.com'")  # Finally users

def interactive_demo():
    """Run the interactive demo"""
    try:
        # Get database session
        db = next(get_db())
        
        # Create test users
        print("\nCreating test users...")
        john = create_user(db, "john@example.com", "password123", "johndoe")
        jane = create_user(db, "jane@example.com", "password123", "janesmith")
        bob = create_user(db, "bob@example.com", "password123", "bobwilson")
        startup_owner = create_user(db, "startup@example.com", "password123", "startupowner")
        input("\nPress Enter to continue after checking users table...")
        
        # Create startup
        print("\nCreating startup...")
        startup = create_startup(db, startup_owner["id"], "Tech Innovators", "We build innovative solutions")
        input("\nPress Enter to continue after checking startups table...")
        
        # Create tasks
        print("\nCreating tasks...")
        task1 = create_task(db, startup["id"], "Implement User Authentication", "Create a secure authentication system with JWT")
        task2 = create_task(db, startup["id"], "Design Database Schema", "Design and implement the database schema for the application")
        input("\nPress Enter to continue after checking tasks table...")
        
        # Show tasks
        print("\nCurrent tasks:")
        show_task_status()
        input("\nPress Enter to continue after reviewing task status...")
        
        # Users pick up tasks
        print("\nUsers picking up tasks...")
        john_assignment = pick_up_task(db, task1["id"], john["id"])
        jane_assignment = pick_up_task(db, task2["id"], jane["id"])
        input("\nPress Enter to continue after checking task assignments...")
        
        # Show assignments
        print("\nCurrent assignments:")
        show_assignments()
        input("\nPress Enter to continue after reviewing assignments...")
        
        # Complete tasks
        print("\nCompleting tasks...")
        complete_task(db, task1["id"])
        complete_task(db, task2["id"])
        input("\nPress Enter to continue after checking completed tasks...")
        
        # Show task status after completion
        print("\nTask status after completion:")
        show_task_status()
        input("\nPress Enter to continue after reviewing task completion status...")
        
        # Users pick up reviews
        print("\nUsers picking up reviews...")
        bob_review = pick_up_review(db, task1["id"], bob["id"])
        startup_owner_review = pick_up_review(db, task2["id"], startup_owner["id"])
        input("\nPress Enter to continue after checking review assignments...")
        
        # Show assignments including reviews
        print("\nCurrent assignments including reviews:")
        show_assignments()
        input("\nPress Enter to continue after reviewing assignments with reviews...")
        
        # Submit peer evaluations
        print("\nSubmitting peer evaluations...")
        submit_peer_evaluation(db, task1["id"], bob["id"], john["id"], john_assignment["id"])
        submit_peer_evaluation(db, task2["id"], startup_owner["id"], jane["id"], jane_assignment["id"])
        input("\nPress Enter to continue after checking peer evaluations...")
        
        # Show final state
        print("\nFinal task state:")
        show_task_status()
        print("\nFinal assignment state:")
        show_assignments()
        input("\nPress Enter to continue to cleanup...")
        
    except Exception as e:
        print(f"Error during demo: {str(e)}")
        logging.error(f"Error during demo: {str(e)}", exc_info=True)
    finally:
        print("\nCleaning up demo data...")
        cleanup_demo_data(db)

if __name__ == "__main__":
    try:
        interactive_demo()
    except Exception as e:
        print(f"Error during demo: {str(e)}")
        # Debug breakpoint for errors
        pdb.set_trace() 