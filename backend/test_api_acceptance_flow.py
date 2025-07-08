#!/usr/bin/env python3
"""
API-based test script for the acceptance system flow.
This script uses actual API calls to test the real acceptance process.
"""

import requests
import json
import time
import logging
from datetime import datetime
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('test_api_acceptance.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
API_BASE_URL = 'http://localhost:8000'
API_BASE = API_BASE_URL  # Remove the /api/v1 prefix since routers are mounted directly

DB_CONFIG = {
    'host': 'localhost',
    'database': 'startup_platform',
    'user': 'avasara_user',
    'password': 'KINGpin@123'
}

def log_step(step_name, details=""):
    """Log a test step with timestamp"""
    logger.info(f"🔄 STEP: {step_name}")
    if details:
        logger.info(f"   Details: {details}")

def log_success(message):
    """Log a success message"""
    logger.info(f"✅ SUCCESS: {message}")

def log_error(message):
    """Log an error message"""
    logger.error(f"❌ ERROR: {message}")

def log_info(message):
    """Log an info message"""
    logger.info(f"ℹ️  INFO: {message}")

def set_user_verified(email):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET email_verified=TRUE, is_active=TRUE WHERE email=%s", (email,))
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Set email_verified and is_active to TRUE for {email}")
    except Exception as e:
        logger.error(f"Failed to set user verified: {e}")

def create_test_user(username, email, password="testpass123"):
    """Create a test user via API."""
    log_step(f"Creating user: {username}")
    
    user_data = {
        "username": username,
        "email": email,
        "password": password,
        "skills": []  # Empty skills list - skills will be added later via onboarding
    }
    
    response = requests.post(f"{API_BASE}/auth/register", json=user_data)
    
    if response.status_code == 200:
        log_success(f"User {username} registered successfully")
        set_user_verified(email)
        # Try to get user details by logging in
        login_data = {
            "username": email,  # Use email instead of username
            "password": password
        }
        login_response = requests.post(f"{API_BASE}/auth/token", data=login_data)
        if login_response.status_code == 200:
            user_info = login_response.json()["user"]
            log_success(f"User {username} login successful, ID: {user_info.get('id')}")
            return user_info
        else:
            log_error(f"Failed to login user {username} after registration: {login_response.text}")
            return None
    else:
        log_error(f"Failed to create user {username}: {response.text}")
        return None

def login_user(username, password="testpass123"):
    """Login a user and return access token."""
    log_step(f"Logging in user: {username}")
    
    # For this system, username should be the email
    email = username  # Assuming username parameter is actually the email
    
    login_data = {
        "username": email,  # Use email as username
        "password": password
    }
    
    response = requests.post(f"{API_BASE}/auth/token", data=login_data)
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        log_success(f"User {username} logged in successfully")
        return token
    else:
        log_error(f"Failed to login user {username}: {response.text}")
        return None

def create_test_task(token, title, description, skills_required):
    """Create a test task via API."""
    log_step(f"Creating task: {title}")
    
    task_data = {
        "title": title,
        "description": description,
        "category": "development",
        "compensation_amount": 150,
        "compensation_type": "cash",
        "review_compensation_amount": 25,
        "review_compensation_type": "cash",
        "deadline": "2024-12-31",
        "num_reviewers": 2,
        "skill_review_requirements": skills_required
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{API_BASE}/tasks/", json=task_data, headers=headers)
    
    if response.status_code == 201:
        task = response.json()
        log_success(f"Task '{title}' created with ID: {task['id']}")
        return task
    else:
        log_error(f"Failed to create task: {response.text}")
        return None

def assign_task_to_user(token, task_id, assignment_type="task"):
    """Assign a task to the current user via API."""
    log_step(f"Assigning {assignment_type} to user for task {task_id}")
    
    assignment_data = {
        "task_id": task_id,
        "assignment_type": assignment_type
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{API_BASE}/task-assignments/", json=assignment_data, headers=headers)
    
    if response.status_code == 201:
        assignment = response.json()
        log_success(f"Task {task_id} assigned successfully. Assignment ID: {assignment['id']}")
        return assignment
    else:
        log_error(f"Failed to assign task: {response.text}")
        return None

def submit_task_work(token, assignment_id, notes="Test submission"):
    """Submit work for a task assignment via API."""
    log_step(f"Submitting work for assignment {assignment_id}")
    
    submission_data = {
        "status": "submitted",
        "notes": notes
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(f"{API_BASE}/task-assignments/{assignment_id}", json=submission_data, headers=headers)
    
    if response.status_code == 200:
        log_success(f"Work submitted successfully for assignment {assignment_id}")
        return response.json()
    else:
        log_error(f"Failed to submit work: {response.text}")
        return None

def get_review_tasks(token):
    """Get available review tasks via API."""
    log_step("Fetching available review tasks")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/review-tasks/", headers=headers)
    
    if response.status_code == 200:
        review_tasks = response.json()
        log_success(f"Found {len(review_tasks)} available review tasks")
        return review_tasks
    else:
        log_error(f"Failed to get review tasks: {response.text}")
        return []

def assign_review_task(token, review_task_id):
    """Assign a review task to the current user via API."""
    log_step(f"Assigning review task {review_task_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{API_BASE}/review-tasks/{review_task_id}/assign", headers=headers)
    
    if response.status_code == 200:
        assignment = response.json()
        log_success(f"Review task {review_task_id} assigned successfully. Assignment ID: {assignment['id']}")
        return assignment
    else:
        log_error(f"Failed to assign review task: {response.text}")
        return None

def submit_review(token, assignment_id, accept_reject=True, scores=None, feedback=""):
    """Submit a review for a review assignment via API."""
    log_step(f"Submitting review for assignment {assignment_id} (Accept: {accept_reject})")
    
    if scores is None:
        scores = {
            "technical_score": 4.5 if accept_reject else 2.0,
            "collaboration_score": 4.0 if accept_reject else 2.5,
            "innovation_score": 4.2 if accept_reject else 2.2,
            "reliability_score": 4.8 if accept_reject else 1.8
        }
    
    review_data = {
        "status": "completed",
        "accept_reject": accept_reject,
        "technical_score": scores["technical_score"],
        "collaboration_score": scores["collaboration_score"],
        "innovation_score": scores["innovation_score"],
        "reliability_score": scores["reliability_score"],
        "strengths": "Excellent work! Very well done." if accept_reject else "Needs improvement in several areas.",
        "areas_for_improvement": "Minor improvements needed" if accept_reject else "Multiple areas need work",
        "additional_comments": feedback
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(f"{API_BASE}/review-tasks/assignments/{assignment_id}", json=review_data, headers=headers)
    
    if response.status_code == 200:
        log_success(f"Review submitted successfully for assignment {assignment_id}")
        return response.json()
    else:
        log_error(f"Failed to submit review: {response.text}")
        return None

def check_assignment_status(token, assignment_id):
    """Check the status of a task assignment via API."""
    log_step(f"Checking status of assignment {assignment_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/task-assignments/{assignment_id}", headers=headers)
    
    if response.status_code == 200:
        assignment = response.json()
        status = assignment['status']
        log_info(f"Assignment {assignment_id} status: {status}")
        return status
    else:
        log_error(f"Failed to check assignment status: {response.text}")
        return None

def check_task_status(token, task_id):
    """Check the status of a task via API."""
    log_step(f"Checking status of task {task_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/tasks/{task_id}", headers=headers)
    
    if response.status_code == 200:
        task = response.json()
        status = task['status']
        log_info(f"Task {task_id} status: {status}")
        return status
    else:
        log_error(f"Failed to check task status: {response.text}")
        return None

def check_user_skills(token):
    """Check user skills via API."""
    log_step("Checking user skills")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/ratings/my-skills", headers=headers)
    
    if response.status_code == 200:
        skills = response.json()
        log_success(f"Found {len(skills)} skills for user")
        for skill in skills:
            log_info(f"  {skill.get('skill_name', skill.get('name', 'Unknown'))}: {skill.get('rating', 'N/A')}")
        return skills
    else:
        log_error(f"Failed to get user skills: {response.text}")
        return []

def add_skills_to_user(token, skill_names):
    """Add skills to a user via API."""
    log_step(f"Adding skills to user: {skill_names}")
    
    # First, get all available skills
    headers = {"Authorization": f"Bearer {token}"}
    skills_response = requests.get(f"{API_BASE}/skills/", headers=headers)
    
    if skills_response.status_code != 200:
        log_error(f"Failed to get skills: {skills_response.text}")
        return False
    
    all_skills = skills_response.json()
    skill_ids = []
    
    # Find skill IDs for the requested skills
    for skill_name in skill_names:
        skill = next((s for s in all_skills if s['name'].lower() == skill_name.lower()), None)
        if skill:
            skill_ids.append(skill['id'])
            log_info(f"Found skill '{skill_name}' with ID: {skill['id']}")
        else:
            log_error(f"Skill '{skill_name}' not found")
            return False
    
    # Get user ID from token
    user_response = requests.get(f"{API_BASE}/users/me", headers=headers)
    if user_response.status_code != 200:
        log_error(f"Failed to get user info: {user_response.text}")
        return False
    
    user_data = user_response.json()
    user_id = user_data['id']
    
    # Add skills to user
    add_skills_data = {
        "skill_ids": skill_ids
    }
    
    response = requests.post(f"{API_BASE}/users/{user_id}/skills", json=add_skills_data, headers=headers)
    
    if response.status_code == 200:
        log_success(f"Added {len(skill_ids)} skills to user")
        return True
    else:
        log_error(f"Failed to add skills: {response.text}")
        return False

def collect_review_tasks_from_db(assignment_id):
    """Collect review tasks directly from database for a given assignment."""
    log_step(f"Collecting review tasks from database for assignment {assignment_id}")
    
    try:
        conn = psycopg2.connect(
            host='localhost',
            database='startup_platform',
            user='avasara_user',
            password='KINGpin@123'
        )
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, title, status, parent_task_id, assignment_being_reviewed_id
                FROM review_tasks
                WHERE assignment_being_reviewed_id = %s
                ORDER BY id
            """, (assignment_id,))
            
            review_tasks = cursor.fetchall()
            log_success(f"Found {len(review_tasks)} review tasks in database for assignment {assignment_id}")
            
            for task in review_tasks:
                log_info(f"  Review task {task['id']}: {task['title']} (status: {task['status']})")
            
            return review_tasks
            
    except Exception as e:
        log_error(f"Failed to collect review tasks from database: {e}")
        return []

def assign_review_task_direct(token, review_task_id):
    """Assign a review task directly using the database."""
    log_step(f"Assigning review task {review_task_id} directly")
    
    try:
        # Get user ID from token
        headers = {"Authorization": f"Bearer {token}"}
        user_response = requests.get(f"{API_BASE}/users/me", headers=headers)
        
        if user_response.status_code != 200:
            log_error(f"Failed to get user info: {user_response.text}")
            return None
        
        user_data = user_response.json()
        user_id = user_data['id']
        
        conn = psycopg2.connect(
            host='localhost',
            database='startup_platform',
            user='avasara_user',
            password='KINGpin@123'
        )
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if review task exists and is available
            cursor.execute("""
                SELECT id, status FROM review_tasks WHERE id = %s
            """, (review_task_id,))
            
            review_task = cursor.fetchone()
            if not review_task:
                log_error(f"Review task {review_task_id} not found")
                return None
            
            if review_task['status'] != 'open':
                log_error(f"Review task {review_task_id} is not available (status: {review_task['status']})")
                return None
            
            # Create the review assignment
            cursor.execute("""
                INSERT INTO review_task_assignments (
                    review_task_id, reviewer_id, status
                ) VALUES (%s, %s, 'assigned')
                RETURNING id, review_task_id, reviewer_id, status, assigned_at, updated_at
            """, (review_task_id, user_id))
            
            assignment = cursor.fetchone()
            
            # Update review task status to in_progress
            cursor.execute("""
                UPDATE review_tasks 
                SET status = 'in_progress' 
                WHERE id = %s
            """, (review_task_id,))
            
            # Commit the transaction
            conn.commit()
            
            log_success(f"Review task {review_task_id} assigned successfully. Assignment ID: {assignment['id']}")
            return assignment
            
    except Exception as e:
        log_error(f"Failed to assign review task: {e}")
        return None

def submit_review_direct(token, assignment_id, accept_reject=True, scores=None, feedback=""):
    """Submit a review directly using the database."""
    log_step(f"Submitting review for assignment {assignment_id} directly (Accept: {accept_reject})")
    
    if scores is None:
        scores = {
            "technical_score": 4.5 if accept_reject else 2.0,
            "collaboration_score": 4.0 if accept_reject else 2.5,
            "innovation_score": 4.2 if accept_reject else 2.2,
            "reliability_score": 4.8 if accept_reject else 1.8
        }
    
    try:
        # Get user ID from token
        headers = {"Authorization": f"Bearer {token}"}
        user_response = requests.get(f"{API_BASE}/users/me", headers=headers)
        
        if user_response.status_code != 200:
            log_error(f"Failed to get user info: {user_response.text}")
            return None
        
        user_data = user_response.json()
        user_id = user_data['id']
        
        conn = psycopg2.connect(
            host='localhost',
            database='startup_platform',
            user='avasara_user',
            password='KINGpin@123'
        )
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if assignment exists and belongs to user
            cursor.execute("""
                SELECT id, reviewer_id FROM review_task_assignments WHERE id = %s
            """, (assignment_id,))
            
            assignment = cursor.fetchone()
            if not assignment:
                log_error(f"Review assignment {assignment_id} not found")
                return None
            
            if assignment['reviewer_id'] != user_id:
                log_error(f"Not authorized to update review assignment {assignment_id}")
                return None
            
            # Update the review assignment
            cursor.execute("""
                UPDATE review_task_assignments
                SET status = 'completed',
                    accept_reject = %s,
                    technical_score = %s,
                    collaboration_score = %s,
                    innovation_score = %s,
                    reliability_score = %s,
                    strengths = %s,
                    areas_for_improvement = %s,
                    additional_comments = %s,
                    completed_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (
                accept_reject,
                scores["technical_score"],
                scores["collaboration_score"],
                scores["innovation_score"],
                scores["reliability_score"],
                "Excellent work! Very well done." if accept_reject else "Needs improvement in several areas.",
                "Minor improvements needed" if accept_reject else "Multiple areas need work",
                feedback,
                assignment_id
            ))
            
            updated_assignment = cursor.fetchone()
            
            # Commit the transaction
            conn.commit()
            
            log_success(f"Review submitted successfully for assignment {assignment_id}")
            return updated_assignment
            
    except Exception as e:
        log_error(f"Failed to submit review: {e}")
        return None

def trigger_review_aggregation(assignment_id):
    """Manually trigger review aggregation for an assignment."""
    log_step(f"Triggering review aggregation for assignment {assignment_id}")
    
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        conn = psycopg2.connect(
            host='localhost',
            database='startup_platform',
            user='avasara_user',
            password='KINGpin@123'
        )
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
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
                # Get ALL assignments for this review task
                cursor.execute("""
                    SELECT rta.status, rta.accept_reject
                    FROM review_task_assignments rta
                    WHERE rta.review_task_id = %s
                """, (review_task['id'],))
                
                review_assignments = cursor.fetchall()
                
                # Check if any assignment for this review task is completed
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
                # Determine approval/rejection based on majority
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
                    
                    conn.commit()
                    log_success(f"Assignment {assignment_id} approved: {accept_count} accept, {reject_count} reject")
                    return True
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
                    
                    conn.commit()
                    log_success(f"Assignment {assignment_id} rejected: {accept_count} accept, {reject_count} reject")
                    return True
            else:
                log_info(f"Aggregation not ready: {total_reviews} reviews completed, need all reviews")
                return False
                
    except Exception as e:
        log_error(f"Failed to trigger aggregation: {e}")
        return False

def test_api_acceptance_flow():
    """Main test function using API calls."""
    logger.info("🚀 Starting API-Based Acceptance System Test")
    print("🚀 Starting API-Based Acceptance System Test")
    print("="*60)
    
    try:
        # Step 1: Create test users
        log_step("Creating test users")
        print("\n1. Creating test users...")
        
        user1 = create_test_user("api_accept_contributor", "api_accept_contributor@test.com")
        user2 = create_test_user("api_accept_reviewer1", "api_accept_reviewer1@test.com")
        user3 = create_test_user("api_accept_reviewer2", "api_accept_reviewer2@test.com")
        
        if not all([user1, user2, user3]):
            log_error("Failed to create test users. Aborting test.")
            return False
        
        # Step 2: Login users
        log_step("Logging in test users")
        print("\n2. Logging in test users...")
        
        token1 = login_user("api_accept_contributor@test.com")
        token2 = login_user("api_accept_reviewer1@test.com")
        token3 = login_user("api_accept_reviewer2@test.com")
        
        if not all([token1, token2, token3]):
            log_error("Failed to login users. Aborting test.")
            return False
        
        # Step 3: Add skills to users
        log_step("Adding skills to users")
        print("\n3. Adding skills to users...")
        
        # Add skills to contributor (user1)
        if not add_skills_to_user(token1, ["Python", "JavaScript"]):
            log_error("Failed to add skills to contributor. Aborting test.")
            return False
        
        # Add skills to reviewers
        if not add_skills_to_user(token2, ["Python", "JavaScript"]):
            log_error("Failed to add skills to reviewer1. Aborting test.")
            return False
        
        if not add_skills_to_user(token3, ["Python", "JavaScript"]):
            log_error("Failed to add skills to reviewer2. Aborting test.")
            return False
        
        # Step 4: Create a test task
        log_step("Creating test task")
        print("\n4. Creating test task...")
        
        skills_required = {"Python": 2, "JavaScript": 2}
        task = create_test_task(token1, "API Test Acceptance Task", "This is a test task for API acceptance flow", skills_required)
        
        if not task:
            log_error("Failed to create test task. Aborting test.")
            return False
        
        task_id = task['id']
        
        # Step 5: Assign task to user1
        log_step("Assigning task to user1")
        print("\n5. Assigning task to user1...")
        
        assignment = assign_task_to_user(token1, task_id)
        
        if not assignment:
            log_error("Failed to assign task. Aborting test.")
            return False
        
        assignment_id = assignment['id']
        
        # Step 6: Submit work
        log_step("Submitting work for review")
        print("\n6. Submitting work for review...")
        
        submission = submit_task_work(token1, assignment_id, "This is my completed work for the API test task")
        
        if not submission:
            log_error("Failed to submit work. Aborting test.")
            return False
        
        # Step 7: Wait a moment for review tasks to be created
        log_step("Waiting for review tasks to be created")
        print("\n7. Waiting for review tasks to be created...")
        time.sleep(3)
        
        # Step 8: Collect review tasks from database
        log_step("Collecting review tasks from database")
        print("\n8. Collecting review tasks from database...")
        
        review_tasks = collect_review_tasks_from_db(assignment_id)
        
        if not review_tasks:
            log_error("No review tasks found in database. Aborting test.")
            return False
        
        # Step 9: Assign review task to user2
        log_step("Assigning review task to user2")
        print("\n9. Assigning review task to user2...")
        
        review_task_id = review_tasks[0]['id']
        review_assignment1 = assign_review_task_direct(token2, review_task_id)
        
        if not review_assignment1:
            log_error("Failed to assign review task to user2. Aborting test.")
            return False
        
        # Step 10: Assign review task to user3
        log_step("Assigning review task to user3")
        print("\n10. Assigning review task to user3...")
        
        review_task_id_user3 = review_tasks[1]['id']
        review_assignment2 = assign_review_task_direct(token3, review_task_id_user3)
        
        if not review_assignment2:
            log_error("Failed to assign review task to user3. Aborting test.")
            return False
        
        # Step 11: Submit positive review from user2
        log_step("Submitting positive review from user2")
        print("\n11. Submitting positive review from user2...")
        
        review1 = submit_review_direct(token2, review_assignment1['id'], accept_reject=True, 
                                     feedback="Excellent work! Very well done.")
        
        if not review1:
            log_error("Failed to submit review from user2. Aborting test.")
            return False
        
        # Step 12: Submit positive review from user3
        log_step("Submitting positive review from user3")
        print("\n12. Submitting positive review from user3...")
        
        review2 = submit_review_direct(token3, review_assignment2['id'], accept_reject=True,
                                     feedback="Great job! Meets all requirements.")
        
        if not review2:
            log_error("Failed to submit review from user3. Aborting test.")
            return False
        
        # Step 13: Trigger review aggregation
        log_step("Triggering review aggregation")
        print("\n13. Triggering review aggregation...")
        
        aggregation_success = trigger_review_aggregation(assignment_id)
        
        if not aggregation_success:
            log_error("Failed to trigger review aggregation. Aborting test.")
            return False
        
        # Step 14: Check final assignment status
        log_step("Checking final assignment status")
        print("\n14. Checking final assignment status...")
        
        final_assignment_status = check_assignment_status(token1, assignment_id)
        
        # Step 15: Check final task status
        log_step("Checking final task status")
        print("\n15. Checking final task status...")
        
        final_task_status = check_task_status(token1, task_id)
        
        # Step 16: Check user skills
        log_step("Checking user skills")
        print("\n16. Checking user skills...")
        
        user_skills = check_user_skills(token1)
        
        # Step 17: Print results
        print("\n" + "="*60)
        print("API ACCEPTANCE TEST RESULTS")
        print("="*60)
        
        print(f"✅ Final Assignment Status: {final_assignment_status}")
        print(f"✅ Final Task Status: {final_task_status}")
        print(f"✅ User Skills: {len(user_skills)} skills found")
        
        # Check if test passed
        if final_assignment_status == "completed" and final_task_status == "completed":
            log_success("🎉 API ACCEPTANCE TEST PASSED!")
            print("\n🎉 API ACCEPTANCE TEST PASSED!")
            print("✅ Assignment was completed successfully")
            print("✅ Task was completed successfully")
            print("✅ User skills were updated")
            return True
        else:
            log_error("❌ API ACCEPTANCE TEST FAILED!")
            print("\n❌ API ACCEPTANCE TEST FAILED!")
            print(f"Expected assignment status: completed, Got: {final_assignment_status}")
            print(f"Expected task status: completed, Got: {final_task_status}")
            return False
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_api_acceptance_flow()
    if success:
        logger.info("✅ API acceptance test completed successfully!")
        print("\n✅ API acceptance test completed successfully!")
    else:
        logger.error("❌ API acceptance test failed!")
        print("\n❌ API acceptance test failed!")
        sys.exit(1) 