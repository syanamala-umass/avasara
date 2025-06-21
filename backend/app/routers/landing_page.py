from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db

router = APIRouter(
    prefix="/landing",
    tags=["landing"],
)


@router.get("/stats")
async def get_landing_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # 1. Count startups
    startup_count = db.execute(
        text("SELECT COUNT(*) FROM startups")
    ).scalar()

    # 2. Count completed tasks
    completed_tasks_count = db.execute(
        text("""
            SELECT COUNT(*) FROM tasks
            WHERE status IN ('completed', 'reviewed')
        """)
    ).scalar()

    # 3. Top contributors
    top_contributors_result = db.execute(text("""
        SELECT
            users.id,
            users.username,
            COUNT(task_assignments.id) AS completed_tasks
        FROM users
        JOIN task_assignments ON users.id = task_assignments.user_id 
        WHERE task_assignments.status IN ('completed', 'reviewed')
        GROUP BY users.id, users.username
        ORDER BY completed_tasks desc
        LIMIT 5
    """))

    top_contributors = [
        {
            "id": row.id,
            "name": row.name,
            "avatar": row.avatar,
            "rating": float(row.average_rating),
            "completedTasks": row.completed_tasks
        }
        for row in top_contributors_result
    ]

    return {
        "startupCount": startup_count,
        "completedTasksCount": completed_tasks_count,
        "topContributors": top_contributors
    }
