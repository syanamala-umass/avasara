from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from typing import Optional
from app.models.login_log import LoginLog

class LoginLogger:
    @staticmethod
    def log_login(
        db: Session, 
        user_id: int, 
        login_method: str = "email",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: str = "success"
    ):
        """Log a user login attempt"""
        try:
            login_log = LoginLog(
                user_id=user_id,
                login_timestamp=datetime.utcnow(),
                ip_address=ip_address,
                user_agent=user_agent,
                login_method=login_method,
                success=success
            )
            db.add(login_log)
            db.commit()
            return True
        except Exception as e:
            print(f"Error logging login: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def get_user_login_count(db: Session, user_id: int) -> int:
        """Get total number of successful logins for a user"""
        try:
            query = text("""
                SELECT COUNT(*) as login_count
                FROM login_logs
                WHERE user_id = :user_id AND success = 'success'
            """)
            result = db.execute(query, {"user_id": user_id}).fetchone()
            return result.login_count if result else 0
        except Exception as e:
            print(f"Error getting login count: {e}")
            return 0
    
    @staticmethod
    def get_user_login_history(db: Session, user_id: int, limit: int = 10):
        """Get recent login history for a user"""
        try:
            query = text("""
                SELECT login_timestamp, ip_address, user_agent, login_method, success
                FROM login_logs
                WHERE user_id = :user_id
                ORDER BY login_timestamp DESC
                LIMIT :limit
            """)
            results = db.execute(query, {"user_id": user_id, "limit": limit}).fetchall()
            return [
                {
                    "login_timestamp": row.login_timestamp,
                    "ip_address": row.ip_address,
                    "user_agent": row.user_agent,
                    "login_method": row.login_method,
                    "success": row.success
                }
                for row in results
            ]
        except Exception as e:
            print(f"Error getting login history: {e}")
            return []
    
    @staticmethod
    def get_all_users_login_stats(db: Session):
        """Get login statistics for all users"""
        try:
            query = text("""
                SELECT 
                    u.id,
                    u.email,
                    u.username,
                    COUNT(ll.id) as total_logins,
                    COUNT(CASE WHEN ll.success = 'success' THEN 1 END) as successful_logins,
                    COUNT(CASE WHEN ll.success = 'failed' THEN 1 END) as failed_logins,
                    MAX(ll.login_timestamp) as last_login
                FROM users u
                LEFT JOIN login_logs ll ON u.id = ll.user_id
                GROUP BY u.id, u.email, u.username
                ORDER BY total_logins DESC
            """)
            results = db.execute(query).fetchall()
            return [
                {
                    "user_id": row.id,
                    "email": row.email,
                    "username": row.username,
                    "total_logins": row.total_logins,
                    "successful_logins": row.successful_logins,
                    "failed_logins": row.failed_logins,
                    "last_login": row.last_login
                }
                for row in results
            ]
        except Exception as e:
            print(f"Error getting login stats: {e}")
            return [] 