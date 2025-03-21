from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.startup import StartupCreate, Startup, StartupUpdate, StartupWithTasks
from app.crud.startup import create_startup, get_startup, get_startups, update_startup
from app.dependencies import get_current_startup, get_current_user

router = APIRouter(
    prefix="/startups",
    tags=["startups"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Startup, status_code=status.HTTP_201_CREATED)
def create_new_startup(
    startup: StartupCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    if not current_user.is_startup:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only startup accounts can create a startup profile"
        )
    return create_startup(db=db, startup=startup, user_id=current_user.id)

@router.get("/", response_model=List[Startup])
def read_startups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    startups = get_startups(db, skip=skip, limit=limit)
    return startups

@router.get("/{startup_id}", response_model=StartupWithTasks)
def read_startup(startup_id: int, db: Session = Depends(get_db)):
    db_startup = get_startup(db, startup_id=startup_id)
    if db_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return db_startup

@router.put("/{startup_id}", response_model=Startup)
def update_startup_details(
    startup_id: int, 
    startup: StartupUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_startup)
):
    db_startup = get_startup(db, startup_id=startup_id)
    if db_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    if db_startup.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this startup"
        )
    
    return update_startup(db=db, startup_id=startup_id, startup=startup)

@router.get("/me", response_model=StartupWithTasks)
def read_own_startup(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_startup)
):
    db_startup = get_startup(db, user_id=current_user.id)
    if db_startup is None:
        raise HTTPException(status_code=404, detail="Startup profile not found")
    return db_startup
