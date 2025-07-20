from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.task_assignment import TaskAssignment
import logging

logger = logging.getLogger(__name__)

class PenaltyService:
    """
    Service for handling overdue task assignments.
    
    This service handles:
    - Automatically cancelling overdue assignments
    """
    
    def calculate_completion_time(self, assignment: TaskAssignment) -> float:
        if not assignment.created_at:
            return 0.0
        end_time = assignment.completed_at or assignment.submitted_at
        if not end_time:
            return 0.0
        duration = end_time - assignment.created_at
        return duration.total_seconds() / 3600  # Convert to hours
    
    def is_assignment_overdue(self, task: Task, assignment: TaskAssignment) -> Tuple[bool, float]:
        if not task.task_duration or assignment.status in ['completed', 'cancelled']:
            return False, 0.0
        if not assignment.created_at:
            return False, 0.0
        now = datetime.utcnow()
        time_elapsed = (now - assignment.created_at).total_seconds() / 3600
        is_overdue = time_elapsed > task.task_duration
        hours_overdue = max(0, time_elapsed - task.task_duration)
        return is_overdue, hours_overdue
    
    def cancel_overdue_assignment(self, db: Session, assignment: TaskAssignment) -> Dict:
        task = db.query(Task).filter(Task.id == assignment.task_id).first()
        if not task:
            raise ValueError(f"Task {assignment.task_id} not found")
        is_overdue, hours_overdue = self.is_assignment_overdue(task, assignment)
        if not is_overdue:
            return {
                "cancelled": False,
                "reason": "Assignment is not overdue"
            }
        assignment.status = "cancelled"
        assignment.completed_at = datetime.utcnow()
        active_assignments = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == assignment.task_id,
            TaskAssignment.status.in_(['in_progress', 'submitted'])
        ).count()
        if active_assignments == 0:
            task.status = 'open'
        db.commit()
        return {
            "cancelled": True,
            "assignment_id": assignment.id,
            "task_id": assignment.task_id,
            "user_id": assignment.user_id,
            "hours_overdue": hours_overdue,
            "task_status": task.status,
            "reason": f"Assignment cancelled due to {hours_overdue:.1f} hours overdue"
        }
    
    def check_and_cancel_overdue_assignments(self, db: Session) -> Dict:
        active_assignments = db.query(TaskAssignment).filter(
            TaskAssignment.status.in_(['in_progress', 'submitted'])
        ).all()
        cancelled_assignments = []
        for assignment in active_assignments:
            try:
                task = db.query(Task).filter(Task.id == assignment.task_id).first()
                if not task or not task.task_duration:
                    continue
                is_overdue, hours_overdue = self.is_assignment_overdue(task, assignment)
                if is_overdue:
                    cancellation_result = self.cancel_overdue_assignment(db, assignment)
                    if cancellation_result["cancelled"]:
                        cancelled_assignments.append(cancellation_result)
            except Exception as e:
                logger.error(f"Error checking assignment {assignment.id}: {str(e)}")
                continue
        return {
            "total_checked": len(active_assignments),
            "cancelled_count": len(cancelled_assignments),
            "cancelled_assignments": cancelled_assignments
        }
    
    def get_assignment_duration_info(self, assignment: TaskAssignment) -> Dict:
        actual_duration = self.calculate_completion_time(assignment)
        return {
            "assignment_id": assignment.id,
            "created_at": assignment.created_at,
            "completed_at": assignment.completed_at,
            "actual_duration_hours": actual_duration
        }

# Global instance
penalty_service = PenaltyService() 