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
               email_verified, email_verification_token, email_verification_expires, email_verification_sent_at,
               first_name, last_name
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
            "email_verification_sent_at": getattr(result, "email_verification_sent_at", None),
            "first_name": getattr(result, "first_name", None),
            "last_name": getattr(result, "last_name", None)
        }
    return None

def get_user_by_username(db: Session, username: str):
    """Get user by username"""
    query = text("""
        SELECT id, email, username, hashed_password, is_active, oauth_provider, oauth_id,
               email_verified, email_verification_token, email_verification_expires, email_verification_sent_at,
               first_name, last_name
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
            "email_verification_sent_at": getattr(result, "email_verification_sent_at", None),
            "first_name": getattr(result, "first_name", None),
            "last_name": getattr(result, "last_name", None)
        }
    return None

def create_user(db: Session, user: UserCreate, email_service: EmailService):
    """Create a new user with hashed password and skills"""
    print(f"=== USER REGISTRATION DEBUG ===")
    print(f"Creating user: {user.email}")
    
    # Check for existing email
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please use a different email address."
        )
    
    # Generate username if not provided
    username = user.username
    if not username:
        # Use first part of email as base username
        base_username = user.email.split("@")[0]
        username = base_username
        
        # Ensure username is unique by appending integer if needed
        counter = 1
        while get_user_by_username(db, username):
            username = f"{base_username}{counter}"
            counter += 1
    else:
        # Check for existing username if provided
        existing_username = get_user_by_username(db, username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken. Please choose a different username."
            )

    hashed_password = get_password_hash(user.password) if user.password else None
    
    verification_token = email_service.generate_verification_token()
    verification_expires = email_service.get_verification_expiry()
    verification_sent_at = datetime.utcnow()
    
    print(f"Generated token: {verification_token}")
    print(f"Token expires: {verification_expires}")
    
    try:
        query = text("""
            INSERT INTO users (email, username, hashed_password, is_active, email_verified, email_verification_token, email_verification_expires, email_verification_sent_at, first_name, last_name)
            VALUES (:email, :username, :hashed_password, FALSE, FALSE, :token, :expires, :sent_at, :first_name, :last_name)
            RETURNING id, email, username, is_active, email_verified, email_verification_token, email_verification_expires, email_verification_sent_at, first_name, last_name
        """)
        result = db.execute(query, {
            "email": user.email,
            "username": username,
            "hashed_password": hashed_password,
            "token": verification_token,
            "expires": verification_expires,
            "sent_at": verification_sent_at,
            "first_name": user.first_name,
            "last_name": user.last_name
        }).fetchone()
        
        print(f"User created with ID: {result.id}")
        print(f"Stored token: {result.email_verification_token}")
        
        if user.skills:
            for skill_id in user.skills:
                db.execute(
                    text("INSERT INTO contributor_skill (user_id, skill_id) VALUES (:user_id, :skill_id)"),
                    {"user_id": result.id, "skill_id": skill_id}
                )
        
        # Commit the transaction
        db.commit()
        print("Database transaction committed")
        
        # Verify the token was actually stored by querying the database
        verify_query = text("""
            SELECT email_verification_token FROM users WHERE id = :user_id
        """)
        verify_result = db.execute(verify_query, {"user_id": result.id}).fetchone()
        print(f"Token verification after commit: {verify_result.email_verification_token if verify_result else 'NOT FOUND'}")
        
        print("User registration completed successfully")
        
        return {
            "id": result.id,
            "email": result.email,
            "username": result.username,
            "is_active": result.is_active,
            "email_verified": result.email_verified,
            "email_verification_token": result.email_verification_token,
            "email_verification_expires": result.email_verification_expires,
            "email_verification_sent_at": result.email_verification_sent_at,
            "first_name": result.first_name,
            "last_name": result.last_name,
            "skills": user.skills
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
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

def create_oauth_user(db: Session, email: str, username: str, full_name: str, oauth_provider: str, oauth_id: str):
    """Create a new user from OAuth provider"""
    print(f"Creating OAuth user: email={email}, username={username}, provider={oauth_provider}")
    
    # Check if user already exists
    existing_user = get_user_by_email(db, email)
    if existing_user:
        print(f"User already exists: {existing_user}")
        return existing_user

    # Create new OAuth user
    query = text("""
        INSERT INTO users (email, username, first_name, last_name, hashed_password, is_active, oauth_provider, oauth_id)
        VALUES (:email, :username, :first_name, :last_name, NULL, TRUE, :oauth_provider, :oauth_id)
        RETURNING id, email, username, first_name, last_name, is_active, oauth_provider, oauth_id
    """)
    
    # Split full name into first and last name
    name_parts = full_name.split(' ', 1)
    first_name = name_parts[0] if name_parts else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''
    
    print(f"Name parts: first_name='{first_name}', last_name='{last_name}'")
    
    result = db.execute(query, {
        "email": email,
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "oauth_provider": oauth_provider,
        "oauth_id": oauth_id
    }).fetchone()
    
    db.commit()
    
    user_data = {
        "id": result.id,
        "email": result.email,
        "username": result.username,
        "first_name": result.first_name,
        "last_name": result.last_name,
        "is_active": result.is_active,
        "oauth_provider": result.oauth_provider,
        "oauth_id": result.oauth_id
    }
    
    print(f"Created OAuth user: {user_data}")
    return user_data

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user by email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not user['hashed_password']:
        return False  # OAuth users don't have passwords
    if not verify_password(password, user['hashed_password']):
        return False
    # if not user['is_active']:
    #     return False  # User account is not active
    if not user['email_verified']:
        return False  # Email is not verified
    return user
