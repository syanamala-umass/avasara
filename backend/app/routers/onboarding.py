from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.skill import Skill
from app.schemas.skill import SkillWithRating
from app.crud.skill import get_skills

router = APIRouter(
    prefix="/onboarding",
    tags=["Onboarding"],
    responses={404: {"description": "Not found"}},
)

class SkillsSelectionRequest(BaseModel):
    skill_ids: List[int]
    experience_levels: Dict[int, str] = {}  # skill_id -> "beginner", "intermediate", "expert"

class OnboardingProgress(BaseModel):
    user_id: int
    current_step: str
    completed_steps: List[str]
    total_steps: int
    progress_percentage: float

@router.get("/progress/{user_id}", response_model=OnboardingProgress)
async def get_onboarding_progress(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get the current onboarding progress for a user.
    """
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if user has completed onboarding
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's skills count
    skills_count = db.execute(
        text("SELECT COUNT(*) FROM contributor_skill WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).scalar()
    
    # Define onboarding steps
    steps = ["welcome", "skills_selection", "preferences", "complete"]
    completed_steps = []
    
    if skills_count > 0:
        completed_steps.append("skills_selection")
    
    # Determine current step
    if not completed_steps:
        current_step = "welcome"
    elif "skills_selection" in completed_steps and len(completed_steps) < len(steps) - 1:
        current_step = "preferences"
    else:
        current_step = "complete"
    
    progress_percentage = (len(completed_steps) / (len(steps) - 1)) * 100
    
    return OnboardingProgress(
        user_id=user_id,
        current_step=current_step,
        completed_steps=completed_steps,
        total_steps=len(steps) - 1,
        progress_percentage=progress_percentage
    )

@router.get("/skills", response_model=List[Dict])
async def get_skills_for_onboarding(db: Session = Depends(get_db)):
    """
    Get all available skills for onboarding selection with categories and descriptions.
    """
    skills = get_skills(db, skip=0, limit=1000)  # Get all skills
    
    return [
        {
            "id": skill.id,
            "name": skill.name,
            "category": get_skill_category(skill.name),
            "description": get_skill_description(skill.name)
        }
        for skill in skills
    ]

@router.post("/skills-selection/{user_id}")
async def complete_skills_selection(
    user_id: int,
    skills_data: SkillsSelectionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Complete the skills selection step of onboarding.
    """
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clear existing skills
    db.execute(
        text("DELETE FROM contributor_skill WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    
    # Add selected skills with experience levels
    for skill_id in skills_data.skill_ids:
        experience_level = skills_data.experience_levels.get(skill_id, "beginner")
        rating = experience_level_to_rating(experience_level)
        
        db.execute(
            text("""
                INSERT INTO contributor_skill (user_id, skill_id, rating) 
                VALUES (:user_id, :skill_id, :rating)
            """),
            {"user_id": user_id, "skill_id": skill_id, "rating": rating}
        )
    
    db.commit()
    
    return {"message": "Skills selection completed successfully"}

@router.get("/recommendations/{user_id}")
async def get_personalized_recommendations(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get personalized task recommendations based on user's skills.
    """
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get user's skills
    user_skills = db.execute(
        text("""
            SELECT skill_id FROM contributor_skill 
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    ).fetchall()
    
    skill_ids = [row.skill_id for row in user_skills]
    
    if not skill_ids:
        return {"tasks": [], "message": "Complete your skills selection to get recommendations"}
    
    # Get tasks matching user's skills
    tasks = db.execute(
        text("""
            SELECT DISTINCT t.*, s.name as startup_name
            FROM tasks t
            JOIN task_skills ts ON t.id = ts.task_id
            JOIN startups s ON t.startup_id = s.id
            WHERE ts.skill_id = ANY(:skill_ids)
            AND t.status = 'open'
            ORDER BY t.created_at DESC
            LIMIT 10
        """),
        {"skill_ids": skill_ids}
    ).fetchall()
    
    return {
        "tasks": [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "startup_name": task.startup_name,
                "compensation_amount": task.compensation_amount,
                "compensation_type": task.compensation_type,
                "deadline": task.deadline
            }
            for task in tasks
        ]
    }

def get_skill_category(skill_name: str) -> str:
    """Get category for a skill."""
    categories = {
        "Development": ["Python", "JavaScript", "React", "Node.js", "Java", "C++", "Go", "Rust", "TypeScript", "Vue.js", "Angular", "Django", "Flask", "Express", "Spring", "Laravel", "Ruby on Rails", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "SQL", "MongoDB", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP"],
        "Design": ["UI/UX Design", "Graphic Design", "Web Design", "Logo Design", "Illustration", "Brand Design", "Product Design", "Mobile Design", "Print Design", "Icon Design", "Typography", "Color Theory", "Layout Design", "Prototyping", "Wireframing", "User Research", "Usability Testing", "Design Systems", "Figma", "Sketch", "Adobe Creative Suite", "InVision", "Framer"],
        "Marketing": ["Digital Marketing", "Content Marketing", "SEO", "Social Media Marketing", "Email Marketing", "PPC Advertising", "Google Ads", "Facebook Ads", "Instagram Marketing", "LinkedIn Marketing", "Twitter Marketing", "YouTube Marketing", "TikTok Marketing", "Influencer Marketing", "Affiliate Marketing", "Marketing Analytics", "Google Analytics", "Conversion Optimization", "A/B Testing", "Marketing Automation", "CRM", "Salesforce", "HubSpot"],
        "Business": ["Business Strategy", "Market Research", "Financial Analysis", "Project Management", "Product Management", "Business Development", "Sales", "Customer Success", "Operations Management", "Supply Chain Management", "Human Resources", "Recruitment", "Training & Development", "Performance Management", "Strategic Planning", "Business Model Canvas", "Lean Startup", "Agile Methodology", "Scrum", "Kanban", "Risk Management", "Compliance", "Legal"],
        "Creative": ["Content Writing", "Copywriting", "Technical Writing", "Blog Writing", "Article Writing", "Script Writing", "Video Editing", "Video Production", "Photography", "Videography", "Animation", "Motion Graphics", "3D Modeling", "Game Design", "Music Production", "Sound Design", "Podcast Production", "Voice Acting", "Translation", "Localization", "Creative Direction", "Art Direction"],
        "Data & Analytics": ["Data Analysis", "Data Science", "Machine Learning", "Deep Learning", "Artificial Intelligence", "Natural Language Processing", "Computer Vision", "Predictive Analytics", "Statistical Analysis", "Data Visualization", "Tableau", "Power BI", "Excel", "Python Data Science", "R Programming", "SQL", "Big Data", "Hadoop", "Spark", "Data Engineering", "ETL", "Data Warehousing"]
    }
    
    for category, skills in categories.items():
        if skill_name in skills:
            return category
    return "Other"

def get_skill_description(skill_name: str) -> str:
    """Get description for a skill."""
    descriptions = {
        "Python": "Programming language for web development, data science, and automation",
        "JavaScript": "Web development language for interactive websites and applications",
        "React": "Frontend framework for building user interfaces",
        "UI/UX Design": "Designing user interfaces and user experiences",
        "Digital Marketing": "Online marketing strategies and campaigns",
        "Business Strategy": "Strategic planning and business development",
        "Content Writing": "Creating engaging written content for various platforms",
        "Data Analysis": "Analyzing and interpreting data to drive decisions",
        "Project Management": "Planning, executing, and managing projects effectively",
        "Graphic Design": "Creating visual content and brand materials",
        "SEO": "Search engine optimization for better online visibility",
        "Social Media Marketing": "Marketing through social media platforms",
        "Video Editing": "Editing and producing video content",
        "Photography": "Capturing and editing professional images",
        "Machine Learning": "Building AI models and predictive systems",
        "Web Design": "Designing and building websites",
        "Mobile Development": "Creating mobile applications",
        "DevOps": "Development operations and deployment automation",
        "Cybersecurity": "Protecting systems and data from threats",
        "Blockchain": "Distributed ledger technology and cryptocurrency"
    }
    return descriptions.get(skill_name, f"Skills in {skill_name}")

def experience_level_to_rating(level: str) -> int:
    """Convert experience level to rating."""
    levels = {
        "beginner": 1,
        "intermediate": 3,
        "expert": 5
    }
    return levels.get(level, 1) 