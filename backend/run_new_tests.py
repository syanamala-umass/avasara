#!/usr/bin/env python3
"""
Master test runner for the new acceptance and rejection system tests.
This script runs both tests and provides comprehensive reporting.
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
        logging.FileHandler('new_tests_master.log')
    ]
)
logger = logging.getLogger(__name__)

def run_acceptance_test():
    """Run the new acceptance test."""
    logger.info("🔄 Running New Acceptance Test...")
    print("\n" + "="*60)
    print("RUNNING NEW ACCEPTANCE TEST")
    print("="*60)
    
    try:
        from test_new_acceptance_flow import test_new_acceptance_flow
        start_time = time.time()
        test_new_acceptance_flow()
        end_time = time.time()
        
        duration = end_time - start_time
        logger.info(f"✅ Acceptance test completed in {duration:.2f} seconds")
        print(f"✅ Acceptance test completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        logger.error(f"❌ Acceptance test failed: {e}")
        print(f"❌ Acceptance test failed: {e}")
        return False

def run_rejection_test():
    """Run the new rejection test."""
    logger.info("🔄 Running New Rejection Test...")
    print("\n" + "="*60)
    print("RUNNING NEW REJECTION TEST")
    print("="*60)
    
    try:
        from test_new_rejection_flow import test_new_rejection_flow
        start_time = time.time()
        test_new_rejection_flow()
        end_time = time.time()
        
        duration = end_time - start_time
        logger.info(f"✅ Rejection test completed in {duration:.2f} seconds")
        print(f"✅ Rejection test completed in {duration:.2f} seconds")
        return True
        
    except Exception as e:
        logger.error(f"❌ Rejection test failed: {e}")
        print(f"❌ Rejection test failed: {e}")
        return False

def run_all_tests():
    """Run both acceptance and rejection tests."""
    logger.info("🚀 Starting New Test Suite")
    print("🚀 Starting New Test Suite")
    print("="*60)
    
    start_time = time.time()
    results = {
        'acceptance': False,
        'rejection': False
    }
    
    # Run acceptance test
    print("\n" + "="*30)
    print("TEST 1: ACCEPTANCE FLOW")
    print("="*30)
    results['acceptance'] = run_acceptance_test()
    
    # Wait between tests
    time.sleep(2)
    
    # Run rejection test
    print("\n" + "="*30)
    print("TEST 2: REJECTION FLOW")
    print("="*30)
    results['rejection'] = run_rejection_test()
    
    # Calculate total time
    end_time = time.time()
    total_duration = end_time - start_time
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUITE SUMMARY")
    print("="*60)
    
    print(f"Total Duration: {total_duration:.2f} seconds")
    print(f"Acceptance Test: {'✅ PASSED' if results['acceptance'] else '❌ FAILED'}")
    print(f"Rejection Test: {'✅ PASSED' if results['rejection'] else '❌ FAILED'}")
    
    if all(results.values()):
        print("\n🎉 ALL TESTS PASSED!")
        logger.info("🎉 All tests passed successfully!")
        return True
    else:
        print("\n❌ SOME TESTS FAILED!")
        logger.error("❌ Some tests failed!")
        return False

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) > 1:
        test_type = sys.argv[1].lower()
        
        if test_type == "acceptance":
            success = run_acceptance_test()
        elif test_type == "rejection":
            success = run_rejection_test()
        elif test_type == "all":
            success = run_all_tests()
        else:
            print("Usage: python run_new_tests.py [acceptance|rejection|all]")
            print("  acceptance - Run only acceptance test")
            print("  rejection  - Run only rejection test")
            print("  all        - Run both tests (default)")
            return
    else:
        # Default: run all tests
        success = run_all_tests()
    
    # Exit with appropriate code
    if success:
        logger.info("✅ Test suite completed successfully")
        print("\n✅ Test suite completed successfully")
        sys.exit(0)
    else:
        logger.error("❌ Test suite failed")
        print("\n❌ Test suite failed")
        sys.exit(1)

if __name__ == "__main__":
    main() 