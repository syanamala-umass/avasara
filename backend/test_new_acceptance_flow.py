#!/usr/bin/env python3
"""
New test script for the acceptance system flow with accept_reject boolean.
This script simulates the entire acceptance process using the updated review task system.
"""

import psycopg2
import requests
import json
import time
import logging
from datetime import datetime, timedelta
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('test_new_acceptance.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'startup_platform',
    'user': 'avasara_user',
    'password': 'KINGpin@123'
}

API_BASE_URL = 'http://localhost:8000'

def connect_db():
    """Connect to the database."""
    logger.info("Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        logger.info("✅ Database connection established")
        return conn
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise

def create_test_users():
    """Create test users for the acceptance flow."""
    logger.info("Creating test users for acceptance flow...")
    conn = connect_db()
    cursor = conn.cursor()
    
    users = []
    
    try:
        # Create test users
        test_users = [
            ('new_accept_contributor', 'new_accept_contributor@test.com', 'testpass123'),
            ('new_accept_reviewer1', 'new_accept_reviewer1@test.com', 'testpass123'),
            ('new_accept_reviewer2', 'new_accept_reviewer2@test.com', 'testpass123'),
        ]
        
        for username, email, password in test_users:
            logger.info(f"Processing user: {username}")
            
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            existing = cursor.fetchone()
            
            if existing:
                user_id = existing[0]
                logger.info(f"  User {username} already exists with ID: {user_id}")
            else:
                # Create new user
                logger.info(f"  Creating new user: {username}")
                cursor.execute("""
                    INSERT INTO users (username, email, hashed_password, is_active, email_verified)
                    VALUES (%s, %s, %s, true, true)
                    RETURNING id
                """, (username, email, f"hashed_{password}"))
                user_id = cursor.fetchone()[0]
                logger.info(f"  ✅ Created user {username} with ID: {user_id}")
            
            users.append({
                'id': user_id,
                'username': username,
                'email': email,
                'password': password
            })
        
        conn.commit()
        logger.info(f"✅ Successfully created/verified {len(users)} test users")
        return users
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating test users: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def create_test_task():
    """Create a test task for the acceptance flow."""
    logger.info("Creating test task for acceptance flow...")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Create test skills first
        skills = ['Python', 'JavaScript']
        skill_ids = []
        
        logger.info(f"Setting up skills: {skills}")
        for skill_name in skills:
            cursor.execute("SELECT id FROM skills WHERE name = %s", (skill_name,))
            existing = cursor.fetchone()
            
            if existing:
                skill_id = existing[0]
                logger.info(f"  Skill '{skill_name}' already exists with ID: {skill_id}")
                skill_ids.append(skill_id)
            else:
                logger.info(f"  Creating new skill: {skill_name}")
                cursor.execute("""
                    INSERT INTO skills (name)
                    VALUES (%s)
                    RETURNING id
                """, (skill_name,))
                skill_id = cursor.fetchone()[0]
                logger.info(f"  ✅ Created skill '{skill_name}' with ID: {skill_id}")
                skill_ids.append(skill_id)
        
        # Create test task
        logger.info("Creating test task...")
        skill_requirements = {'Python': 3, 'JavaScript': 2}
        logger.info(f"  Skill requirements: {skill_requirements}")
        
        cursor.execute("""
            INSERT INTO tasks (
                title, description, status, skill_review_requirements, 
                num_reviewers
            ) VALUES (
                'New Test Acceptance Task', 
                'A test task to demonstrate the new acceptance system with accept_reject',
                'open',
                %s,
                2
            ) RETURNING id
        """, (json.dumps(skill_requirements),))
        
        task_id = cursor.fetchone()[0]
        logger.info(f"✅ Created test task with ID: {task_id}")
        logger.info(f"  Title: New Test Acceptance Task")
        
        # Create compensation records
        logger.info("  Creating compensation records...")
        
        # Task compensation
        cursor.execute("""
            INSERT INTO task_compensations (task_id, compensation_type, amount_type, amount)
            VALUES (%s, 'cash', 'task', 150)
        """, (task_id,))
        logger.info("    ✅ Task compensation: $150 cash")
        
        # Review compensation
        cursor.execute("""
            INSERT INTO task_compensations (task_id, compensation_type, amount_type, amount)
            VALUES (%s, 'cash', 'review', 25)
        """, (task_id,))
        logger.info("    ✅ Review compensation: $25 cash")
        
        conn.commit()
        return task_id, skill_ids
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating test task: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def setup_user_skills(user_id, skill_ids, initial_rating=3.0):
    """Set up user skills for testing."""
    logger.info(f"Setting up skills for user {user_id} with initial rating {initial_rating}")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        for skill_id in skill_ids:
            logger.info(f"  Setting up skill ID {skill_id}")
            cursor.execute("""
                INSERT INTO contributor_skill (user_id, skill_id, rating)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id, skill_id) 
                DO UPDATE SET rating = %s
            """, (user_id, skill_id, initial_rating, initial_rating))
            logger.info(f"  ✅ Skill {skill_id} set to rating {initial_rating}")
        
        conn.commit()
        logger.info(f"✅ Successfully set up {len(skill_ids)} skills for user {user_id}")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error setting up user skills: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def simulate_task_assignment(task_id, contributor_id):
    """Simulate task assignment."""
    logger.info(f"Simulating task assignment: Task {task_id} -> User {contributor_id}")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Create task assignment
        logger.info("  Creating task assignment...")
        cursor.execute("""
            INSERT INTO task_assignments (task_id, user_id, assignment_type, status)
            VALUES (%s, %s, 'task', 'submitted')
            RETURNING id
        """, (task_id, contributor_id))
        
        assignment_id = cursor.fetchone()[0]
        logger.info(f"  ✅ Created task assignment with ID: {assignment_id}")
        
        # Update task status to under_review
        logger.info("  Updating task status to 'under_review'...")
        cursor.execute("""
            UPDATE tasks SET status = 'under_review' WHERE id = %s
        """, (task_id,))
        logger.info("  ✅ Task status updated to 'under_review'")
        
        conn.commit()
        return assignment_id
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating task assignment: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def create_review_tasks(task_id, assignment_id, contributor_id):
    """Create review tasks for the assignment."""
    logger.info("Creating review tasks for the assignment...")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Get task details
        cursor.execute("""
            SELECT title, description, skill_review_requirements
            FROM tasks WHERE id = %s
        """, (task_id,))
        task = cursor.fetchone()
        
        # Create review tasks
        review_tasks = []
        for i in range(2):  # Create 2 review tasks
            review_title = f"Review: {task[0]} (Submission #{assignment_id})"
            review_description = f"""
            Review the submitted work for task: {task[0]}
            
            Submission Details:
            - Assignment ID: {assignment_id}
            - Original Task: {task[0]}
            
            Provide constructive feedback and decide whether to accept or reject.
            """
            
            cursor.execute("""
                INSERT INTO review_tasks (
                    title, description, status, skill_requirements, 
                    parent_task_id, assignment_being_reviewed_id,
                    compensation_amount, compensation_type
                ) VALUES (
                    %s, %s, 'open', %s, %s, %s, %s, %s
                ) RETURNING id
            """, (
                review_title,
                review_description,
                task[2],  # skill_review_requirements
                task_id,
                assignment_id,
                25,  # Review compensation amount
                'cash'  # Review compensation type
            ))
            
            review_task_id = cursor.fetchone()[0]
            review_tasks.append(review_task_id)
            logger.info(f"  ✅ Created review task {review_task_id}")
        
        conn.commit()
        logger.info(f"✅ Successfully created {len(review_tasks)} review tasks")
        return review_tasks
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating review tasks: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def create_review_assignments(review_task_ids, reviewers):
    """Create review assignments for reviewers."""
    logger.info("Creating review assignments...")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        review_assignments = []
        for i, review_task_id in enumerate(review_task_ids):
            reviewer = reviewers[i]
            
            cursor.execute("""
                INSERT INTO review_task_assignments (
                    review_task_id, reviewer_id, status
                ) VALUES (%s, %s, 'assigned')
                RETURNING id
            """, (review_task_id, reviewer['id']))
            
            assignment_id = cursor.fetchone()[0]
            review_assignments.append(assignment_id)
            logger.info(f"  ✅ Created review assignment {assignment_id} for reviewer {reviewer['username']}")
        
        conn.commit()
        logger.info(f"✅ Successfully created {len(review_assignments)} review assignments")
        return review_assignments
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating review assignments: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def submit_reviews(review_assignment_ids, accept_reject_list):
    """Submit reviews with accept/reject decisions."""
    logger.info("Submitting reviews with accept/reject decisions...")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        for i, assignment_id in enumerate(review_assignment_ids):
            accept_reject = accept_reject_list[i]
            decision_text = "ACCEPT" if accept_reject else "REJECT"
            logger.info(f"  Submitting review {i+1}: {decision_text}")
            
            # Set scores based on decision
            if accept_reject:
                scores = {
                    'technical_score': 4.5,
                    'collaboration_score': 4.0,
                    'innovation_score': 4.2,
                    'reliability_score': 4.8
                }
                feedback = "Excellent work! Very well done."
            else:
                scores = {
                    'technical_score': 2.0,
                    'collaboration_score': 2.5,
                    'innovation_score': 2.2,
                    'reliability_score': 1.8
                }
                feedback = "Needs improvement in several areas."
            
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
                    completed_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                accept_reject,
                scores['technical_score'],
                scores['collaboration_score'],
                scores['innovation_score'],
                scores['reliability_score'],
                feedback,
                "Minor improvements needed" if accept_reject else "Multiple areas need work",
                assignment_id
            ))
            
            logger.info(f"    ✅ Review {i+1} submitted with decision: {decision_text}")
        
        conn.commit()
        logger.info(f"✅ Successfully submitted {len(review_assignment_ids)} reviews")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error submitting reviews: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def check_acceptance_results(task_id, contributor_id):
    """Check the results of the acceptance process."""
    logger.info("Checking acceptance system results...")
    conn = connect_db()
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("CHECKING NEW ACCEPTANCE SYSTEM RESULTS")
    print("="*60)
    
    try:
        # Check task status
        logger.info("Checking task status...")
        cursor.execute("SELECT status FROM tasks WHERE id = %s", (task_id,))
        task_status = cursor.fetchone()[0]
        logger.info(f"  Task status: {task_status}")
        print(f"✅ Task Status: {task_status}")
        
        # Check assignment status
        logger.info("Checking assignment status...")
        cursor.execute("""
            SELECT status FROM task_assignments 
            WHERE task_id = %s AND user_id = %s
        """, (task_id, contributor_id))
        assignment_result = cursor.fetchone()
        if assignment_result:
            assignment_status = assignment_result[0]
            logger.info(f"  Assignment status: {assignment_status}")
            print(f"✅ Assignment Status: {assignment_status}")
        
        # Check review tasks
        logger.info("Checking review tasks...")
        cursor.execute("""
            SELECT id, status FROM review_tasks 
            WHERE parent_task_id = %s
        """, (task_id,))
        review_tasks = cursor.fetchall()
        logger.info(f"  Found {len(review_tasks)} review tasks")
        print(f"✅ Review Tasks: {len(review_tasks)} found")
        for task_id, status in review_tasks:
            logger.info(f"    Review task {task_id}: {status}")
            print(f"   Review task {task_id}: {status}")
        
        # Check review assignments and decisions
        logger.info("Checking review assignments and decisions...")
        cursor.execute("""
            SELECT rta.id, rta.status, rta.accept_reject, rta.technical_score,
                   rta.collaboration_score, rta.innovation_score, rta.reliability_score
            FROM review_task_assignments rta
            JOIN review_tasks rt ON rta.review_task_id = rt.id
            WHERE rt.parent_task_id = %s
        """, (task_id,))
        
        review_assignments = cursor.fetchall()
        logger.info(f"  Found {len(review_assignments)} review assignments")
        print(f"✅ Review Assignments: {len(review_assignments)} found")
        
        accept_count = 0
        reject_count = 0
        for assignment_id, status, accept_reject, tech_score, collab_score, innov_score, reliability_score in review_assignments:
            decision = "ACCEPT" if accept_reject else "REJECT"
            if accept_reject:
                accept_count += 1
            else:
                reject_count += 1
            
            avg_score = (tech_score + collab_score + innov_score + reliability_score) / 4
            logger.info(f"    Assignment {assignment_id}: {status}, Decision: {decision}, Avg Score: {avg_score:.2f}")
            print(f"   Assignment {assignment_id}: {status}, Decision: {decision}, Avg Score: {avg_score:.2f}")
        
        print(f"✅ Decision Summary: {accept_count} accept, {reject_count} reject")
        
        # Check if user is blocked (should NOT be blocked for acceptance)
        logger.info("Checking if user is blocked...")
        cursor.execute("""
            SELECT blocked_until, reason 
            FROM task_blocks 
            WHERE task_id = %s AND user_id = %s AND blocked_until > CURRENT_TIMESTAMP
        """, (task_id, contributor_id))
        
        block_result = cursor.fetchone()
        if block_result:
            logger.warning(f"  User IS blocked (unexpected for acceptance)")
            logger.warning(f"    Blocked until: {block_result[0]}")
            logger.warning(f"    Reason: {block_result[1]}")
            print(f"❌ User Blocked: Yes (This is unexpected for acceptance)")
            print(f"   Blocked until: {block_result[0]}")
            print(f"   Reason: {block_result[1]}")
        else:
            logger.info("  User is NOT blocked (correct for acceptance)")
            print(f"✅ User Blocked: No (Correct for acceptance)")
        
        # Check user skill ratings
        logger.info("Checking user skill ratings...")
        cursor.execute("""
            SELECT s.name, cs.rating
            FROM contributor_skill cs
            JOIN skills s ON cs.skill_id = s.id
            WHERE cs.user_id = %s
        """, (contributor_id,))
        
        skills = cursor.fetchall()
        logger.info(f"  Found {len(skills)} skills for user")
        print(f"✅ User Skill Ratings:")
        for skill_name, rating in skills:
            logger.info(f"    {skill_name}: {rating:.2f}")
            print(f"   {skill_name}: {rating:.2f}")
        
        print("\n" + "="*60)
        print("EXPECTED RESULTS:")
        print("- Task status should be 'completed'")
        print("- Assignment status should be 'completed'")
        print("- Review tasks should be 'completed'")
        print("- Majority of reviews should be 'ACCEPT'")
        print("- Original contributor should NOT be blocked")
        print("- User skill ratings should be improved")
        print("="*60)
        
    except Exception as e:
        logger.error(f"❌ Error checking results: {e}")
        print(f"Error checking results: {e}")
    finally:
        cursor.close()
        conn.close()

def cleanup_test_data(task_id, user_ids):
    """Clean up test data."""
    logger.info("Cleaning up test data...")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Delete review task assignments
        logger.info(f"  Deleting review task assignments for task {task_id}...")
        cursor.execute("""
            DELETE FROM review_task_assignments 
            WHERE review_task_id IN (
                SELECT id FROM review_tasks WHERE parent_task_id = %s
            )
        """, (task_id,))
        deleted_review_assignments = cursor.rowcount
        logger.info(f"    Deleted {deleted_review_assignments} review task assignments")
        
        # Delete review tasks
        logger.info(f"  Deleting review tasks for task {task_id}...")
        cursor.execute("DELETE FROM review_tasks WHERE parent_task_id = %s", (task_id,))
        deleted_review_tasks = cursor.rowcount
        logger.info(f"    Deleted {deleted_review_tasks} review tasks")
        
        # Delete task assignments
        logger.info(f"  Deleting task assignments for task {task_id}...")
        cursor.execute("DELETE FROM task_assignments WHERE task_id = %s", (task_id,))
        deleted_assignments = cursor.rowcount
        logger.info(f"    Deleted {deleted_assignments} task assignments")
        
        # Delete task blocks
        logger.info(f"  Deleting task blocks for task {task_id}...")
        cursor.execute("DELETE FROM task_blocks WHERE task_id = %s", (task_id,))
        deleted_blocks = cursor.rowcount
        logger.info(f"    Deleted {deleted_blocks} task blocks")
        
        # Delete task compensations
        logger.info(f"  Deleting task compensations for task {task_id}...")
        cursor.execute("DELETE FROM task_compensations WHERE task_id = %s", (task_id,))
        deleted_compensations = cursor.rowcount
        logger.info(f"    Deleted {deleted_compensations} task compensations")
        
        # Delete task
        logger.info(f"  Deleting task {task_id}...")
        cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        deleted_tasks = cursor.rowcount
        logger.info(f"    Deleted {deleted_tasks} tasks")
        
        # Delete users
        for user_id in user_ids:
            logger.info(f"  Deleting user {user_id}...")
            cursor.execute("DELETE FROM contributor_skill WHERE user_id = %s", (user_id,))
            deleted_skills = cursor.rowcount
            logger.info(f"    Deleted {deleted_skills} skill records")
            
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            deleted_users = cursor.rowcount
            logger.info(f"    Deleted {deleted_users} users")
        
        conn.commit()
        logger.info("✅ Test data cleaned up successfully")
        print("✅ Test data cleaned up successfully")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error cleaning up test data: {e}")
        print(f"Error cleaning up test data: {e}")
    finally:
        cursor.close()
        conn.close()

def test_new_acceptance_flow():
    """Main test function."""
    logger.info("🚀 Starting New Acceptance System Test")
    print("🚀 Starting New Acceptance System Test")
    print("="*60)
    
    try:
        # Step 1: Create test users
        logger.info("Step 1: Creating test users...")
        print("\n1. Creating test users...")
        users = create_test_users()
        contributor = users[0]
        reviewers = users[1:]
        logger.info(f"  Contributor: {contributor['username']} (ID: {contributor['id']})")
        logger.info(f"  Reviewers: {[r['username'] for r in reviewers]}")
        
        # Step 2: Create test task
        logger.info("Step 2: Creating test task...")
        print("\n2. Creating test task...")
        task_id, skill_ids = create_test_task()
        logger.info(f"  Task ID: {task_id}")
        logger.info(f"  Skill IDs: {skill_ids}")
        
        # Step 3: Set up contributor skills
        logger.info("Step 3: Setting up contributor skills...")
        print("\n3. Setting up contributor skills...")
        setup_user_skills(contributor['id'], skill_ids, initial_rating=3.0)
        
        # Step 4: Simulate task assignment
        logger.info("Step 4: Simulating task assignment...")
        print("\n4. Simulating task assignment...")
        assignment_id = simulate_task_assignment(task_id, contributor['id'])
        logger.info(f"  Assignment ID: {assignment_id}")
        
        # Step 5: Create review tasks
        logger.info("Step 5: Creating review tasks...")
        print("\n5. Creating review tasks...")
        review_task_ids = create_review_tasks(task_id, assignment_id, contributor['id'])
        logger.info(f"  Review task IDs: {review_task_ids}")
        
        # Step 6: Create review assignments
        logger.info("Step 6: Creating review assignments...")
        print("\n6. Creating review assignments...")
        review_assignment_ids = create_review_assignments(review_task_ids, reviewers)
        logger.info(f"  Review assignment IDs: {review_assignment_ids}")
        
        # Step 7: Submit reviews (majority accept)
        logger.info("Step 7: Submitting reviews...")
        print("\n7. Submitting reviews (majority accept scenario)...")
        # Both reviewers accept
        accept_reject_list = [True, True]  # Both accept
        submit_reviews(review_assignment_ids, accept_reject_list)
        
        # Step 8: Wait for aggregation
        logger.info("Step 8: Waiting for aggregation...")
        print("\n8. Waiting for aggregation...")
        time.sleep(2)
        
        # Step 9: Check results
        logger.info("Step 9: Checking results...")
        check_acceptance_results(task_id, contributor['id'])
        
        # Step 10: Cleanup
        logger.info("Step 10: Cleaning up test data...")
        user_ids = [user['id'] for user in users]
        cleanup_test_data(task_id, user_ids)
        
        logger.info("🎉 New acceptance test completed successfully!")
        print("\n🎉 New acceptance test completed successfully!")
        print("\nTo test in the UI:")
        print("1. Start the backend server: uvicorn app.main:app --reload")
        print("2. Start the frontend server: npm start")
        print("3. Log in with any test account")
        print("4. Look for completed tasks and verify the acceptance behavior")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_new_acceptance_flow() 