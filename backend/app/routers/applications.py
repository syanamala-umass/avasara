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
    # Import models
    from app.models.task import Task
    from app.models.contributor import Contributor
    
    # Get applications based on user type
    if current_user.is_startup:
        applications = get_applications(db, skip=skip, limit=limit, startup_id=current_user.startup.id)
    else:
        applications = get_applications(db, skip=skip, limit=limit, contributor_id=current_user.contributor.id)
    
    # Enhance with required additional fields
    result = []
    for app in applications:
        # Get task and contributor details
        task = db.query(Task).filter(Task.id == app.task_id).first()
        contributor = db.query(Contributor).filter(Contributor.id == app.contributor_id).first()
        
        # Create a dictionary with all required fields
        app_dict = {
            # Basic application fields
            "id": app.id,
            "task_id": app.task_id,
            "contributor_id": app.contributor_id,
            "status": app.status,
            "message": app.message,
            "created_at": app.created_at,
            
            # Additional fields required by ApplicationWithDetails
            "task_title": task.title if task else "",
            "contributor_name": contributor.name if contributor else "",
            "contributor_avatar": contributor.avatar if contributor else None
        }
        result.append(app_dict)
    
    return result

@router.get("/{application_id}", response_model=ApplicationWithDetails)
def read_application(application_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Import models
    from app.models.task import Task
    from app.models.contributor import Contributor
    
    # Get the application
    db_application = get_application(db, application_id=application_id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get task and contributor details
    task = db.query(Task).filter(Task.id == db_application.task_id).first()
    contributor = db.query(Contributor).filter(Contributor.id == db_application.contributor_id).first()
    
    # Create a dictionary with all required fields
    app_dict = {
        # Basic application fields
        "id": db_application.id,
        "task_id": db_application.task_id,
        "contributor_id": db_application.contributor_id,
        "status": db_application.status,
        "message": db_application.message,
        "created_at": db_application.created_at,
        
        # Additional fields required by ApplicationWithDetails
        "task_title": task.title if task else "",
        "contributor_name": contributor.name if contributor else "",
        "contributor_avatar": contributor.avatar if contributor else None
    }
    
    return app_dict

@router.put("/{application_id}", response_model=Application)
def update_application_status(application_id: int, application: ApplicationUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_startup)):
    return update_application(db=db, application_id=application_id, application=application)
