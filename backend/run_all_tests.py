#!/usr/bin/env python3
"""
Master test runner for the rejection/acceptance system.
This script runs both acceptance and rejection tests and provides a comprehensive report.
"""

import sys
import time
import subprocess
from datetime import datetime

def run_migration():
    """Run database migration to ensure task_blocks table exists."""
    print("🔧 Running database migration...")
    try:
        result = subprocess.run(['alembic', 'upgrade', 'head'], 
                              capture_output=True, text=True, cwd='.')
        if result.returncode == 0:
            print("✅ Migration completed successfully")
            return True
        else:
            print(f"❌ Migration failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

def run_test_script(script_name, description):
    """Run a test script and capture its output."""
    print(f"\n{'='*60}")
    print(f"🧪 RUNNING {description.upper()} TEST")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, cwd='.')
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Test duration: {duration:.2f} seconds")
        
        if result.returncode == 0:
            print(f"✅ {description} test completed successfully")
            return True, result.stdout, result.stderr
        else:
            print(f"❌ {description} test failed")
            print(f"Error output: {result.stderr}")
            return False, result.stdout, result.stderr
            
    except Exception as e:
        print(f"❌ Error running {description} test: {e}")
        return False, "", str(e)

def generate_test_report(acceptance_results, rejection_results):
    """Generate a comprehensive test report."""
    print(f"\n{'='*80}")
    print("📊 COMPREHENSIVE TEST REPORT")
    print(f"{'='*80}")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"Test run completed at: {timestamp}")
    
    # Acceptance test results
    print(f"\n📈 ACCEPTANCE TEST RESULTS:")
    print(f"{'='*40}")
    if acceptance_results[0]:
        print("✅ PASSED - Acceptance flow working correctly")
        print("   - Task status: completed")
        print("   - Assignment status: completed") 
        print("   - User not blocked")
        print("   - Skill ratings improved")
    else:
        print("❌ FAILED - Acceptance flow has issues")
        print(f"   Error: {acceptance_results[2]}")
    
    # Rejection test results
    print(f"\n📉 REJECTION TEST RESULTS:")
    print(f"{'='*40}")
    if rejection_results[0]:
        print("✅ PASSED - Rejection flow working correctly")
        print("   - Task status: open")
        print("   - Assignment status: rejected")
        print("   - User blocked for 30 days")
        print("   - Task available for others")
    else:
        print("❌ FAILED - Rejection flow has issues")
        print(f"   Error: {rejection_results[2]}")
    
    # Overall status
    print(f"\n🎯 OVERALL STATUS:")
    print(f"{'='*40}")
    if acceptance_results[0] and rejection_results[0]:
        print("🎉 ALL TESTS PASSED!")
        print("   The rejection/acceptance system is working correctly.")
        print("   You can now test the UI with confidence.")
    elif acceptance_results[0]:
        print("⚠️  PARTIAL SUCCESS")
        print("   Acceptance flow works, but rejection flow has issues.")
        print("   Check the rejection test output for details.")
    elif rejection_results[0]:
        print("⚠️  PARTIAL SUCCESS")
        print("   Rejection flow works, but acceptance flow has issues.")
        print("   Check the acceptance test output for details.")
    else:
        print("❌ ALL TESTS FAILED")
        print("   Both acceptance and rejection flows have issues.")
        print("   Check the individual test outputs for details.")
    
    # Next steps
    print(f"\n🚀 NEXT STEPS:")
    print(f"{'='*40}")
    if acceptance_results[0] and rejection_results[0]:
        print("1. Start the backend server: uvicorn app.main:app --reload")
        print("2. Start the frontend server: npm start")
        print("3. Test the UI with real user interactions")
        print("4. Verify block information displays correctly")
        print("5. Test resubmission functionality")
    else:
        print("1. Fix the failing test(s) first")
        print("2. Check database schema and migrations")
        print("3. Verify peer evaluation logic")
        print("4. Check task assignment status updates")
        print("5. Re-run tests after fixes")

def main():
    """Main test runner function."""
    print("🚀 AVASARA REJECTION/ACCEPTANCE SYSTEM TEST RUNNER")
    print("="*80)
    
    # Check if we're in the right directory
    import os
    if not os.path.exists('test_acceptance_flow.py') or not os.path.exists('test_rejection_flow.py'):
        print("❌ Error: Test files not found. Make sure you're in the backend directory.")
        print("   Expected files: test_acceptance_flow.py, test_rejection_flow.py")
        return
    
    # Run migration first
    # if not run_migration():
    #     print("❌ Cannot proceed without successful migration.")
    #     return
    
    # Run acceptance test
    acceptance_results = run_test_script('test_acceptance_flow.py', 'acceptance')
    
    # Run rejection test
    rejection_results = run_test_script('test_rejection_flow.py', 'rejection')
    
    # Generate comprehensive report
    generate_test_report(acceptance_results, rejection_results)
    
    print(f"\n{'='*80}")
    print("🏁 TEST RUNNER COMPLETED")
    print(f"{'='*80}")

if __name__ == "__main__":
    main() 