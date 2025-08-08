from fastapi import APIRouter, Depends, HTTPException, status
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


@router.get("/public-tasks")
async def get_public_tasks(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get public tasks for landing page display"""
    try:
        print("Starting to fetch public tasks...")
        # Fetch 7 recent open tasks with basic information
        query = text("""
            SELECT 
                t.id,
                t.title,
                t.description,
                t.created_at,
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'category', s.category
                    )
                ) FILTER (WHERE s.id IS NOT NULL) as skills
            FROM tasks t
            INNER JOIN task_skills ts ON t.id = ts.task_id
            INNER JOIN skills s ON ts.skill_id = s.id
            GROUP BY t.id, t.title, t.description, t.created_at
            HAVING COUNT(s.id) > 0
            ORDER BY t.created_at DESC
            LIMIT 7
        """)
        
        print("Executing query...")
        result = db.execute(query)
        print(f"Query executed successfully, fetching results...")
        
        tasks = []
        
        for row in result:
            print(f"Processing task: {row.id} - {row.title}")
            # Handle skills array - filter out null values
            skills = [skill for skill in row.skills if skill['id'] is not None] if row.skills else []
            
            task = {
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "created_at": row.created_at.isoformat() if row.created_at else None,  # Since we're filtering for open tasks
                "skills": skills
            }
            tasks.append(task)
        
        print(f"Successfully processed {len(tasks)} tasks")
        
        return {
            "tasks": tasks,
            "count": len(tasks)
        }
        
    except Exception as e:
        print(f"Error in get_public_tasks: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching public tasks: {str(e)}"
        )
