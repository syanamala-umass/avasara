from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    skills: Optional[List[int]] = []  # List of skill IDs

class User(UserBase):
    id: int
    is_active: bool
    skills: Optional[List[int]] = []

    class Config:
        orm_mode = True

class UserProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[User] = None

class TokenData(BaseModel):
    email: Optional[str] = None

class RegistrationResponse(BaseModel):
    message: str
