from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from passlib.context import CryptContext
from sqlalchemy import text
from app.services.email_service import EmailService
from datetime import datetime
from fastapi import HTTPException, status

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    query = text("""
        SELECT id, email, username, hashed_password, is_active, oauth_provider, oauth_id,
               email_verified, email_verification_token, email_verification_expires, email_verification_sent_at
        FROM users
        WHERE email = :email
        LIMIT 1
    """)
    result = db.execute(query, {"email": email}).fetchone()
    if result:
        return {
            "id": result.id,
            "email": result.email,
            "username": result.username,
            "hashed_password": result.hashed_password,
            "is_active": result.is_active,
            "oauth_provider": getattr(result, "oauth_provider", None),
            "oauth_id": getattr(result, "oauth_id", None),
            "email_verified": getattr(result, "email_verified", None),
            "email_verification_token": getattr(result, "email_verification_token", None),
            "email_verification_expires": getattr(result, "email_verification_expires", None),
            "email_verification_sent_at": getattr(result, "email_verification_sent_at", None)
        }
    return None

def get_user_by_username(db: Session, username: str):
    """Get user by username"""
    query = text("""
        SELECT id, email, username, hashed_password, is_active, oauth_provider, oauth_id,
               email_verified, email_verification_token, email_verification_expires, email_verification_sent_at
        FROM users
        WHERE username = :username
        LIMIT 1
    """)
    result = db.execute(query, {"username": username}).fetchone()
    if result:
        return {
            "id": result.id,
            "email": result.email,
            "username": result.username,
            "hashed_password": result.hashed_password,
            "is_active": result.is_active,
            "oauth_provider": getattr(result, "oauth_provider", None),
            "oauth_id": getattr(result, "oauth_id", None),
            "email_verified": getattr(result, "email_verified", None),
            "email_verification_token": getattr(result, "email_verification_token", None),
            "email_verification_expires": getattr(result, "email_verification_expires", None),
            "email_verification_sent_at": getattr(result, "email_verification_sent_at", None)
        }
    return None

def create_user(db: Session, user: UserCreate, email_service: EmailService):
    """Create a new user with hashed password and skills"""
    # Check for existing email
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please use a different email address."
        )
    
    # Check for existing username
    existing_username = get_user_by_username(db, user.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose a different username."
        )

    hashed_password = get_password_hash(user.password) if user.password else None
    
    verification_token = email_service.generate_verification_token()
    verification_expires = email_service.get_verification_expiry()
    verification_sent_at = datetime.utcnow()
    
    try:
        query = text("""
            INSERT INTO users (email, username, hashed_password, is_active, email_verified, email_verification_token, email_verification_expires, email_verification_sent_at)
            VALUES (:email, :username, :hashed_password, FALSE, FALSE, :token, :expires, :sent_at)
            RETURNING id, email, username, is_active, email_verified, email_verification_token, email_verification_expires, email_verification_sent_at
        """)
        result = db.execute(query, {
            "email": user.email,
            "username": user.username,
            "hashed_password": hashed_password,
            "token": verification_token,
            "expires": verification_expires,
            "sent_at": verification_sent_at
        }).fetchone()
        
        if user.skills:
            for skill_id in user.skills:
                db.execute(
                    text("INSERT INTO contributor_skill (user_id, skill_id) VALUES (:user_id, :skill_id)"),
                    {"user_id": result.id, "skill_id": skill_id}
                )
        db.commit()
        
        return {
            "id": result.id,
            "email": result.email,
            "username": result.username,
            "is_active": result.is_active,
            "email_verified": result.email_verified,
            "email_verification_token": result.email_verification_token,
            "email_verification_expires": result.email_verification_expires,
            "email_verification_sent_at": result.email_verification_sent_at,
            "skills": user.skills
        }
        
    except Exception as e:
        db.rollback()
        # Handle specific database constraint errors
        error_message = str(e).lower()
        if "unique constraint" in error_message:
            if "email" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered. Please use a different email address."
                )
            elif "username" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken. Please choose a different username."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed. Please try again."
            )

def create_oauth_user(db: Session, email: str, username: str,  oauth_provider: str, oauth_id: str):
    """Create a new user from OAuth provider"""
    # Check if user already exists
    existing_user = get_user_by_email(db, email)
    if existing_user:
        return existing_user

    # Create new OAuth user
    query = text("""
        INSERT INTO users (email, username, hashed_password, is_active, oauth_provider, oauth_id)
        VALUES (:email, :username, NULL, TRUE, :oauth_provider, :oauth_id)
        RETURNING id, email, username, is_active, oauth_provider, oauth_id
    """)
    result = db.execute(query, {
        "email": email,
        "username": username,
        "oauth_provider": oauth_provider,
        "oauth_id": oauth_id
    }).fetchone()
    
    db.commit()
    
    return {
        "id": result.id,
        "email": result.email,
        "username": result.username,
        "is_active": result.is_active,
        "oauth_provider": result.oauth_provider,
        "oauth_id": result.oauth_id
    }

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user by email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not user['hashed_password']:
        return False  # OAuth users don't have passwords
    if not verify_password(password, user['hashed_password']):
        return False
    return user
