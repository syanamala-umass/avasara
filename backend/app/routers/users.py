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
    Add or update skills for a user. All new skills start with a 2.5 rating.
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
    
    # Add skills with 2.5 rating for new skills, keep existing ratings for existing skills
    for skill_id in skills_update.skill_ids:
        # Check if skill already exists for user
        existing = db.execute(
            text("SELECT rating FROM contributor_skill WHERE user_id = :user_id AND skill_id = :skill_id"),
            {"user_id": user_id, "skill_id": skill_id}
        ).first()
        
        if existing:
            # Keep existing rating, don't change it
            continue
        else:
            # New skill gets 2.5 rating
            db.execute(
                text("INSERT INTO contributor_skill (user_id, skill_id, rating) VALUES (:user_id, :skill_id, :rating)"),
                {"user_id": user_id, "skill_id": skill_id, "rating": 2.5}
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
    All new skills start with a 2.5 rating.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current user is authorized
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this user's skills")
    
    skill_name = skill_data.get("skill_name")
    
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
        text("SELECT rating FROM contributor_skill WHERE user_id = :user_id AND skill_id = :skill_id"),
        {"user_id": user_id, "skill_id": skill_id}
    ).first()
    
    if existing:
        # Skill already exists for user, return existing rating
        rating = existing.rating
    else:
        # New skill gets 2.5 rating
        rating = 2.5
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

@router.post("/{user_id}/skills/bulk", response_model=List[SkillWithRating])
def add_user_skills_bulk(
    user_id: int,
    skills_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Add multiple skills to a user in one operation.
    Can handle both existing skills (by ID) and new skills (by name).
    All new skills start with a 2.5 rating.
    
    Expected format:
    {
        "existing_skill_ids": [1, 2, 3],
        "new_skill_names": ["Python", "JavaScript", "React"]
    }
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current user is authorized
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this user's skills")
    
    existing_skill_ids = skills_data.get("existing_skill_ids", [])
    new_skill_names = skills_data.get("new_skill_names", [])
    
    # Validate existing skill IDs
    if existing_skill_ids:
        existing_skills = db.query(Skill).filter(Skill.id.in_(existing_skill_ids)).all()
        if len(existing_skills) != len(existing_skill_ids):
            raise HTTPException(status_code=404, detail="One or more existing skills not found")
    
    # Create new skills if any
    new_skill_ids = []
    for skill_name in new_skill_names:
        if not skill_name or not skill_name.strip():
            continue
            
        # Check if skill already exists
        existing_skill = db.query(Skill).filter(Skill.name == skill_name.strip()).first()
        
        if existing_skill:
            new_skill_ids.append(existing_skill.id)
        else:
            # Create new skill
            new_skill = Skill(name=skill_name.strip())
            db.add(new_skill)
            db.flush()  # Get the ID without committing
            new_skill_ids.append(new_skill.id)
    
    # Combine all skill IDs
    all_skill_ids = existing_skill_ids + new_skill_ids
    
    # Remove skills that are not in the new list
    if all_skill_ids:
        db.execute(
            text("""
                DELETE FROM contributor_skill
                WHERE user_id = :user_id
                AND skill_id NOT IN :skill_ids
            """),
            {"user_id": user_id, "skill_ids": tuple(all_skill_ids)}
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
    
    # Add skills with 2.5 rating for new skills, keep existing ratings for existing skills
    for skill_id in all_skill_ids:
        # Check if skill already exists for user
        existing = db.execute(
            text("SELECT rating FROM contributor_skill WHERE user_id = :user_id AND skill_id = :skill_id"),
            {"user_id": user_id, "skill_id": skill_id}
        ).first()
        
        if not existing:
            # New skill gets 2.5 rating
            db.execute(
                text("INSERT INTO contributor_skill (user_id, skill_id, rating) VALUES (:user_id, :skill_id, :rating)"),
                {"user_id": user_id, "skill_id": skill_id, "rating": 2.5}
            )
    
    db.commit()
    
    # Return updated skills list
    return get_user_skills(user_id, db, current_user)

@router.get("/me")
def get_current_user_info(current_user = Depends(get_current_user)):
    """
    Get the current user's information (id, username, email, etc).
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "email_verified": getattr(current_user, "email_verified", None)
    } 