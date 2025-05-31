from sqlalchemy import Boolean, Column, String, Integer, ForeignKey, Table, Float
from sqlalchemy.orm import relationship
from app.database import Base

# Join table (many-to-many)
contributor_skill = Table(
    'contributor_skill',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('skill_id', Integer, ForeignKey('skills.id')),
    Column('rating', Integer, nullable=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    username = Column(String, unique=True, index=True)

    # Contributor fields
    name = Column(String, index=True)
    bio = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    average_rating = Column(Float, default=0.0)

    # Relationships
    skills = relationship("Skill", secondary=contributor_skill, back_populates="users")
    assignments = relationship("TaskAssignment", back_populates="user")
    startup = relationship("Startup", back_populates="user", uselist=False)
    reviews_received = relationship("Review", foreign_keys="Review.user_id", back_populates="user")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    evaluations_given = relationship("PeerEvaluation", foreign_keys="[PeerEvaluation.evaluator_id]", back_populates="evaluator")
    evaluations_received = relationship("PeerEvaluation", foreign_keys="[PeerEvaluation.evaluatee_id]", back_populates="evaluatee")


