from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from passlib.context import CryptContext
from sqlalchemy import text

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
        SELECT id, email, username, hashed_password, is_active
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
            "is_active": result.is_active
        }
    return None

def create_user(db: Session, user: UserCreate):
    """Create a new user with hashed password"""
    # Check if user already exists
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        return existing_user

    # Create new user with hashed password
    hashed_password = get_password_hash(user.password)
    query = text("""
        INSERT INTO users (email, username, hashed_password, is_active)
        VALUES (:email, :username, :hashed_password, TRUE)
        RETURNING id, email, username, is_active
    """)
    result = db.execute(query, {
        "email": user.email,
        "username": user.username,
        "hashed_password": hashed_password
    }).fetchone()
    db.commit()
    
    return {
        "id": result.id,
        "email": result.email,
        "username": result.username,
        "is_active": result.is_active
    }

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user by email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user['hashed_password']):
        return False
    return user
