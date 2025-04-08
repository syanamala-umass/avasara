Access the backend at:

http://127.0.0.1:8000 - For the base API
http://127.0.0.1:8000/docs - For the interactive Swagger UI documentation
http://127.0.0.1:8000/redoc - For the ReDoc documentation

# Contributor Platform - Updated Overview

## Core Concept
A platform that connects startups with skilled contributors through a direct task assignment model with peer reviews.

## Key Entities

### Users
- Base user accounts that can be either startup representatives or contributors
- Authentication via JWT tokens

### Startups
- Create profiles with company information
- Post tasks with requirements, skills needed, and compensation
- Do not directly review contributors

### Contributors
- Create profiles with professional information and skills
- Directly pick up tasks they want to work on (no application approval needed)
- Complete tasks and mark them as completed
- Review other contributors' completed work (peer review system)
- Earn compensation for both completing tasks and reviewing others' work

### Tasks
- Posted by startups with descriptions, required skills, and compensation
- Have a lifecycle: open → in_progress → completed → reviewed
- Can be picked up directly by contributors

### Task Assignments (formerly Applications)
- Records of which contributor is working on which task
- Tracks the status of work: in_progress → completed → reviewed
- No approval process - contributors directly claim tasks

### Reviews
- Created by contributors (not startups) to evaluate other contributors' work
- Linked to specific tasks and task assignments
- Reviewers receive compensation for reviewing
- Influence contributors' average ratings

### Skills
- Tagged to both contributors and tasks
- Used for matching contributors with appropriate tasks

## Workflow

1. **Task Creation**:
   - Startups post tasks with requirements and compensation

2. **Task Assignment**:
   - Contributors browse available tasks
   - Contributors directly pick up tasks matching their skills
   - System records the assignment and marks task as "in_progress"

3. **Task Completion**:
   - Contributor completes the work
   - Marks the assignment as "completed"
   - Task becomes available for review

4. **Peer Review**:
   - Other contributors (not the original startup) review the completed work
   - Reviewers provide ratings and comments
   - Reviewers receive compensation for their reviews
   - System updates the contributor's average rating

5. **Task Finalization**:
   - Once reviewed, task is marked as "reviewed"
   - Contributor who completed the task builds reputation through reviews

## Key Differences from Original Implementation

1. **No Application Approval Process**:
   - Changed from an application-based model to direct task assignment
   - Renamed "Applications" to "Task Assignments" to reflect this change

2. **Peer Review System**:
   - Reviews are done by other contributors, not startups
   - Reviewers are compensated for their work
   - Added reviewer relationship to the Review model

3. **Enhanced Status Tracking**:
   - More detailed status tracking for tasks and assignments
   - Added completed_at timestamp to track when tasks are finished

4. **Compensation for Reviews**:
   - Added compensation_amount field to Review model
   - Review compensation is calculated based on task compensation

This updated architecture creates a self-regulating marketplace where quality is maintained through peer review rather than startup oversight.