from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.skill import Skill
from app.schemas.skill import SkillWithRating
from app.schemas.user_skill import UserSkillsUpdate
from app.schemas.user import UserProfile
from app.schemas.skill import SkillCreate

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{user_id}/skills", response_model=List[SkillWithRating])
def get_user_skills(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all skills and their ratings for a specific user.
    """
    # Get the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's skills with ratings using plain SQL
    query = text("""
        SELECT 
            s.id,
            s.name,
            cs.rating
        FROM skills s
        JOIN contributor_skill cs ON s.id = cs.skill_id
        WHERE cs.user_id = :user_id
    """)
    
    result = db.execute(query, {"user_id": user_id})
    
    # Format the response
    return [
        {
            "id": row.id,
            "name": row.name,
            "rating": row.rating
        }
        for row in result
    ]

@router.post("/{user_id}/skills", response_model=List[SkillWithRating])
def add_user_skills(
    user_id: int,
    skills_update: UserSkillsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add or update skills for a user with optional ratings.
    Also removes any skills not in the new list.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current user is authorized (either the user themselves or an admin)
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this user's skills")
    
    # Remove skills that are not in the new list
    if skills_update.skill_ids:
        db.execute(
            text("""
                DELETE FROM contributor_skill
                WHERE user_id = :user_id
                AND skill_id NOT IN :skill_ids
            """),
            {"user_id": user_id, "skill_ids": tuple(skills_update.skill_ids)}
        )
    else:
        # If the new list is empty, remove all skills
        db.execute(
            text("""
                DELETE FROM contributor_skill
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )
    
    # Verify all skills exist
    skills = db.query(Skill).filter(Skill.id.in_(skills_update.skill_ids)).all()
    if len(skills) != len(skills_update.skill_ids):
        raise HTTPException(status_code=404, detail="One or more skills not found")
    
    # If ratings are provided, verify they match the number of skills
    if skills_update.ratings and len(skills_update.ratings) != len(skills_update.skill_ids):
        raise HTTPException(status_code=400, detail="Number of ratings must match number of skills")
    
    # Add skills with optional ratings
    for i, skill_id in enumerate(skills_update.skill_ids):
        rating = skills_update.ratings[i] if skills_update.ratings else None
        
        # Check if skill already exists for user
        existing = db.execute(
            text("SELECT 1 FROM contributor_skill WHERE user_id = :user_id AND skill_id = :skill_id"),
            {"user_id": user_id, "skill_id": skill_id}
        ).first()
        
        if existing:
            if rating is not None:
                # Update existing skill rating
                db.execute(
                    text("UPDATE contributor_skill SET rating = :rating WHERE user_id = :user_id AND skill_id = :skill_id"),
                    {"user_id": user_id, "skill_id": skill_id, "rating": rating}
                )
        else:
            # Add new skill with optional rating
            db.execute(
                text("INSERT INTO contributor_skill (user_id, skill_id, rating) VALUES (:user_id, :skill_id, :rating)"),
                {"user_id": user_id, "skill_id": skill_id, "rating": rating}
            )
    
    db.commit()
    
    # Return updated skills list
    return get_user_skills(user_id, db, current_user)

@router.get("/{user_id}/profile", response_model=UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a user's profile information.
    """
    # Get the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's profile using plain SQL
    query = text("""
        SELECT 
            first_name,
            last_name,
            bio,
            portfolio_url
        FROM users
        WHERE id = :user_id
    """)
    
    result = db.execute(query, {"user_id": user_id}).first()
    
    if not result:
        return UserProfile()  # Return empty profile if no data found
    
    return {
        "first_name": result.first_name,
        "last_name": result.last_name,
        "bio": result.bio,
        "portfolio_url": result.portfolio_url
    }

@router.put("/{user_id}/profile", response_model=UserProfile)
def update_user_profile(
    user_id: int,
    profile: UserProfile,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update a user's profile information.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current user is authorized (either the user themselves or an admin)
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this user's profile")
    
    # Update user profile using plain SQL
    query = text("""
        UPDATE users
        SET 
            first_name = :first_name,
            last_name = :last_name,
            bio = :bio,
            portfolio_url = :portfolio_url
        WHERE id = :user_id
    """)
    
    db.execute(query, {
        "user_id": user_id,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "bio": profile.bio,
        "portfolio_url": profile.portfolio_url
    })
    
    db.commit()
    
    # Return updated profile
    return get_user_profile(user_id, db, current_user)

@router.post("/{user_id}/skills/new", response_model=SkillWithRating)
def add_new_user_skill(
    user_id: int,
    skill_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add a new skill by name and associate it with the user.
    If the skill already exists, associate the existing skill with the user.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current user is authorized
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this user's skills")
    
    skill_name = skill_data.get("skill_name")
    rating = skill_data.get("rating")
    
    if not skill_name:
        raise HTTPException(status_code=400, detail="Skill name is required")
    
    # Check if skill exists
    existing_skill = db.query(Skill).filter(Skill.name == skill_name).first()
    
    if existing_skill:
        skill_id = existing_skill.id
    else:
        # Create new skill
        new_skill = Skill(name=skill_name)
        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)
        skill_id = new_skill.id
    
    # Associate skill with user
    existing = db.execute(
        text("SELECT 1 FROM contributor_skill WHERE user_id = :user_id AND skill_id = :skill_id"),
        {"user_id": user_id, "skill_id": skill_id}
    ).first()
    
    if existing:
        if rating is not None:
            # Update existing skill rating
            db.execute(
                text("UPDATE contributor_skill SET rating = :rating WHERE user_id = :user_id AND skill_id = :skill_id"),
                {"user_id": user_id, "skill_id": skill_id, "rating": rating}
            )
    else:
        # Add new skill with optional rating
        db.execute(
            text("INSERT INTO contributor_skill (user_id, skill_id, rating) VALUES (:user_id, :skill_id, :rating)"),
            {"user_id": user_id, "skill_id": skill_id, "rating": rating}
        )
    
    db.commit()
    
    # Return the skill with rating
    return {
        "id": skill_id,
        "name": skill_name,
        "rating": rating
    } 