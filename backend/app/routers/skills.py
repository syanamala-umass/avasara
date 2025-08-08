import os
import io
import PyPDF2
import docx
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from app.database import get_db
from app import models
from app.schemas.skill import Skill, SkillCreate, SkillWithTaskCount
from app.crud.skill import get_skills, create_skill, get_skill_by_name
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/skills",
    tags=["skills"],
    responses={404: {"description": "Not found"}},
)


def to_camel_case(s):
    s = s.strip()
    if not s:
        return s
    parts = s.split()
    return parts[0].lower() + ''.join(word.capitalize() for word in parts[1:])


@router.get("/", response_model=List[Skill])
def read_skills(db: Session = Depends(get_db)):
    """Get all skills"""
    skills = db.query(models.Skill).all()
    return skills

@router.get("/top-by-tasks", response_model=List[SkillWithTaskCount])
def get_top_skills_by_tasks(db: Session = Depends(get_db), limit: int = 5):
    """Get top skills by number of tasks"""
    # Query skills with task counts, ordered by task count descending
    # Only include skills that actually have tasks associated with them
    skills_with_counts = db.query(
        models.Skill,
        func.count(models.Task.id).label('task_count')
    ).join(
        models.Task.skills
    ).group_by(
        models.Skill.id
    ).having(
        func.count(models.Task.id) > 0
    ).order_by(
        desc(func.count(models.Task.id))
    ).limit(limit).all()
    
    # Convert to response format
    result = []
    for skill, task_count in skills_with_counts:
        if skill is not None and task_count > 0:
            result.append({
                "id": skill.id,
                "name": skill.name,
                "task_count": task_count
            })
    
    # If we don't have enough skills with tasks, fill with other skills
    if len(result) < limit:
        remaining_limit = limit - len(result)
        
        # Get skills that don't have any tasks associated
        skills_without_tasks = db.query(
            models.Skill
        ).outerjoin(
            models.Task.skills
        ).filter(
            models.Task.id.is_(None)
        ).limit(remaining_limit).all()
        
        # Add skills without tasks to the result
        for skill in skills_without_tasks:
            result.append({
                "id": skill.id,
                "name": skill.name,
                "task_count": 0
            })
    
    return result

@router.post("/", response_model=Skill)
def create_skill(skill: SkillCreate, db: Session = Depends(get_db)):
    """Create a new skill"""
    skill_data = skill.dict()
    # Remove fields that don't exist in the model
    skill_data.pop('description', None)
    # Ensure category is set
    if not skill_data.get('category'):
        skill_data['category'] = 'Other'

    # Enforce camel casing for skill name
    skill_data['name'] = to_camel_case(skill_data['name'])

    db_skill = models.Skill(**skill_data)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.get("/{skill_id}", response_model=Skill)
def get_skill_details(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    # if not skill:
    #     raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@router.get("/{skill_id}/top-task-contributors")
def get_top_task_contributors(skill_id: int, db: Session = Depends(get_db), limit: int = 5):
    # Get the skill name from the skill_id
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    # if not skill:
    #     raise HTTPException(status_code=404, detail="Skill not found")
    skill_name = skill.name
    # Users who completed the most tasks with this skill
    result = db.execute(text('''
        SELECT u.id, u.username, COUNT(ta.id) as task_count
        FROM users u
        JOIN task_assignments ta ON ta.user_id = u.id
        JOIN tasks t ON t.id = ta.task_id
        WHERE ta.status = 'completed' AND t.skill_review_requirements::jsonb ? :skill_name
        GROUP BY u.id, u.username
        ORDER BY task_count DESC
        LIMIT :limit
    '''), {'skill_name': skill_name, 'limit': limit})
    return [dict(row) for row in result.mappings().all()]

@router.get("/{skill_id}/top-rated-contributors")
def get_top_rated_contributors(skill_id: int, db: Session = Depends(get_db), limit: int = 5):
    # Users with highest average rating for this skill
    result = db.execute(text('''
        SELECT u.id, u.username, AVG(us.rating) as avg_rating
        FROM users u
        JOIN user_skills us ON us.user_id = u.id
        WHERE us.skill_id = :skill_id
        GROUP BY u.id, u.username
        ORDER BY avg_rating DESC
        LIMIT :limit
    '''), {'skill_id': skill_id, 'limit': limit})
    return [dict(row) for row in result.mappings().all()]

@router.get("/{skill_id}/top-job-posters")
def get_top_job_posters(skill_id: int, db: Session = Depends(get_db), limit: int = 5):
    # Get the skill name from the skill_id
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    # if not skill:
    #     raise HTTPException(status_code=404, detail="Skill not found")
    skill_name = skill.name
    # Users who posted the most jobs requiring this skill
    result = db.execute(text('''
        SELECT u.id, u.username, COUNT(t.id) as job_post_count
        FROM users u
        JOIN tasks t ON t.user_id = u.id
        WHERE t.skill_review_requirements::jsonb ? :skill_name
        GROUP BY u.id, u.username
        ORDER BY job_post_count DESC
        LIMIT :limit
    '''), {'skill_name': skill_name, 'limit': limit})
    return [dict(row) for row in result.mappings().all()]

@router.post("/parse-resume")
async def parse_resume_skills(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Parse resume file to extract skills
    Supports PDF and DOCX files
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file type
    allowed_extensions = ['.pdf', '.docx', '.doc']
    file_extension = os.path.splitext(file.filename.lower())[1]
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file type. Please upload PDF or DOCX files only."
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file_extension == '.pdf':
            text = extract_text_from_pdf(content)
        else:  # .docx or .doc
            text = extract_text_from_docx(content)
        
        # Extract skills from text
        extracted_skills = extract_skills_from_text(text)
        
        # Get existing skills from database
        existing_skills = get_skills(db)
        existing_skill_names = [skill.name.lower() for skill in existing_skills]
        
        # Match extracted skills with existing skills
        matched_skills = []
        new_skills = []
        
        for skill_name in extracted_skills:
            skill_name_lower = skill_name.lower()
            
            # Check if skill already exists in database
            if skill_name_lower in existing_skill_names:
                # Find the existing skill
                existing_skill = next(skill for skill in existing_skills if skill.name.lower() == skill_name_lower)
                matched_skills.append({
                    "id": existing_skill.id,
                    "name": existing_skill.name,
                    "category": existing_skill.category,
                    "is_existing": True
                })
            else:
                # This is a new skill
                new_skills.append({
                    "name": skill_name,
                    "category": categorize_skill(skill_name),
                    "is_existing": False
                })
        
        return {
            "extracted_skills": matched_skills + new_skills,
            "total_skills_found": len(extracted_skills),
            "existing_skills_matched": len(matched_skills),
            "new_skills_found": len(new_skills),
            "raw_text_preview": text[:500] + "..." if len(text) > 500 else text
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing resume: {str(e)}"
        )

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF content"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")

def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX content"""
    try:
        doc = docx.Document(io.BytesIO(content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error reading DOCX: {str(e)}")

def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills from text using pattern matching"""
    # Common skills dictionary
    skills_dict = {
        # Technology Skills
        'javascript': ['javascript', 'js', 'es6', 'react', 'angular', 'vue', 'node.js', 'nodejs'],
        'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scikit-learn'],
        'java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
        'c++': ['c++', 'cpp', 'c plus plus'],
        'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'sqlite', 'mongodb'],
        'html': ['html', 'html5', 'css', 'css3', 'sass', 'scss'],
        'docker': ['docker', 'kubernetes', 'containerization'],
        'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
        'azure': ['azure', 'microsoft azure'],
        'gcp': ['gcp', 'google cloud platform', 'google cloud'],
        
        # Design Skills
        'ui/ux': ['ui/ux', 'ui', 'ux', 'user interface', 'user experience', 'wireframing'],
        'figma': ['figma', 'sketch', 'adobe xd', 'invision'],
        'photoshop': ['photoshop', 'adobe photoshop', 'illustrator', 'adobe illustrator'],
        'design systems': ['design systems', 'design system'],
        
        # Business Skills
        'project management': ['project management', 'agile', 'scrum', 'kanban', 'jira'],
        'product management': ['product management', 'product manager'],
        'business analysis': ['business analysis', 'business analyst'],
        'marketing': ['marketing', 'digital marketing', 'social media marketing'],
        'sales': ['sales', 'business development'],
        'analytics': ['analytics', 'data analysis', 'business intelligence', 'bi'],
        
        # Creative Skills
        'content writing': ['content writing', 'copywriting', 'blogging'],
        'video editing': ['video editing', 'premiere pro', 'final cut pro'],
        'animation': ['animation', 'motion graphics', 'after effects'],
        'photography': ['photography', 'photo editing', 'lightroom'],
        'graphic design': ['graphic design', 'visual design'],
        
        # Other Skills
        'excel': ['excel', 'microsoft excel', 'spreadsheets'],
        'powerpoint': ['powerpoint', 'presentations', 'microsoft powerpoint'],
        'word': ['word', 'microsoft word', 'documentation'],
        'git': ['git', 'github', 'version control'],
        'linux': ['linux', 'unix', 'bash', 'shell scripting'],
        'machine learning': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
        'data science': ['data science', 'data scientist'],
        'devops': ['devops', 'ci/cd', 'jenkins', 'gitlab'],
        'testing': ['testing', 'qa', 'quality assurance', 'selenium'],
        'api': ['api', 'apis', 'rest', 'graphql'],
    }
    
    # Convert text to lowercase for matching
    text_lower = text.lower()
    
    # Extract skills using pattern matching
    found_skills = set()
    
    for skill_name, variations in skills_dict.items():
        for variation in variations:
            if variation in text_lower:
                found_skills.add(skill_name)
                break
    
    # Also look for common skill patterns
    skill_patterns = [
        r'\b(?:proficient in|experienced with|skilled in|expert in)\s+([a-zA-Z\s/\+#]+)',
        r'\b(?:knowledge of|familiar with|working with)\s+([a-zA-Z\s/\+#]+)',
        r'\b([a-zA-Z\s/\+#]+)\s+(?:development|programming|design|management|analysis)',
    ]
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            skill = match.strip()
            if len(skill) > 2 and len(skill) < 50:  # Reasonable skill name length
                found_skills.add(skill)
    
    return list(found_skills)

def categorize_skill(skill_name: str) -> str:
    """Categorize a skill based on its name"""
    skill_lower = skill_name.lower()
    
    tech_skills = ['javascript', 'python', 'java', 'c++', 'sql', 'html', 'docker', 'aws', 'azure', 'gcp', 'git', 'linux', 'api', 'machine learning', 'data science', 'devops', 'testing']
    design_skills = ['ui/ux', 'figma', 'photoshop', 'design systems', 'graphic design', 'visual design']
    business_skills = ['project management', 'product management', 'business analysis', 'marketing', 'sales', 'analytics', 'excel', 'powerpoint', 'word']
    creative_skills = ['content writing', 'video editing', 'animation', 'photography']
    
    if any(tech in skill_lower for tech in tech_skills):
        return 'tech'
    elif any(design in skill_lower for design in design_skills):
        return 'design'
    elif any(business in skill_lower for business in business_skills):
        return 'business'
    elif any(creative in skill_lower for creative in creative_skills):
        return 'creative'
    else:
        return 'other'
