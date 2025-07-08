from sqlalchemy import Boolean, Column, String, Integer, ForeignKey, Table, Float, DateTime, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

# Join table (many-to-many)
contributor_skill = Table(
    'contributor_skill',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('skill_id', Integer, ForeignKey('skills.id')),
    Column('rating', Float, default=2.5),
    Column('num_tasks', Integer, default=0),
    Column('total_score', Float, default=0.0),
    Column('confidence_constant', Integer, default=20),
    Column('baseline_rating', Float, default=2.5),
    PrimaryKeyConstraint('user_id', 'skill_id')
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    is_active = Column(Boolean, default=False)  # Changed to False - requires email verification
    username = Column(String, unique=True, index=True)
    
    # OAuth fields
    oauth_provider = Column(String, nullable=True)  # 'google', 'linkedin', 'github'
    oauth_id = Column(String, nullable=True)  # Provider's user ID

    
    # Email verification fields
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    email_verification_expires = Column(DateTime, nullable=True)
    email_verification_sent_at = Column(DateTime, nullable=True)

    # Contributor fields
    # name = Column(String, index=True)
    # bio = Column(String, nullable=True)
    # avatar = Column(String, nullable=True)
    # average_rating = Column(Float, default=0.0)

    # Relationships
    skills = relationship("Skill", secondary=contributor_skill, back_populates="users")
    assignments = relationship("TaskAssignment", back_populates="user")
    startup = relationship("Startup", back_populates="user", uselist=False)
    reviews_received = relationship("Review", foreign_keys="Review.user_id", back_populates="user")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    # evaluations_given = relationship("PeerEvaluation", foreign_keys="[PeerEvaluation.evaluator_id]", back_populates="evaluator")
    # evaluations_received = relationship("PeerEvaluation", foreign_keys="[PeerEvaluation.evaluatee_id]", back_populates="evaluatee")
    tasks = relationship("Task", back_populates="user")


