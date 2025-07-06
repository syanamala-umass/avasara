-- Create task_blocks table for the rejection system
-- This table tracks users who are blocked from undertaking specific tasks

CREATE TABLE IF NOT EXISTS task_blocks (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    blocked_until TIMESTAMP NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure unique blocking per task-user combination
    UNIQUE(task_id, user_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_task_blocks_task_user ON task_blocks(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_task_blocks_blocked_until ON task_blocks(blocked_until);

-- Add comment to table
COMMENT ON TABLE task_blocks IS 'Tracks users blocked from undertaking specific tasks due to rejection';
COMMENT ON COLUMN task_blocks.task_id IS 'The task the user is blocked from';
COMMENT ON COLUMN task_blocks.user_id IS 'The user who is blocked';
COMMENT ON COLUMN task_blocks.blocked_until IS 'When the block expires';
COMMENT ON COLUMN task_blocks.reason IS 'Reason for the block (e.g., majority rejection)'; 