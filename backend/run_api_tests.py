#!/usr/bin/env python3
"""
Master test runner for API-based acceptance and rejection system tests.
This script uses actual API calls to test the real flow through FastAPI endpoints.
"""

import sys
import time
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('api_tests_master.log')
    ]
)
logger = logging.getLogger(__name__)

def run_api_acceptance_test():
    """Run the API-based acceptance test."""
    logger.info("🔄 Running API-Based Acceptance Test...")
    print("\n" + "="*60)
    print("RUNNING API-BASED ACCEPTANCE TEST")
    print("="*60)
    
    try:
        from test_api_acceptance_flow import test_api_acceptance_flow
        start_time = time.time()
        success = test_api_acceptance_flow()
        end_time = time.time()
        
        duration = end_time - start_time
        if success:
            logger.info(f"✅ API acceptance test completed in {duration:.2f} seconds")
            print(f"✅ API acceptance test completed in {duration:.2f} seconds")
            return True
        else:
            logger.error(f"❌ API acceptance test failed in {duration:.2f} seconds")
            print(f"❌ API acceptance test failed in {duration:.2f} seconds")
            return False
        
    except Exception as e:
        logger.error(f"❌ API acceptance test failed: {e}")
        print(f"❌ API acceptance test failed: {e}")
        return False

def run_api_rejection_test():
    """Run the API-based rejection test."""
    logger.info("🔄 Running API-Based Rejection Test...")
    print("\n" + "="*60)
    print("RUNNING API-BASED REJECTION TEST")
    print("="*60)
    
    try:
        from test_api_rejection_flow import test_api_rejection_flow
        start_time = time.time()
        success = test_api_rejection_flow()
        end_time = time.time()
        
        duration = end_time - start_time
        if success:
            logger.info(f"✅ API rejection test completed in {duration:.2f} seconds")
            print(f"✅ API rejection test completed in {duration:.2f} seconds")
            return True
        else:
            logger.error(f"❌ API rejection test failed in {duration:.2f} seconds")
            print(f"❌ API rejection test failed in {duration:.2f} seconds")
            return False
        
    except Exception as e:
        logger.error(f"❌ API rejection test failed: {e}")
        print(f"❌ API rejection test failed: {e}")
        return False

def check_backend_server():
    """Check if the backend server is running."""
    logger.info("🔍 Checking if backend server is running...")
    print("🔍 Checking if backend server is running...")
    
    try:
        import requests
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            logger.info("✅ Backend server is running")
            print("✅ Backend server is running")
            return True
        else:
            logger.error("❌ Backend server responded with unexpected status")
            print("❌ Backend server responded with unexpected status")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Backend server is not running")
        print("❌ Backend server is not running")
        print("   Please start the backend server with: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        logger.error(f"❌ Error checking backend server: {e}")
        print(f"❌ Error checking backend server: {e}")
        return False

def run_all_api_tests():
    """Run both API-based acceptance and rejection tests."""
    logger.info("🚀 Starting API-Based Test Suite")
    print("🚀 Starting API-Based Test Suite")
    print("="*60)
    
    # Check if backend server is running
    if not check_backend_server():
        print("\n❌ Cannot run tests without backend server running")
        print("Please start the backend server first:")
        print("  cd backend")
        print("  uvicorn app.main:app --reload")
        return False
    
    start_time = time.time()
    results = {
        'acceptance': False,
        'rejection': False
    }
    
    # Run acceptance test
    print("\n" + "="*30)
    print("TEST 1: API ACCEPTANCE FLOW")
    print("="*30)
    results['acceptance'] = run_api_acceptance_test()
    
    # Wait between tests
    time.sleep(2)
    
    # Run rejection test
    print("\n" + "="*30)
    print("TEST 2: API REJECTION FLOW")
    print("="*30)
    results['rejection'] = run_api_rejection_test()
    
    # Calculate total time
    end_time = time.time()
    total_duration = end_time - start_time
    
    # Print summary
    print("\n" + "="*60)
    print("API TEST SUITE SUMMARY")
    print("="*60)
    
    print(f"Total Duration: {total_duration:.2f} seconds")
    print(f"API Acceptance Test: {'✅ PASSED' if results['acceptance'] else '❌ FAILED'}")
    print(f"API Rejection Test: {'✅ PASSED' if results['rejection'] else '❌ FAILED'}")
    
    if all(results.values()):
        print("\n🎉 ALL API TESTS PASSED!")
        logger.info("🎉 All API tests passed successfully!")
        print("\n✅ The acceptance and rejection systems are working correctly")
        print("✅ All API endpoints are functioning as expected")
        print("✅ Business logic is properly implemented")
        return True
    else:
        print("\n❌ SOME API TESTS FAILED!")
        logger.error("❌ Some API tests failed!")
        print("\nThis indicates issues with:")
        if not results['acceptance']:
            print("❌ Acceptance flow - task completion and rating updates")
        if not results['rejection']:
            print("❌ Rejection flow - task reopening and user blocking")
        return False

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) > 1:
        test_type = sys.argv[1].lower()
        
        if test_type == "acceptance":
            if check_backend_server():
                success = run_api_acceptance_test()
            else:
                success = False
        elif test_type == "rejection":
            if check_backend_server():
                success = run_api_rejection_test()
            else:
                success = False
        elif test_type == "all":
            success = run_all_api_tests()
        else:
            print("Usage: python run_api_tests.py [acceptance|rejection|all]")
            print("  acceptance - Run only API acceptance test")
            print("  rejection  - Run only API rejection test")
            print("  all        - Run both API tests (default)")
            print("\nPrerequisites:")
            print("  1. Backend server must be running: uvicorn app.main:app --reload")
            print("  2. Database must be properly configured")
            print("  3. All required packages must be installed")
            return
    else:
        # Default: run all tests
        success = run_all_api_tests()
    
    # Exit with appropriate code
    if success:
        logger.info("✅ API test suite completed successfully")
        print("\n✅ API test suite completed successfully")
        print("\nNext steps:")
        print("1. Test the UI manually to verify the complete user experience")
        print("2. Check the database to verify data integrity")
        print("3. Monitor logs for any unexpected behavior")
        sys.exit(0)
    else:
        logger.error("❌ API test suite failed")
        print("\n❌ API test suite failed")
        print("\nTroubleshooting:")
        print("1. Check if backend server is running")
        print("2. Verify database connection and schema")
        print("3. Check API endpoint responses")
        print("4. Review error logs for specific issues")
        sys.exit(1)

if __name__ == "__main__":
    main() 