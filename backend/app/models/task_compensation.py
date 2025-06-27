from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class TaskCompensation(Base):
    __tablename__ = "task_compensations"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    compensation_type = Column(String(50))  # "cash" or "equity"
    amount_type = Column(String(50))  # Type of amount (e.g., "fixed", "hourly", etc.)
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Unique constraint on task_id and compensation_type
    __table_args__ = (
        UniqueConstraint('task_id', 'compensation_type', name='task_compensations_task_id_compensation_type_key'),
    )

    # Relationships
    task = relationship("Task", back_populates="compensations") 