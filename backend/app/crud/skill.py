from sqlalchemy.orm import Session
from typing import List
from app.models.skill import Skill
from app.schemas.skill import SkillCreate

def create_skill(db: Session, skill: SkillCreate):
    db_skill = Skill(name=skill.name)
    db.add(db_skill)
    try:
        db.commit()
        db.refresh(db_skill)
        print(f"Created skill: {db_skill.id} - {db_skill.name}")
        return db_skill
    except Exception as e:
        print(f"Error creating skill: {e}")
        db.rollback()
        raise
    

def get_skill(db: Session, skill_id: int):
    return db.query(Skill).filter(Skill.id == skill_id).first()

def get_skill_by_name(db: Session, name: str):
    return db.query(Skill).filter(Skill.name == name).first()

def get_skills(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Skill).offset(skip).limit(limit).all()

def get_skills_by_ids(db: Session, skill_ids: List[int]):
    return db.query(Skill).filter(Skill.id.in_(skill_ids)).all()

def delete_skill(db: Session, skill_id: int):
    db_skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if db_skill:
        db.delete(db_skill)
        db.commit()
        return True
    return False
