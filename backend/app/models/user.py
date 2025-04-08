from sqlalchemy import Boolean, Column, String, Integer
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_startup = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    startup = relationship("Startup", back_populates="user", uselist=False)
    contributor = relationship("Contributor", back_populates="user", uselist=False)
    task_reviews = relationship("TaskReviewer", back_populates="user")
