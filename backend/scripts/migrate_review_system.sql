-- Migration script for Avasara Review System
-- This script updates the database schema to support the new binary review system

-- 1. Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    username VARCHAR UNIQUE NOT NULL
);

-- 2. Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR UNIQUE NOT NULL
);

-- 3. Create task_skills association table
CREATE TABLE IF NOT EXISTS task_skills (
    task_id INTEGER,
    skill_id INTEGER,
    PRIMARY KEY (task_id, skill_id),
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (skill_id) REFERENCES skills (id)
);

-- 4. Create task_compensations table
CREATE TABLE IF NOT EXISTS task_compensations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    amount_type VARCHAR NOT NULL, -- 'task' or 'review'
    compensation_type VARCHAR NOT NULL, -- 'cash' or 'equity'
    amount FLOAT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id)
);

-- 5. Update tasks table
-- Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN user_id INTEGER;
ALTER TABLE tasks ADD COLUMN num_reviewers INTEGER;
ALTER TABLE tasks ADD COLUMN max_parallel_contributors INTEGER;
ALTER TABLE tasks ADD COLUMN contributor_time_limit_hours INTEGER;
ALTER TABLE tasks ADD COLUMN category VARCHAR DEFAULT 'task';

-- 6. Update task_assignments table
-- Add new columns to task_assignments table
ALTER TABLE task_assignments ADD COLUMN assignment_type VARCHAR DEFAULT 'task';

-- Rename contributor_id to user_id
ALTER TABLE task_assignments RENAME TO task_assignments_old;
CREATE TABLE task_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    user_id INTEGER,
    assignment_type VARCHAR DEFAULT 'task',
    status VARCHAR,
    notes TEXT,
    created_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);
INSERT INTO task_assignments SELECT id, task_id, contributor_id, 'task', status, notes, created_at, completed_at FROM task_assignments_old;
DROP TABLE task_assignments_old;

-- 7. Update reviews table
-- Create new reviews table with binary system
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    assignment_id INTEGER,
    user_id INTEGER,           -- Person who did the task
    reviewer_id INTEGER,       -- Person reviewing the task
    is_approved BOOLEAN NOT NULL, -- Binary decision
    feedback TEXT,             -- Optional feedback for rejections
    compensation_amount FLOAT DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (assignment_id) REFERENCES task_assignments (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks (category);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments (task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments (status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_type ON task_assignments (assignment_type);
CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON reviews (task_id);
CREATE INDEX IF NOT EXISTS idx_reviews_assignment_id ON reviews (assignment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_task_compensations_task_id ON task_compensations (task_id);

-- 9. Data migration (if needed)
-- Migrate existing startup_id to user_id in tasks table
-- This assumes startups table has a user_id column
-- UPDATE tasks SET user_id = (SELECT user_id FROM startups WHERE startups.id = tasks.startup_id);

-- Migrate existing contributor_id to user_id in task_assignments
-- This assumes contributors table has a user_id column  
-- UPDATE task_assignments SET user_id = (SELECT user_id FROM contributors WHERE contributors.id = task_assignments.user_id);

-- 10. Set default values for new columns
UPDATE tasks SET category = 'task' WHERE category IS NULL;
UPDATE task_assignments SET assignment_type = 'task' WHERE assignment_type IS NULL; 