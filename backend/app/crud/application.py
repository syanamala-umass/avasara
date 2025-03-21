from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.application import Application
from app.schemas.application import ApplicationCreate, ApplicationUpdate

def create_application(db: Session, application: ApplicationCreate, contributor_id: int):
    db_application = Application(
        task_id=application.task_id,
        contributor_id=contributor_id,
        message=application.message
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

def get_application(db: Session, application_id: int):
    return db.query(Application).filter(Application.id == application_id).first()

def get_applications(db: Session, skip: int = 0, limit: int = 100, 
                    contributor_id: Optional[int] = None, 
                    startup_id: Optional[int] = None):
    query = db.query(Application)
    
    if contributor_id:
        query = query.filter(Application.contributor_id == contributor_id)
    
    if startup_id:
        query = query.join(Application.task).filter(Task.startup_id == startup_id)
        
    return query.offset(skip).limit(limit).all()

def update_application(db: Session, application_id: int, application: ApplicationUpdate):
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if db_application:
        update_data = application.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_application, key, value)
        db.commit()
        db.refresh(db_application)
    return db_application

def delete_application(db: Session, application_id: int):
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if db_application:
        db.delete(db_application)
        db.commit()
        return True
    return False
