from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.database import get_db
from app.models.startup import Startup
from app.models.task import Task
from app.models.contributor import Contributor
from app.models.task_assignment import TaskAssignment
from app.models.review import Review

router = APIRouter(
    prefix="/landing",
    tags=["landing"],
)


@router.get("/stats")
async def get_landing_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get statistics for the landing page:
    - Number of startups registered
    - Number of completed tasks
    - List of top contributors
    """
    # Count startups
    startup_count = db.query(func.count(Startup.id)).scalar()

    # Count completed tasks
    completed_tasks_count = db.query(func.count(Task.id)).filter(
        Task.status.in_(["completed", "reviewed"])
    ).scalar()

    # Get top contributors (by average rating and number of completed tasks)
    top_contributors_query = (
        db.query(
            Contributor.id,
            Contributor.name,
            Contributor.avatar,
            Contributor.average_rating,
            func.count(TaskAssignment.id).label("completed_tasks")
        )
        .join(TaskAssignment, Contributor.id == TaskAssignment.contributor_id)
        .filter(TaskAssignment.status.in_(["completed", "reviewed"]))
        .group_by(Contributor.id)
        .order_by(Contributor.average_rating.desc(), func.count(TaskAssignment.id).desc())
        .limit(5)
    )

    top_contributors = []
    for contributor in top_contributors_query:
        top_contributors.append({
            "id": contributor.id,
            "name": contributor.name,
            "avatar": contributor.avatar,
            "rating": float(contributor.average_rating),
            "completedTasks": contributor.completed_tasks
        })

    return {
        "startupCount": startup_count,
        "completedTasksCount": completed_tasks_count,
        "topContributors": top_contributors
    }