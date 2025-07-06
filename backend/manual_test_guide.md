# Manual Testing Guide for Rejection/Acceptance System

## Quick Test Setup (Single Account)

### Option 1: Automated Test Runner (Recommended)

1. **Run the master test runner**:
   ```bash
   cd backend
   python run_all_tests.py
   ```
   
   This will:
   - Run database migrations
   - Execute both acceptance and rejection tests
   - Provide a comprehensive report
   - Clean up automatically

2. **Check the results** - you should see:
   - ✅ ACCEPTANCE TEST: Task completed, user ratings improved
   - ✅ REJECTION TEST: Task open, user blocked for 30 days
   - 🎉 ALL TESTS PASSED!

### Option 2: Individual Test Scripts

**Test Acceptance Flow**:
```bash
cd backend
python test_acceptance_flow.py
```

**Test Rejection Flow**:
```bash
cd backend
python test_rejection_flow.py
```

**Test Both Scenarios**:
```bash
cd backend
python test_acceptance_flow.py both
```

### Option 3: Database Direct Testing

1. **Create test data manually**:
   ```sql
   -- Create a test task
   INSERT INTO tasks (title, description, status, skill_review_requirements, num_reviewers)
   VALUES ('Manual Test Task', 'Test task for rejection', 'open', '{"Python": 3}'::jsonb, 3);
   
   -- Create test user
   INSERT INTO users (username, email, hashed_password, is_active)
   VALUES ('testuser', 'test@test.com', 'hashed_password', true);
   
   -- Create task assignment
   INSERT INTO task_assignments (task_id, user_id, assignment_type, status)
   VALUES (1, 1, 'task', 'submitted');
   
   -- For REJECTION: Create peer evaluations (majority reject)
   INSERT INTO peer_evaluations (task_id, evaluator_id, evaluatee_id, assignment_id, overall_score, status)
   VALUES 
     (1, 1, 1, 1, 2.0, 'completed'),  -- Reject
     (1, 1, 1, 1, 1.5, 'completed'),  -- Reject
     (1, 1, 1, 1, 4.0, 'completed');  -- Approve
   
   -- For ACCEPTANCE: Create peer evaluations (majority approve)
   INSERT INTO peer_evaluations (task_id, evaluator_id, evaluatee_id, assignment_id, overall_score, status)
   VALUES 
     (1, 1, 1, 1, 4.5, 'completed'),  -- Approve
     (1, 1, 1, 1, 4.0, 'completed'),  -- Approve
     (1, 1, 1, 1, 2.5, 'completed');  -- Reject
   ```

2. **Check results**:
   ```sql
   -- Check task status
   SELECT status FROM tasks WHERE id = 1;
   
   -- Check if user is blocked
   SELECT * FROM task_blocks WHERE task_id = 1 AND user_id = 1;
   
   -- Check assignment status
   SELECT status FROM task_assignments WHERE task_id = 1;
   
   -- Check user skill ratings
   SELECT s.name, cs.rating, cs.rating_count
   FROM contributor_skill cs
   JOIN skills s ON cs.skill_id = s.id
   WHERE cs.user_id = 1;
   ```

### Option 4: UI Testing with Single Account

1. **Start the servers**:
   ```bash
   # Backend
   cd backend
   uvicorn app.main:app --reload
   
   # Frontend (in another terminal)
   cd frontend
   npm start
   ```

2. **Create test data via API**:
   ```bash
   # Create a task
   curl -X POST "http://localhost:8000/tasks" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "UI Test Task",
       "description": "Test task for UI testing",
       "skill_review_requirements": {"Python": 3},
       "num_reviewers": 3
     }'
   ```

3. **Test the flow**:
   - Log into the UI
   - Look for the test task
   - Try to undertake it
   - Check if you see block information

## Testing Scenarios

### Scenario 1: Majority Rejection
- **Setup**: 2 reviewers reject, 1 approves
- **Expected**: Task becomes "open", user blocked for 30 days
- **Test**: Try to undertake the same task again

### Scenario 2: Majority Approval  
- **Setup**: 2 reviewers approve, 1 rejects
- **Expected**: Task completed, user ratings improved
- **Test**: Check user skill ratings

### Scenario 3: Block Expiration
- **Setup**: Create a block with short duration
- **Expected**: Block expires, user can undertake task again
- **Test**: Wait for expiration or manually update block

## Database Queries for Verification

### Check Current Blocks
```sql
SELECT 
    tb.task_id,
    t.title as task_title,
    u.username as blocked_user,
    tb.blocked_until,
    tb.reason,
    tb.blocked_until - CURRENT_TIMESTAMP as time_remaining
FROM task_blocks tb
JOIN tasks t ON tb.task_id = t.id
JOIN users u ON tb.user_id = u.id
WHERE tb.blocked_until > CURRENT_TIMESTAMP;
```

### Check Task Status
```sql
SELECT 
    id,
    title,
    status,
    skill_review_requirements
FROM tasks
WHERE title LIKE '%Test%';
```

### Check Peer Evaluations
```sql
SELECT 
    pe.task_id,
    pe.evaluator_id,
    pe.evaluatee_id,
    pe.overall_score,
    pe.status,
    ta.status as assignment_status
FROM peer_evaluations pe
JOIN task_assignments ta ON pe.assignment_id = ta.id
WHERE pe.task_id = 1;
```

### Check User Skill Ratings
```sql
SELECT 
    u.username,
    s.name as skill_name,
    cs.rating,
    cs.rating_count
FROM contributor_skill cs
JOIN users u ON cs.user_id = u.id
JOIN skills s ON cs.skill_id = s.id
WHERE u.username LIKE '%test%';
```

## Troubleshooting

### Common Issues

1. **Blocks not appearing**:
   - Check if peer evaluations are marked as 'completed'
   - Verify the rejection logic is triggered
   - Check database constraints

2. **Task not resetting to 'open'**:
   - Ensure majority of evaluations are rejections
   - Check task assignment status is 'submitted'
   - Verify peer evaluation completion

3. **Task not completing on acceptance**:
   - Ensure majority of evaluations are approvals
   - Check task assignment status is 'submitted'
   - Verify peer evaluation completion

4. **Frontend not showing blocks**:
   - Check API response format
   - Verify block_details are included
   - Check browser console for errors

### Debug Commands

```sql
-- Check if rejection/acceptance logic ran
SELECT 
    ta.status as assignment_status,
    COUNT(pe.id) as total_evaluations,
    COUNT(CASE WHEN pe.status = 'completed' THEN 1 END) as completed_evaluations,
    AVG(pe.overall_score) as average_score,
    CASE 
        WHEN AVG(pe.overall_score) >= 3.0 THEN 'likely_acceptance'
        ELSE 'likely_rejection'
    END as expected_outcome
FROM task_assignments ta
LEFT JOIN peer_evaluations pe ON ta.id = pe.assignment_id
WHERE ta.task_id = 1
GROUP BY ta.status;
```

## Expected Results

### After Acceptance Test:
1. **Task Status**: "completed" (no longer available)
2. **Assignment Status**: "completed" (successful completion)
3. **User Block**: None (user not blocked)
4. **Peer Evaluations**: All marked as 'completed'
5. **Skill Ratings**: Improved based on positive evaluations

### After Rejection Test:
1. **Task Status**: "open" (available for other contributors)
2. **Assignment Status**: "rejected" (original assignment)
3. **User Block**: Active for 30 days from rejection
4. **Peer Evaluations**: All marked as 'completed'
5. **Skill Ratings**: Decreased based on negative evaluations

## Test Files Overview

- **`run_all_tests.py`**: Master test runner (recommended)
- **`test_acceptance_flow.py`**: Tests majority approval scenario
- **`test_rejection_flow.py`**: Tests majority rejection scenario
- **`manual_test_guide.md`**: This guide for manual testing

## Next Steps

Once the basic rejection/acceptance system is working:

1. **Test with real users**: Create multiple accounts and test the full flow
2. **Test edge cases**: Equal votes, single reviewer, etc.
3. **Test resubmission**: Verify rejected users can resubmit after grace period
4. **Test cleanup**: Verify expired blocks are removed
5. **Performance test**: Test with many concurrent evaluations
6. **UI integration**: Test the complete user experience
7. **Payment integration**: Test compensation distribution 