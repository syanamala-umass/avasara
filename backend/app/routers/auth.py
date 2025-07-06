from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from datetime import timedelta, datetime

from app.database import get_db
from app.schemas.user import UserCreate, User, Token, RegistrationResponse
from app.crud.user import create_user, authenticate_user
from app.core.security import create_access_token
from app.dependencies import get_current_user
from app.services.email_service import EmailService

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}},
)

@router.post("/register", response_model=RegistrationResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    email_service = EmailService()
    db_user = create_user(db=db, user=user, email_service=email_service)
    # Send verification email
    
    email_service.send_verification_email(db_user["email"], db_user["username"], db_user["email_verification_token"])
    return {"message": "Registration successful. Please check your email to verify your account."}

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.get("/verify-email")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    # Find user by token
    query = """
        SELECT id, email_verification_expires, email_verified
        FROM users
        WHERE email_verification_token = :token
        LIMIT 1
    """
    result = db.execute(text(query), {"token": token}).fetchone()
    if not result:
        return {"success": False, "message": "Invalid or expired verification link."}
    if result.email_verified:
        return {"success": True, "message": "Email already verified."}
    if result.email_verification_expires and datetime.utcnow() > result.email_verification_expires:
        return {"success": False, "message": "Verification link has expired."}
    # Mark email as verified and activate user
    update_query = """
        UPDATE users
        SET email_verified = TRUE, is_active = TRUE, email_verification_token = NULL, email_verification_expires = NULL
        WHERE id = :id
    """
    db.execute(text(update_query), {"id": result.id})
    db.commit()
    return {"success": True, "message": "Email verified successfully! You can now log in."}
