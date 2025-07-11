from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class LoginLog(Base):
    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    login_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 can be up to 45 characters
    user_agent = Column(Text, nullable=True)
    login_method = Column(String(20), default="email")  # email, oauth_google, oauth_linkedin, oauth_github
    success = Column(String(10), default="success")  # success, failed
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id]) 