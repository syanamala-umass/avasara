import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.startup import StartupCreate, Startup, StartupUpdate, StartupWithTasks
from app.crud.startup import create_startup, get_my_startups, get_startup, get_startups, update_startup
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/startups",
    tags=["startups"],
    responses={404: {"description": "Not found"}},
)

def convert_to_dict(db_model):
    """Convert SQLAlchemy model to dict, removing None values and internal attributes"""
    return {k: v for k, v in db_model.__dict__.items() if v is not None and not k.startswith('_')}

@router.get("/test")
def test(db: Session = Depends(get_db)):
    print("✅ Entered /test route")
    return {"msg": "ok"}

@router.post("/", response_model=Startup, status_code=status.HTTP_201_CREATED)
def create_new_startup(
    startup: StartupCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    db_startup = create_startup(db=db, startup=startup, user_id=current_user.id)
    return convert_to_dict(db_startup)

@router.get("/", response_model=List[Startup])
def read_startups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    startups = get_startups(db, skip=skip, limit=limit)
    return [convert_to_dict(startup) for startup in startups]

# /me endpoint listed beofre /{startup_id} to avoid int parse error
@router.get("/me", response_model=List[StartupWithTasks])
def read_own_startup(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    print("idanna print chey please")
    logging.info("idanna")
    db_startups = get_my_startups(db, user_id=current_user.id)
    if db_startups is None:
        raise HTTPException(status_code=404, detail="Startup profile not found")
    return [convert_to_dict(startup) for startup in db_startups]

@router.get("/{startup_id}", response_model=StartupWithTasks)
def read_startup(startup_id: int, db: Session = Depends(get_db)):
    db_startup = get_startup(db, startup_id=startup_id)
    if db_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return convert_to_dict(db_startup)

@router.put("/{startup_id}", response_model=Startup)
def update_startup_details(
    startup_id: int, 
    startup: StartupUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    db_startup = get_startup(db, startup_id=startup_id)
    if db_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if db_startup.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this startup"
        )
    
    updated_startup = update_startup(db=db, startup_id=startup_id, startup=startup)
    return convert_to_dict(updated_startup)

