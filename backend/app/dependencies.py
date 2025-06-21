from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import verify_token
from app.crud.user import get_user_by_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print("=== Authentication Debug ===")
    print(f"Received token: {token[:10]}...")  # Only print first 10 chars for security
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    print(f"Token payload: {payload}")
    
    if payload is None:
        print("Token verification failed")
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        print("No email in token payload")
        raise credentials_exception
    
    print(f"Looking up user with email: {email}")
    user = get_user_by_email(db, email)
    if user is None:
        print("User not found in database")
        raise credentials_exception
    
    print(f"Found user: {user}")
    # Convert dictionary to User model instance
    from app.models.user import User
    return User(**user)


def get_current_contributor(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_startup:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. User is not a contributor."
        )
    return current_user
