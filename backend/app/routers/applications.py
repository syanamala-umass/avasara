from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.application import ApplicationCreate, Application, ApplicationUpdate, ApplicationWithDetails
from app.crud.application import create_application, get_application, get_applications, update_application
from app.dependencies import get_current_contributor, get_current_startup, get_current_user

router = APIRouter(
    prefix="/applications",
    tags=["applications"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Application, status_code=status.HTTP_201_CREATED)
def create_new_application(application: ApplicationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_contributor)):
    return create_application(db=db, application=application, contributor_id=current_user.contributor.id)

@router.get("/", response_model=List[ApplicationWithDetails])
def read_applications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.is_startup:
        applications = get_applications(db, skip=skip, limit=limit, startup_id=current_user.startup.id)
    else:
        applications = get_applications(db, skip=skip, limit=limit, contributor_id=current_user.contributor.id)
    return applications

@router.get("/{application_id}", response_model=ApplicationWithDetails)
def read_application(application_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_application = get_application(db, application_id=application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application

@router.put("/{application_id}", response_model=Application)
def update_application_status(application_id: int, application: ApplicationUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_startup)):
    return update_application(db=db, application_id=application_id, application=application)
