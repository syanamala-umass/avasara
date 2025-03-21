from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.contributor import ContributorCreate, Contributor, ContributorUpdate, ContributorWithSkills
from app.crud.contributor import create_contributor, get_contributor, get_contributors, update_contributor
from app.dependencies import get_current_contributor, get_current_user

router = APIRouter(
    prefix="/contributors",
    tags=["contributors"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Contributor, status_code=status.HTTP_201_CREATED)
def create_new_contributor(contributor: ContributorCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.is_startup:
        raise HTTPException(status_code=400, detail="Startups cannot register as contributors")
    return create_contributor(db=db, contributor=contributor, user_id=current_user.id)

@router.get("/", response_model=List[ContributorWithSkills])
def read_contributors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    contributors = get_contributors(db, skip=skip, limit=limit)
    return contributors

@router.get("/{contributor_id}", response_model=ContributorWithSkills)
def read_contributor(contributor_id: int, db: Session = Depends(get_db)):
    db_contributor = get_contributor(db, contributor_id=contributor_id)
    if db_contributor is None:
        raise HTTPException(status_code=404, detail="Contributor not found")
    return db_contributor

@router.put("/{contributor_id}", response_model=Contributor)
def update_contributor_details(contributor_id: int, contributor: ContributorUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_contributor)):
    return update_contributor(db=db, contributor_id=contributor_id, contributor=contributor, user_id=current_user.id)
