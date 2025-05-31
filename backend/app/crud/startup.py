from sqlalchemy.orm import Session
from app.models.startup import Startup
from app.schemas.startup import StartupCreate, StartupUpdate
from datetime import datetime

def create_startup(db: Session, startup: StartupCreate, user_id: int):
    # Create startup with all required fields
    db_startup = Startup(
        **startup.dict(),
        user_id=user_id,
        logo=None  # Default to None if not provided
    )
    db.add(db_startup)
    db.commit()
    db.refresh(db_startup)
    return db_startup

def get_startup(db: Session,  startup_id: int = None):
    print(f"yo, this is the startup user id: {startup_id}")
    if startup_id:
        return db.query(Startup).filter(Startup.id == startup_id).first()
    return None

def get_my_startups(db: Session,  user_id: int = None):
    print(f"yo, this is the startup user id: {user_id}")
    if user_id:
        return db.query(Startup).filter(Startup.user_id == user_id).all()
    return None

def get_startups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Startup).offset(skip).limit(limit).all()

def update_startup(db: Session, startup_id: int, startup: StartupUpdate):
    db_startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if db_startup:
        update_data = startup.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_startup, key, value)
        db.commit()
        db.refresh(db_startup)
    return db_startup

def delete_startup(db: Session, startup_id: int):
    db_startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if db_startup:
        db.delete(db_startup)
        db.commit()
        return True
    return False
