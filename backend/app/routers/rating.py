from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from app.services.rating_service import rating_service
from app.routers.auth import get_current_user
from app.schemas.user import User

router = APIRouter(prefix="/ratings", tags=["ratings"])

@router.get("/user/{user_id}/skills", response_model=List[Dict])
async def get_user_skill_ratings(user_id: int, current_user: User = Depends(get_current_user)):
    """
    Get all skill ratings for a user.
    
    Args:
        user_id: User ID to get ratings for
        current_user: Currently authenticated user
        
    Returns:
        List of skill ratings with details
    """
    try:
        ratings = rating_service.get_user_all_skills_ratings(user_id)
        return ratings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user ratings: {str(e)}"
        )

@router.get("/user/{user_id}/skill/{skill_id}", response_model=Dict)
async def get_user_skill_rating(user_id: int, skill_id: int, current_user: User = Depends(get_current_user)):
    """
    Get user's rating for a specific skill.
    
    Args:
        user_id: User ID
        skill_id: Skill ID
        current_user: Currently authenticated user
        
    Returns:
        Skill rating details
    """
    try:
        rating = rating_service.get_user_skill_rating(user_id, skill_id)
        if not rating:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill rating not found"
            )
        return rating
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get skill rating: {str(e)}"
        )

@router.get("/user/{user_id}/skill/{skill_id}/summary", response_model=Dict)
async def get_skill_rating_summary(user_id: int, skill_id: int, current_user: User = Depends(get_current_user)):
    """
    Get a summary of user's rating for a specific skill.
    
    Args:
        user_id: User ID
        skill_id: Skill ID
        current_user: Currently authenticated user
        
    Returns:
        Skill rating summary with confidence level and display text
    """
    try:
        summary = rating_service.get_skill_rating_summary(user_id, skill_id)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get rating summary: {str(e)}"
        )

@router.post("/user/{user_id}/skill/{skill_id}/update", response_model=Dict)
async def update_skill_rating(
    user_id: int, 
    skill_id: int, 
    task_accepted: bool, 
    current_user: User = Depends(get_current_user)
):
    """
    Update user's skill rating based on task outcome.
    
    Args:
        user_id: User ID
        skill_id: Skill ID
        task_accepted: True if task was accepted, False if rejected
        current_user: Currently authenticated user
        
    Returns:
        Updated rating information
    """
    try:
        # Only allow users to update their own ratings or admins
        if current_user.id != user_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this user's ratings"
            )
        
        updated_rating = rating_service.update_skill_rating(user_id, skill_id, task_accepted)
        return updated_rating
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update skill rating: {str(e)}"
        )

@router.post("/user/{user_id}/skill/{skill_id}/initialize")
async def initialize_user_skill(user_id: int, skill_id: int, current_user: User = Depends(get_current_user)):
    """
    Initialize a user's skill rating if it doesn't exist.
    
    Args:
        user_id: User ID
        skill_id: Skill ID
        current_user: Currently authenticated user
        
    Returns:
        Success message
    """
    try:
        # Only allow users to initialize their own skills or admins
        if current_user.id != user_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to initialize skills for this user"
            )
        
        rating_service.initialize_user_skill(user_id, skill_id)
        return {"message": "Skill rating initialized successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize skill rating: {str(e)}"
        )

@router.get("/my-skills", response_model=List[Dict])
async def get_my_skill_ratings(current_user: User = Depends(get_current_user)):
    """
    Get current user's skill ratings.
    
    Args:
        current_user: Currently authenticated user
        
    Returns:
        List of current user's skill ratings
    """
    try:
        ratings = rating_service.get_user_all_skills_ratings(current_user.id)
        return ratings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get your skill ratings: {str(e)}"
        )

@router.get("/my-skills/summaries", response_model=List[Dict])
async def get_my_skill_summaries(current_user: User = Depends(get_current_user)):
    """
    Get summaries of current user's skill ratings.
    
    Args:
        current_user: Currently authenticated user
        
    Returns:
        List of skill rating summaries with confidence levels
    """
    try:
        # Get all user's skills first
        from app.database.connection import get_db_cursor
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id FROM skills ORDER BY name")
            skills = cursor.fetchall()
        
        summaries = []
        for skill in skills:
            summary = rating_service.get_skill_rating_summary(current_user.id, skill['id'])
            summaries.append(summary)
        
        return summaries
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get your skill summaries: {str(e)}"
        ) 