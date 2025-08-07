from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from datetime import timedelta, datetime
import logging

from app.database import get_db
from app.schemas.user import UserCreate, User, Token, RegistrationResponse
from app.crud.user import create_user, authenticate_user
from app.core.security import create_access_token
from app.dependencies import get_current_user
from app.services.email_service import EmailService
from app.services.login_logger import LoginLogger
from app.models.user import User
from app.crud.user import get_user_by_email, get_password_hash
from app.schemas.user import User as UserSchema

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}},
)

logger = logging.getLogger("app.routers.auth")

@router.post("/register", response_model=RegistrationResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        email_service = EmailService()
        db_user = create_user(db=db, user=user, email_service=email_service)
        # Send verification email
        email_service.send_verification_email(db_user["email"], db_user["username"], db_user["email_verification_token"])
        return {"message": "Registration successful. Please check your email to verify your account."}
    except HTTPException:
        # Re-raise HTTPExceptions (like duplicate email/username errors)
        raise
    except Exception as e:
        # Handle any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db),
    request: Request = None
):
    # Get client IP and user agent
    client_ip = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    
    # First check if user exists and get their verification status
    user_by_email = get_user_by_email(db, form_data.username)
    
    if not user_by_email:
        # Log failed login attempt
        if request:
            LoginLogger.log_login(
                db=db,
                user_id=0,  # No user ID for failed login
                login_method="email",
                ip_address=client_ip,
                user_agent=user_agent,
                success="failed"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check email verification status
    if not user_by_email['email_verified']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email address before logging in. Check your inbox for a verification link.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # # Check if account is active
    # if not user_by_email['is_active']:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Your account is not active. Please contact support.",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )
    
    # Now authenticate with password
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Log failed login attempt
        if request:
            LoginLogger.log_login(
                db=db,
                user_id=user_by_email['id'],  # We know the user exists
                login_method="email",
                ip_address=client_ip,
                user_agent=user_agent,
                success="failed"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful login
    LoginLogger.log_login(
        db=db,
        user_id=user["id"],
        login_method="email",
        ip_address=client_ip,
        user_agent=user_agent,
        success="success"
    )
    
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    # Convert SQLAlchemy model to dict for Pydantic validation
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "is_active": current_user.is_active,
        "email_verified": current_user.email_verified,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "oauth_provider": current_user.oauth_provider,
        "oauth_id": current_user.oauth_id
    }
    return UserSchema.model_validate(user_dict)

@router.get("/verify-email")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    print(f"=== EMAIL VERIFICATION DEBUG ===")
    print(f"Token received: {token}")
    
    # Find user by token
    query = text("""
        SELECT id, email_verification_expires, email_verified
        FROM users
        WHERE email_verification_token = :token
        LIMIT 1
    """)
    result = db.execute(query, {"token": token}).fetchone()
    
    if not result:
        print("No user found with this token")
        return {"success": False, "message": "Invalid or expired verification link."}
    
    print(f"User found: ID={result.id}, verified={result.email_verified}, expires={result.email_verification_expires}")
    
    if result.email_verified:
        print("Email already verified")
        return {"success": True, "message": "Email already verified."}
    
    if result.email_verification_expires and datetime.utcnow() > result.email_verification_expires:
        print("Token expired")
        return {"success": False, "message": "Verification link has expired."}
    
    # Mark email as verified and activate user
    update_query = text("""
        UPDATE users
        SET email_verified = TRUE, is_active = TRUE, email_verification_token = NULL, email_verification_expires = NULL
        WHERE id = :id
    """)
    db.execute(update_query, {"id": result.id})
    db.commit()
    
    print("Email verification successful")
    return {"success": True, "message": "Email verified successfully! You can now log in."}

@router.post("/request-password-reset")
def request_password_reset(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """Request a password reset (send email with token)"""
    print(f"Password reset requested for email: {email}")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"No user found for email: {email}")
        return {"message": "If an account with that email exists, a reset link has been sent."}
    # Generate token and expiry
    email_service = EmailService()
    token = email_service.generate_verification_token()
    expires = datetime.utcnow() + timedelta(hours=1)
    user.reset_password_token = token
    user.reset_password_expires = expires
    db.commit()
    print(f"Generated reset token for user {user.email}: {token} (expires {expires})")
    # Send email
    email_sent = email_service.send_reset_password_email(user.email, user.username or user.email, token)
    print(f"Reset email sent to {user.email}: {email_sent}")
    return {"message": "If an account with that email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(token: str = Body(...), new_password: str = Body(...), db: Session = Depends(get_db)):
    """Reset password using token"""
    user = db.query(User).filter(User.reset_password_token == token).first()
    if not user or not user.reset_password_expires or user.reset_password_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token.")
    user.hashed_password = get_password_hash(new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    db.commit()
    return {"message": "Password has been reset successfully."}
