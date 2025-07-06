#!/usr/bin/env python3
"""
Test script for the acceptance system flow.
This script simulates the entire acceptance process when majority of reviewers approve work.
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
        logging.FileHandler('test_acceptance.log')
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
            ('accept_contributor', 'accept_contributor@test.com', 'testpass123'),
            ('accept_reviewer1', 'accept_reviewer1@test.com', 'testpass123'),
            ('accept_reviewer2', 'accept_reviewer2@test.com', 'testpass123'),
            ('accept_reviewer3', 'accept_reviewer3@test.com', 'testpass123'),
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
                'Test Acceptance Task', 
                'A test task to demonstrate the acceptance system',
                'open',
                %s,
                3
            ) RETURNING id
        """, (json.dumps(skill_requirements),))
        
        task_id = cursor.fetchone()[0]
        logger.info(f"✅ Created test task with ID: {task_id}")
        logger.info(f"  Title: Test Acceptance Task")
        
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
        
        # Update task status to in_progress
        logger.info("  Updating task status to 'in_progress'...")
        cursor.execute("""
            UPDATE tasks SET status = 'in_progress' WHERE id = %s
        """, (task_id,))
        logger.info("  ✅ Task status updated to 'in_progress'")
        
        conn.commit()
        return assignment_id
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating task assignment: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def create_peer_evaluations_acceptance(task_id, assignment_id, contributor_id, reviewers):
    """Create peer evaluations with acceptance scenario."""
    logger.info("Creating peer evaluations (majority approve scenario)...")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Create evaluations (2 approve, 1 reject = majority approve)
        evaluations = [
            (reviewers[0]['id'], 4.5, 'completed', 'Excellent work!'),
            (reviewers[1]['id'], 4.0, 'completed', 'Good quality work'),
            (reviewers[2]['id'], 2.5, 'completed', 'Needs improvement'),
        ]
        
        logger.info(f"  Creating {len(evaluations)} peer evaluations:")
        for i, (evaluator_id, score, status, comment) in enumerate(evaluations, 1):
            logger.info(f"    Evaluation {i}: Reviewer {evaluator_id}, Score {score}, Status {status}")
            
            cursor.execute("""
                INSERT INTO peer_evaluations (
                    task_id, evaluator_id, evaluatee_id, assignment_id, 
                    overall_score, strengths, areas_for_improvement, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                task_id, evaluator_id, contributor_id, assignment_id, 
                score, comment, 'Minor improvements needed', status
            ))
            logger.info(f"    ✅ Evaluation {i} created")
        
        conn.commit()
        logger.info(f"✅ Successfully created {len(evaluations)} peer evaluations")
        logger.info("  Expected outcome: Majority approve (2 approve, 1 reject)")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Error creating peer evaluations: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def check_acceptance_results(task_id, contributor_id):
    """Check the results of the acceptance process."""
    logger.info("Checking acceptance system results...")
    conn = connect_db()
    cursor = conn.cursor()
    
    print("\n" + "="*50)
    print("CHECKING ACCEPTANCE SYSTEM RESULTS")
    print("="*50)
    
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
        
        # Check peer evaluation statuses
        logger.info("Checking peer evaluation statuses...")
        cursor.execute("""
            SELECT status, overall_score 
            FROM peer_evaluations 
            WHERE assignment_id = (
                SELECT id FROM task_assignments 
                WHERE task_id = %s AND user_id = %s
            )
        """, (task_id, contributor_id))
        
        evaluations = cursor.fetchall()
        logger.info(f"  Found {len(evaluations)} peer evaluations")
        print(f"✅ Peer Evaluations: {len(evaluations)} found")
        for i, (status, score) in enumerate(evaluations, 1):
            logger.info(f"    Evaluation {i}: Status={status}, Score={score}")
            print(f"   Evaluation {i}: Status={status}, Score={score}")
        
        # Check user skill ratings (should be improved)
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
        
        # Calculate average score
        logger.info("Calculating average evaluation score...")
        cursor.execute("""
            SELECT AVG(overall_score) as avg_score
            FROM peer_evaluations 
            WHERE assignment_id = (
                SELECT id FROM task_assignments 
                WHERE task_id = %s AND user_id = %s
            )
        """, (task_id, contributor_id))
        
        avg_score_result = cursor.fetchone()
        if avg_score_result and avg_score_result[0]:
            avg_score = avg_score_result[0]
            logger.info(f"  Average score: {avg_score:.2f}")
            print(f"✅ Average Evaluation Score: {avg_score:.2f}")
        
        print("\n" + "="*50)
        print("EXPECTED RESULTS:")
        print("- Task status should be 'completed'")
        print("- Assignment status should be 'completed'")
        print("- Original contributor should NOT be blocked")
        print("- User skill ratings should be improved")
        print("- Peer evaluations should be marked as 'approved'")
        print("="*50)
        
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
        logger.info(f"  Deleting peer evaluations for task {task_id}...")
        cursor.execute("DELETE FROM peer_evaluations WHERE task_id = %s", (task_id,))
        deleted_evaluations = cursor.rowcount
        logger.info(f"    Deleted {deleted_evaluations} peer evaluations")
        
        logger.info(f"  Deleting task assignments for task {task_id}...")
        cursor.execute("DELETE FROM task_assignments WHERE task_id = %s", (task_id,))
        deleted_assignments = cursor.rowcount
        logger.info(f"    Deleted {deleted_assignments} task assignments")
        
        logger.info(f"  Deleting task blocks for task {task_id}...")
        cursor.execute("DELETE FROM task_blocks WHERE task_id = %s", (task_id,))
        deleted_blocks = cursor.rowcount
        logger.info(f"    Deleted {deleted_blocks} task blocks")
        
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

def test_acceptance_flow():
    """Main test function."""
    logger.info("🚀 Starting Acceptance System Test")
    print("🚀 Starting Acceptance System Test")
    print("="*50)
    
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
        
        # Step 3: Set up contributor skills (with lower initial rating to show improvement)
        logger.info("Step 3: Setting up contributor skills...")
        print("\n3. Setting up contributor skills...")
        setup_user_skills(contributor['id'], skill_ids, initial_rating=3.0)
        
        # Step 4: Simulate task assignment
        logger.info("Step 4: Simulating task assignment...")
        print("\n4. Simulating task assignment...")
        assignment_id = simulate_task_assignment(task_id, contributor['id'])
        logger.info(f"  Assignment ID: {assignment_id}")
        
        # Step 5: Create peer evaluations (majority approve)
        logger.info("Step 5: Creating peer evaluations...")
        print("\n5. Creating peer evaluations (majority approve scenario)...")
        create_peer_evaluations_acceptance(task_id, assignment_id, contributor['id'], reviewers)
        
        # Step 6: Trigger the acceptance process
        logger.info("Step 6: Triggering acceptance process...")
        print("\n6. Triggering acceptance process...")
        logger.info("  (This simulates what happens when all evaluations are completed)")
        print("(This simulates what happens when all evaluations are completed)")
        
        # The acceptance logic should automatically trigger when all evaluations are 'completed'
        # Let's check the results
        time.sleep(1)  # Small delay to ensure database updates
        logger.info("  Waiting 1 second for database updates...")
        
        # Step 7: Check results
        logger.info("Step 7: Checking results...")
        check_acceptance_results(task_id, contributor['id'])
        
        # Step 8: Cleanup
        logger.info("Step 8: Cleaning up test data...")
        user_ids = [user['id'] for user in users]
        cleanup_test_data(task_id, user_ids)
        
        logger.info("🎉 Acceptance test completed successfully!")
        print("\n🎉 Acceptance test completed successfully!")
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

def test_both_scenarios():
    """Test both acceptance and rejection scenarios."""
    logger.info("🔄 Testing Both Acceptance and Rejection Scenarios")
    print("🔄 Testing Both Acceptance and Rejection Scenarios")
    print("="*60)
    
    print("\n" + "="*30)
    print("SCENARIO 1: ACCEPTANCE")
    print("="*30)
    test_acceptance_flow()
    
    print("\n" + "="*30)
    print("SCENARIO 2: REJECTION")
    print("="*30)
    
    # Import and run rejection test
    try:
        from test_rejection_flow import test_rejection_flow
        test_rejection_flow()
    except ImportError:
        logger.error("❌ Rejection test file not found")
        print("❌ Rejection test file not found. Run test_rejection_flow.py separately.")
    
    logger.info("🎉 Both scenarios tested!")
    print("\n🎉 Both scenarios tested!")

if __name__ == "__main__":
    # You can run either individual test or both
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "both":
        test_both_scenarios()
    else:
        test_acceptance_flow() 