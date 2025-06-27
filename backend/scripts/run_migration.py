#!/usr/bin/env python3
"""
Database Migration Script for Avasara Review System

This script updates the database schema to support the new binary review system.
Run this script to migrate your existing database to the new schema.
"""

import sqlite3
import os
import sys
from pathlib import Path

def run_migration():
    """Run the database migration"""
    
    # Get the database path
    db_path = Path(__file__).parent.parent / "startup_platform.db"
    
    if not db_path.exists():
        print(f"Error: Database file not found at {db_path}")
        sys.exit(1)
    
    # Get the migration SQL file
    migration_file = Path(__file__).parent / "migrate_review_system.sql"
    
    if not migration_file.exists():
        print(f"Error: Migration file not found at {migration_file}")
        sys.exit(1)
    
    print(f"Starting migration of database: {db_path}")
    print(f"Using migration file: {migration_file}")
    
    # Create a backup of the current database
    backup_path = db_path.with_suffix('.db.backup')
    print(f"Creating backup at: {backup_path}")
    
    try:
        # Read the current database
        with open(db_path, 'rb') as src:
            with open(backup_path, 'wb') as dst:
                dst.write(src.read())
        print("✓ Backup created successfully")
    except Exception as e:
        print(f"Error creating backup: {e}")
        sys.exit(1)
    
    # Read the migration SQL
    try:
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        print("✓ Migration SQL loaded")
    except Exception as e:
        print(f"Error reading migration file: {e}")
        sys.exit(1)
    
    # Connect to the database and run migration
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Running migration...")
        
        # Split the SQL into individual statements
        statements = migration_sql.split(';')
        
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"✓ Executed statement {i+1}")
                except sqlite3.Error as e:
                    print(f"Warning: Statement {i+1} failed: {e}")
                    print(f"Statement: {statement[:100]}...")
                    # Continue with other statements
        
        # Commit the changes
        conn.commit()
        print("✓ Migration completed successfully")
        
        # Verify the new schema
        print("\nVerifying new schema...")
        
        # Check if new tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        required_tables = ['users', 'skills', 'task_skills', 'task_compensations', 'reviews']
        for table in required_tables:
            if table in tables:
                print(f"✓ Table '{table}' exists")
            else:
                print(f"✗ Table '{table}' missing")
        
        # Check if new columns exist in tasks table
        cursor.execute("PRAGMA table_info(tasks)")
        task_columns = [row[1] for row in cursor.fetchall()]
        
        required_task_columns = ['user_id', 'num_reviewers', 'category']
        for column in required_task_columns:
            if column in task_columns:
                print(f"✓ Column '{column}' exists in tasks table")
            else:
                print(f"✗ Column '{column}' missing from tasks table")
        
        # Check if new columns exist in task_assignments table
        cursor.execute("PRAGMA table_info(task_assignments)")
        assignment_columns = [row[1] for row in cursor.fetchall()]
        
        required_assignment_columns = ['user_id', 'assignment_type']
        for column in required_assignment_columns:
            if column in assignment_columns:
                print(f"✓ Column '{column}' exists in task_assignments table")
            else:
                print(f"✗ Column '{column}' missing from task_assignments table")
        
        conn.close()
        print("\nMigration verification completed!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        print("Restoring from backup...")
        
        try:
            # Restore from backup
            with open(backup_path, 'rb') as src:
                with open(db_path, 'wb') as dst:
                    dst.write(src.read())
            print("✓ Database restored from backup")
        except Exception as restore_error:
            print(f"Error restoring from backup: {restore_error}")
        
        sys.exit(1)

if __name__ == "__main__":
    print("Avasara Review System Database Migration")
    print("=" * 50)
    
    # Ask for confirmation
    response = input("This will modify your database schema. Are you sure you want to continue? (y/N): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        sys.exit(0)
    
    run_migration()
    print("\nMigration completed successfully!")
    print("You can now use the new review system features.") 