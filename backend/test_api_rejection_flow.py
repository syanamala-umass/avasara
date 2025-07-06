#!/usr/bin/env python3
"""
API-based test script for the rejection system flow.
This script uses actual API calls to test the real rejection process.
"""

import requests
import json
import time
import logging
from datetime import datetime
import sys
import psycopg2

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('test_api_rejection.log')
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
        "compensation_amount": 100,
        "compensation_type": "cash",
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

def submit_review(token, assignment_id, accept_reject=False, scores=None, feedback=""):
    """Submit a review for a review assignment via API."""
    log_step(f"Submitting review for assignment {assignment_id} (Accept: {accept_reject})")
    
    if scores is None:
        scores = {
            "technical_score": 1.5 if not accept_reject else 4.0,
            "collaboration_score": 2.0 if not accept_reject else 4.2,
            "innovation_score": 1.8 if not accept_reject else 3.8,
            "reliability_score": 1.2 if not accept_reject else 4.5
        }
    
    review_data = {
        "status": "completed",
        "accept_reject": accept_reject,
        "technical_score": scores["technical_score"],
        "collaboration_score": scores["collaboration_score"],
        "innovation_score": scores["innovation_score"],
        "reliability_score": scores["reliability_score"],
        "strengths": "Good work overall." if accept_reject else "Poor quality work. Multiple issues found.",
        "areas_for_improvement": "Minor improvements needed" if accept_reject else "Multiple critical issues",
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
    response = requests.get(f"{API_BASE}/users/me/skills", headers=headers)
    
    if response.status_code == 200:
        skills = response.json()
        log_success(f"Found {len(skills)} skills for user")
        for skill in skills:
            log_info(f"  {skill['skill_name']}: {skill['rating']:.2f}")
        return skills
    else:
        log_error(f"Failed to get user skills: {response.text}")
        return []

def check_if_user_blocked(token, task_id):
    """Check if user is blocked from a task via API."""
    log_step(f"Checking if user is blocked from task {task_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/tasks/{task_id}/can-undertake", headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        can_undertake = result.get('can_undertake', True)
        reason = result.get('reason', '')
        
        if not can_undertake:
            log_info(f"User is blocked from task {task_id}. Reason: {reason}")
            return True, reason
        else:
            log_info(f"User is NOT blocked from task {task_id}")
            return False, ""
    else:
        log_error(f"Failed to check if user is blocked: {response.text}")
        return None, ""

def test_api_rejection_flow():
    """Main test function using API calls."""
    logger.info("🚀 Starting API-Based Rejection System Test")
    print("🚀 Starting API-Based Rejection System Test")
    print("="*60)
    
    try:
        # Step 1: Create test users
        log_step("Creating test users")
        print("\n1. Creating test users...")
        
        user1 = create_test_user("api_reject_contributor", "api_reject_contributor@test.com")
        user2 = create_test_user("api_reject_reviewer1", "api_reject_reviewer1@test.com")
        user3 = create_test_user("api_reject_reviewer2", "api_reject_reviewer2@test.com")
        
        if not all([user1, user2, user3]):
            log_error("Failed to create test users. Aborting test.")
            return False
        
        # Step 2: Login users
        log_step("Logging in test users")
        print("\n2. Logging in test users...")
        
        token1 = login_user("api_reject_contributor")
        token2 = login_user("api_reject_reviewer1")
        token3 = login_user("api_reject_reviewer2")
        
        if not all([token1, token2, token3]):
            log_error("Failed to login users. Aborting test.")
            return False
        
        # Step 3: Create a test task
        log_step("Creating test task")
        print("\n3. Creating test task...")
        
        skills_required = {"Python": 3, "JavaScript": 2}
        task = create_test_task(token1, "API Test Rejection Task", "This is a test task for API rejection flow", skills_required)
        
        if not task:
            log_error("Failed to create test task. Aborting test.")
            return False
        
        task_id = task['id']
        
        # Step 4: Assign task to user1
        log_step("Assigning task to user1")
        print("\n4. Assigning task to user1...")
        
        assignment = assign_task_to_user(token1, task_id)
        
        if not assignment:
            log_error("Failed to assign task. Aborting test.")
            return False
        
        assignment_id = assignment['id']
        
        # Step 5: Submit work
        log_step("Submitting work for review")
        print("\n5. Submitting work for review...")
        
        submission = submit_task_work(token1, assignment_id, "This is my completed work for the API test task")
        
        if not submission:
            log_error("Failed to submit work. Aborting test.")
            return False
        
        # Step 6: Wait a moment for review tasks to be created
        log_step("Waiting for review tasks to be created")
        print("\n6. Waiting for review tasks to be created...")
        time.sleep(3)
        
        # Step 7: Get review tasks for user2
        log_step("Getting review tasks for user2")
        print("\n7. Getting review tasks for user2...")
        
        review_tasks = get_review_tasks(token2)
        
        if not review_tasks:
            log_error("No review tasks found. Aborting test.")
            return False
        
        # Step 8: Assign review task to user2
        log_step("Assigning review task to user2")
        print("\n8. Assigning review task to user2...")
        
        review_task_id = review_tasks[0]['id']
        review_assignment1 = assign_review_task(token2, review_task_id)
        
        if not review_assignment1:
            log_error("Failed to assign review task to user2. Aborting test.")
            return False
        
        # Step 9: Get review tasks for user3
        log_step("Getting review tasks for user3")
        print("\n9. Getting review tasks for user3...")
        
        review_tasks_user3 = get_review_tasks(token3)
        
        if not review_tasks_user3:
            log_error("No review tasks found for user3. Aborting test.")
            return False
        
        # Step 10: Assign review task to user3
        log_step("Assigning review task to user3")
        print("\n10. Assigning review task to user3...")
        
        review_task_id_user3 = review_tasks_user3[0]['id']
        review_assignment2 = assign_review_task(token3, review_task_id_user3)
        
        if not review_assignment2:
            log_error("Failed to assign review task to user3. Aborting test.")
            return False
        
        # Step 11: Submit negative review from user2
        log_step("Submitting negative review from user2")
        print("\n11. Submitting negative review from user2...")
        
        review1 = submit_review(token2, review_assignment1['id'], accept_reject=False, 
                               feedback="Poor quality work. Multiple issues found.")
        
        if not review1:
            log_error("Failed to submit review from user2. Aborting test.")
            return False
        
        # Step 12: Submit negative review from user3
        log_step("Submitting negative review from user3")
        print("\n12. Submitting negative review from user3...")
        
        review2 = submit_review(token3, review_assignment2['id'], accept_reject=False,
                               feedback="Work does not meet requirements. Rejected.")
        
        if not review2:
            log_error("Failed to submit review from user3. Aborting test.")
            return False
        
        # Step 13: Wait for aggregation
        log_step("Waiting for review aggregation")
        print("\n13. Waiting for review aggregation...")
        time.sleep(3)
        
        # Step 14: Check final assignment status
        log_step("Checking final assignment status")
        print("\n14. Checking final assignment status...")
        
        final_assignment_status = check_assignment_status(token1, assignment_id)
        
        # Step 15: Check final task status
        log_step("Checking final task status")
        print("\n15. Checking final task status...")
        
        final_task_status = check_task_status(token1, task_id)
        
        # Step 16: Check if user is blocked
        log_step("Checking if user is blocked")
        print("\n16. Checking if user is blocked...")
        
        is_blocked, block_reason = check_if_user_blocked(token1, task_id)
        
        # Step 17: Check user skills
        log_step("Checking user skills")
        print("\n17. Checking user skills...")
        
        user_skills = check_user_skills(token1)
        
        # Step 18: Print results
        print("\n" + "="*60)
        print("API REJECTION TEST RESULTS")
        print("="*60)
        
        print(f"✅ Final Assignment Status: {final_assignment_status}")
        print(f"✅ Final Task Status: {final_task_status}")
        print(f"✅ User Blocked: {is_blocked}")
        if is_blocked:
            print(f"✅ Block Reason: {block_reason}")
        print(f"✅ User Skills: {len(user_skills)} skills found")
        
        # Check if test passed
        expected_assignment_status = "rejected"
        expected_task_status = "open"
        
        if (final_assignment_status == expected_assignment_status and 
            final_task_status == expected_task_status and 
            is_blocked):
            log_success("🎉 API REJECTION TEST PASSED!")
            print("\n🎉 API REJECTION TEST PASSED!")
            print("✅ Assignment was rejected successfully")
            print("✅ Task was reopened for other contributors")
            print("✅ User was blocked from the task")
            print("✅ User skills were updated")
            return True
        else:
            log_error("❌ API REJECTION TEST FAILED!")
            print("\n❌ API REJECTION TEST FAILED!")
            print(f"Expected assignment status: {expected_assignment_status}, Got: {final_assignment_status}")
            print(f"Expected task status: {expected_task_status}, Got: {final_task_status}")
            print(f"Expected user blocked: True, Got: {is_blocked}")
            return False
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_api_rejection_flow()
    if success:
        logger.info("✅ API rejection test completed successfully!")
        print("\n✅ API rejection test completed successfully!")
    else:
        logger.error("❌ API rejection test failed!")
        print("\n❌ API rejection test failed!")
        sys.exit(1) 