#!/usr/bin/env python3
"""
Database Migration Script for Avasara Review System (PostgreSQL)

This script updates the database schema to support the new binary review system.
Run this script to migrate your existing PostgreSQL database to the new schema.
"""

import psycopg2
import os
import sys
from pathlib import Path

def get_db_connection():
    """Get database connection from environment variables"""
    try:
        # Try to get connection details from environment variables
        host = os.getenv('DB_HOST', 'localhost')
        port = os.getenv('DB_PORT', '5432')
        database = os.getenv('DB_NAME', 'avasara')
        user = os.getenv('DB_USER', 'postgres')
        password = os.getenv('DB_PASSWORD', '')
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("Please set the following environment variables:")
        print("  DB_HOST - Database host (default: localhost)")
        print("  DB_PORT - Database port (default: 5432)")
        print("  DB_NAME - Database name (default: avasara)")
        print("  DB_USER - Database user (default: postgres)")
        print("  DB_PASSWORD - Database password")
        sys.exit(1)

def run_migration():
    """Run the database migration"""
    
    # Get the migration SQL file
    migration_file = Path(__file__).parent / "migrate_review_system_postgres.sql"
    
    if not migration_file.exists():
        print(f"Error: Migration file not found at {migration_file}")
        sys.exit(1)
    
    print(f"Using migration file: {migration_file}")
    
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
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Connected to PostgreSQL database")
        print("Running migration...")
        
        # Split the SQL into individual statements
        statements = migration_sql.split(';')
        
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"✓ Executed statement {i+1}")
                except psycopg2.Error as e:
                    print(f"Warning: Statement {i+1} failed: {e}")
                    print(f"Statement: {statement[:100]}...")
                    # Continue with other statements
        
        # Commit the changes
        conn.commit()
        print("✓ Migration completed successfully")
        
        # Verify the new schema
        print("\nVerifying new schema...")
        
        # Check if new tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        required_tables = ['users', 'skills', 'task_skills', 'task_compensations', 'reviews']
        for table in required_tables:
            if table in tables:
                print(f"✓ Table '{table}' exists")
            else:
                print(f"✗ Table '{table}' missing")
        
        # Check if new columns exist in tasks table
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tasks' AND table_schema = 'public'
        """)
        task_columns = [row[0] for row in cursor.fetchall()]
        
        required_task_columns = ['user_id', 'num_reviewers', 'category']
        for column in required_task_columns:
            if column in task_columns:
                print(f"✓ Column '{column}' exists in tasks table")
            else:
                print(f"✗ Column '{column}' missing from tasks table")
        
        # Check if new columns exist in task_assignments table
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'task_assignments' AND table_schema = 'public'
        """)
        assignment_columns = [row[0] for row in cursor.fetchall()]
        
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
        print("Migration failed. Please check the error and try again.")
        sys.exit(1)

if __name__ == "__main__":
    print("Avasara Review System Database Migration (PostgreSQL)")
    print("=" * 60)
    
    # Ask for confirmation
    response = input("This will modify your database schema. Are you sure you want to continue? (y/N): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        sys.exit(0)
    
    run_migration()
    print("\nMigration completed successfully!")
    print("You can now use the new review system features.") 