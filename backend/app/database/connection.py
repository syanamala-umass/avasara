import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

DB_NAME = os.getenv("DB_NAME", "")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


# URL encode the password to handle special characters
encoded_password = quote_plus(DB_PASSWORD)

# Database URL
DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_cursor(commit=False):
    """Get a database cursor with optional commit"""
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD  # No need to encode here as psycopg2 handles it
    )
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        if commit:
            conn.commit()
    finally:
        cursor.close()
        conn.close()

# Database initialization queries
INIT_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_superuser BOOLEAN DEFAULT FALSE,
        name VARCHAR(255),
        bio TEXT,
        avatar VARCHAR(255),
        average_rating FLOAT DEFAULT 0.0
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS startups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        logo VARCHAR(255),
        website VARCHAR(255)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS contributor_skill (
        user_id INTEGER REFERENCES users(id),
        skill_id INTEGER REFERENCES skills(id),
        rating FLOAT DEFAULT 2.5 CHECK (rating >= 0.0 AND rating <= 5.0),
        num_tasks INTEGER DEFAULT 0,
        total_score FLOAT DEFAULT 0.0,
        confidence_constant INTEGER DEFAULT 20,
        baseline_rating FLOAT DEFAULT 2.5,
        PRIMARY KEY (user_id, skill_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        startup_id INTEGER REFERENCES startups(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'open',
        num_reviewers INTEGER,
        max_parallel_contributors INTEGER,
        contributor_time_limit_hours INTEGER,
        category VARCHAR(50) DEFAULT 'task'
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS task_compensations (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id),
        compensation_type VARCHAR(50),
        amount_type VARCHAR(50),
        amount FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (task_id, compensation_type)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS task_skills (
        task_id INTEGER REFERENCES tasks(id),
        skill_id INTEGER REFERENCES skills(id),
        PRIMARY KEY (task_id, skill_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id),
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'in_progress',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS task_evaluators (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id),
        evaluator_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',  -- pending, active, completed
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (task_id, evaluator_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS peer_evaluations (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id),
        evaluator_id INTEGER REFERENCES users(id),
        evaluatee_id INTEGER REFERENCES users(id),
        assignment_id INTEGER REFERENCES task_assignments(id),
        overall_score FLOAT CHECK (overall_score >= 0 AND overall_score <= 5),
        ai_analysis JSONB,
        algorithm_metrics JSONB,
        strengths TEXT,
        areas_for_improvement TEXT,
        additional_comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending'
    );
    """
]

def init_db():
    """Initialize the database with required tables"""
    with get_db_cursor(commit=True) as cursor:
        for query in INIT_QUERIES:
            cursor.execute(query) 
