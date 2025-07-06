-- Review Tasks Table Schema
-- This table stores review tasks that are created when work is submitted for review

CREATE TABLE IF NOT EXISTS review_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    
    -- Links to original task and assignment
    parent_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assignment_being_reviewed_id INTEGER NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
    
    -- Skill requirements for reviewers
    skill_requirements JSONB DEFAULT '{}',
    
    -- Compensation details
    compensation_amount DECIMAL(10,2) DEFAULT 0,
    compensation_type VARCHAR(50) DEFAULT 'cash',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Constraints
   
);

-- Indexes for better performance
CREATE INDEX idx_review_tasks_status ON review_tasks (status);
CREATE INDEX idx_review_tasks_parent_task_id ON review_tasks (parent_task_id);
CREATE INDEX idx_review_tasks_assignment_id ON review_tasks (assignment_being_reviewed_id);
CREATE INDEX idx_review_tasks_created_at ON review_tasks (created_at);

-- Review Task Assignments Table
-- Links reviewers to review tasks
CREATE TABLE IF NOT EXISTS review_task_assignments (
    id SERIAL PRIMARY KEY,
    review_task_id INTEGER NOT NULL REFERENCES review_tasks(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    
    -- Review decision
    accept_reject BOOLEAN,  -- TRUE = accept, FALSE = reject, NULL = not decided
    
    -- Review details
    technical_score DECIMAL(3,2) CHECK (technical_score >= 0 AND technical_score <= 5),
    collaboration_score DECIMAL(3,2) CHECK (collaboration_score >= 0 AND collaboration_score <= 5),
    innovation_score DECIMAL(3,2) CHECK (innovation_score >= 0 AND innovation_score <= 5),
    reliability_score DECIMAL(3,2) CHECK (reliability_score >= 0 AND reliability_score <= 5),
    
    -- Feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    additional_comments TEXT,
    
    -- Metadata
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT review_assignments_status_check CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT review_assignments_unique_reviewer_task UNIQUE (review_task_id, reviewer_id)
);

-- Indexes for review assignments
CREATE INDEX idx_review_assignments_review_task_id ON review_task_assignments (review_task_id);
CREATE INDEX idx_review_assignments_reviewer_id ON review_task_assignments (reviewer_id);
CREATE INDEX idx_review_assignments_status ON review_task_assignments (status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_tasks_updated_at
    BEFORE UPDATE ON review_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_review_tasks_updated_at();

CREATE TRIGGER trigger_review_assignments_updated_at
    BEFORE UPDATE ON review_task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_review_tasks_updated_at(); 