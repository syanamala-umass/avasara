from sqlalchemy.orm import Session
from app.models.contributor import Contributor
from app.schemas.contributor import ContributorCreate, ContributorUpdate

def create_contributor(db: Session, contributor: ContributorCreate, user_id: int):
    db_contributor = Contributor(**contributor.dict(), user_id=user_id)
    db.add(db_contributor)
    db.commit()
    db.refresh(db_contributor)
    return db_contributor

def get_contributor(db: Session, contributor_id: int):
    return db.query(Contributor).filter(Contributor.id == contributor_id).first()

def get_contributors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Contributor).offset(skip).limit(limit).all()

def update_contributor(db: Session, contributor_id: int, contributor: ContributorUpdate, user_id: int):
    db_contributor = db.query(Contributor).filter(Contributor.id == contributor_id, Contributor.user_id == user_id).first()
    if db_contributor:
        for key, value in contributor.dict(exclude_unset=True).items():
            setattr(db_contributor, key, value)
        db.commit()
        db.refresh(db_contributor)
    return db_contributor
