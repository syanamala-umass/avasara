#!/usr/bin/env python3
"""
Test script to verify that review tasks are created when a task assignment is submitted.
This tests the update_assignment_status function in task_assignment.py
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def get_auth_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def login_user(email, password):
    """Login and get access token"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def create_test_task(token, title="Test Task for Review Creation"):
    """Create a test task"""
    headers = get_auth_headers(token)
    
    task_data = {
        "title": title,
        "description": "This is a test task to verify review task creation",
        "num_reviewers": 2,
        "compensation_type": "cash",
        "compensation_amount": 100,
        "deadline": None,
        "skill_requirements": {}
    }
    
    response = requests.post(f"{API_URL}/tasks/", json=task_data, headers=headers)
    
    if response.status_code == 201:
        task = response.json()
        print(f"✅ Created test task: {task['id']} - {task['title']}")
        return task
    else:
        print(f"❌ Failed to create task: {response.status_code} - {response.text}")
        return None

def create_task_assignment(token, task_id):
    """Create a task assignment"""
    headers = get_auth_headers(token)
    
    assignment_data = {
        "task_id": task_id,
        "assignment_type": "task"
    }
    
    response = requests.post(f"{API_URL}/task-assignments/", json=assignment_data, headers=headers)
    
    if response.status_code == 201:
        assignment = response.json()
        print(f"✅ Created task assignment: {assignment['id']} for task {task_id}")
        return assignment
    else:
        print(f"❌ Failed to create assignment: {response.status_code} - {response.text}")
        return None

def submit_task_assignment(token, assignment_id, notes="Test submission"):
    """Submit a task assignment (change status to submitted)"""
    headers = get_auth_headers(token)
    
    update_data = {
        "status": "submitted",
        "notes": notes
    }
    
    print(f"🔄 Submitting assignment {assignment_id}...")
    response = requests.put(f"{API_URL}/task-assignments/{assignment_id}", json=update_data, headers=headers)
    
    if response.status_code == 200:
        assignment = response.json()
        print(f"✅ Assignment {assignment_id} submitted successfully")
        print(f"   Status: {assignment['status']}")
        print(f"   Notes: {assignment['notes']}")
        return assignment
    else:
        print(f"❌ Failed to submit assignment: {response.status_code} - {response.text}")
        return None

def check_review_tasks_created(token, task_id):
    """Check if review tasks were created for the task"""
    headers = get_auth_headers(token)
    
    response = requests.get(f"{API_URL}/review-tasks/", headers=headers)
    
    if response.status_code == 200:
        review_tasks = response.json()
        
        # Filter review tasks for this specific task
        task_review_tasks = [rt for rt in review_tasks if rt.get('parent_task_id') == task_id]
        
        print(f"📋 Found {len(task_review_tasks)} review tasks for task {task_id}")
        
        for rt in task_review_tasks:
            print(f"   Review Task {rt['id']}: {rt['title']}")
            print(f"     Status: {rt['status']}")
            print(f"     Assignment Being Reviewed: {rt['assignment_being_reviewed_id']}")
        
        return task_review_tasks
    else:
        print(f"❌ Failed to get review tasks: {response.status_code} - {response.text}")
        return []

def check_task_status(token, task_id):
    """Check the status of the original task"""
    headers = get_auth_headers(token)
    
    response = requests.get(f"{API_URL}/tasks/{task_id}", headers=headers)
    
    if response.status_code == 200:
        task = response.json()
        print(f"📋 Task {task_id} status: {task['status']}")
        return task['status']
    else:
        print(f"❌ Failed to get task: {response.status_code} - {response.text}")
        return None

def run_test():
    """Run the complete test"""
    print("🧪 Testing Review Task Creation Function")
    print("=" * 50)
    
    # Step 1: Login
    print("\n1️⃣ Logging in...")
    token = login_user("test@example.com", "password123")  # Replace with actual test user
    if not token:
        print("❌ Cannot proceed without authentication")
        return False
    
    # Step 2: Create a test task
    print("\n2️⃣ Creating test task...")
    task = create_test_task(token)
    if not task:
        print("❌ Cannot proceed without a test task")
        return False
    
    task_id = task['id']
    
    # Step 3: Create a task assignment
    print("\n3️⃣ Creating task assignment...")
    assignment = create_task_assignment(token, task_id)
    if not assignment:
        print("❌ Cannot proceed without a task assignment")
        return False
    
    assignment_id = assignment['id']
    
    # Step 4: Check initial state
    print("\n4️⃣ Checking initial state...")
    initial_review_tasks = check_review_tasks_created(token, task_id)
    initial_task_status = check_task_status(token, task_id)
    
    print(f"   Initial review tasks count: {len(initial_review_tasks)}")
    print(f"   Initial task status: {initial_task_status}")
    
    # Step 5: Submit the task assignment
    print("\n5️⃣ Submitting task assignment...")
    submitted_assignment = submit_task_assignment(assignment_id, "Test submission notes")
    if not submitted_assignment:
        print("❌ Failed to submit assignment")
        return False
    
    # Step 6: Wait a moment for processing
    print("\n6️⃣ Waiting for processing...")
    time.sleep(2)
    
    # Step 7: Check final state
    print("\n7️⃣ Checking final state...")
    final_review_tasks = check_review_tasks_created(token, task_id)
    final_task_status = check_task_status(token, task_id)
    
    # Step 8: Verify results
    print("\n8️⃣ Verifying results...")
    
    success = True
    
    # Check if review tasks were created
    if len(final_review_tasks) > len(initial_review_tasks):
        print(f"✅ Review tasks created successfully: {len(final_review_tasks) - len(initial_review_tasks)} new tasks")
    else:
        print(f"❌ No new review tasks created. Expected at least 1, got {len(final_review_tasks) - len(initial_review_tasks)}")
        success = False
    
    # Check if task status changed to under_review
    if final_task_status == "under_review":
        print("✅ Task status correctly changed to 'under_review'")
    else:
        print(f"❌ Task status should be 'under_review', but is '{final_task_status}'")
        success = False
    
    # Check if assignment status is submitted
    if submitted_assignment['status'] == "submitted":
        print("✅ Assignment status correctly set to 'submitted'")
    else:
        print(f"❌ Assignment status should be 'submitted', but is '{submitted_assignment['status']}'")
        success = False
    
    # Summary
    print("\n" + "=" * 50)
    if success:
        print("🎉 TEST PASSED: Review task creation is working correctly!")
    else:
        print("💥 TEST FAILED: Review task creation is not working properly!")
    
    return success

if __name__ == "__main__":
    run_test() 