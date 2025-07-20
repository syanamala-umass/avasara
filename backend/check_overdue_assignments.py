#!/usr/bin/env python3
"""
Script to check and cancel overdue task assignments.

This script can be run periodically (e.g., via cron) to automatically
cancel assignments that have exceeded their duration limits.

Usage:
    python check_overdue_assignments.py

Or as a cron job (every hour):
    0 * * * * cd /path/to/backend && python check_overdue_assignments.py
"""

import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.penalty_service import penalty_service

def main():
    """Main function to check and cancel overdue assignments."""
    print(f"[{datetime.now()}] Starting overdue assignment check...")
    
    try:
        # Create database session
        db = SessionLocal()
        
        # Check and cancel overdue assignments
        result = penalty_service.check_and_cancel_overdue_assignments(db)
        
        print(f"[{datetime.now()}] Check completed:")
        print(f"  - Total assignments checked: {result['total_checked']}")
        print(f"  - Assignments cancelled: {result['cancelled_count']}")
        
        if result['cancelled_assignments']:
            print("  - Cancelled assignments:")
            for assignment in result['cancelled_assignments']:
                print(f"    * Assignment {assignment['assignment_id']} (Task {assignment['task_id']}) - {assignment['hours_overdue']:.1f} hours overdue")
                print(f"      Reason: {assignment['reason']}")
        else:
            print("  - No assignments were cancelled")
        
        db.close()
        print(f"[{datetime.now()}] Overdue assignment check completed successfully.")
        
    except Exception as e:
        print(f"[{datetime.now()}] Error during overdue assignment check: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 