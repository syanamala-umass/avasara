from typing import Dict, List, Optional
from app.database.connection import get_db_cursor
import logging

logger = logging.getLogger(__name__)

class RatingService:
    """
    Service for managing user skill ratings using Bayesian average system.
    
    Formula: new_rating = (C * baseline + total_score) / (C + num_tasks)
    Where:
    - C = confidence constant (default: 20)
    - baseline = starting rating (default: 2.5)
    - total_score = sum of all task outcomes
    - num_tasks = number of tasks completed
    """
    
    def __init__(self, confidence_constant: int = 20, baseline_rating: float = 2.5):
        self.confidence_constant = confidence_constant
        self.baseline_rating = baseline_rating
    
    def calculate_bayesian_rating(self, total_score: float, num_tasks: int) -> float:
        """
        Calculate Bayesian average rating.
        
        Args:
            total_score: Sum of all task outcomes (5 for accepted, 0 for rejected)
            num_tasks: Number of tasks completed
            
        Returns:
            float: Calculated rating between 0.0 and 5.0
        """
        if num_tasks == 0:
            return self.baseline_rating
        
        rating = (self.confidence_constant * self.baseline_rating + total_score) / (self.confidence_constant + num_tasks)
        return max(0.0, min(5.0, rating))
    
    def get_user_skill_rating(self, user_id: int, skill_id: int) -> Optional[Dict]:
        """
        Get user's current rating for a specific skill.
        
        Args:
            user_id: User ID
            skill_id: Skill ID
            
        Returns:
            Dict with rating info or None if not found
        """
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT cs.rating, cs.num_tasks, cs.total_score, cs.confidence_constant, cs.baseline_rating,
                       s.name as skill_name
                FROM contributor_skill cs
                JOIN skills s ON cs.skill_id = s.id
                WHERE cs.user_id = %s AND cs.skill_id = %s
            """, (user_id, skill_id))
            
            result = cursor.fetchone()
            return dict(result) if result else None
    
    def initialize_user_skill(self, user_id: int, skill_id: int) -> None:
        """
        Initialize a user's skill rating if it doesn't exist.
        
        Args:
            user_id: User ID
            skill_id: Skill ID
        """
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                INSERT INTO contributor_skill (user_id, skill_id, rating, num_tasks, total_score, 
                                             confidence_constant, baseline_rating)
                VALUES (%s, %s, %s, 0, 0.0, %s, %s)
                ON CONFLICT (user_id, skill_id) DO NOTHING
            """, (user_id, skill_id, self.baseline_rating, self.confidence_constant, self.baseline_rating))
    
    def update_skill_rating(self, user_id: int, skill_id: int, task_accepted: bool) -> Dict:
        """
        Update user's skill rating based on task outcome.
        
        Args:
            user_id: User ID
            skill_id: Skill ID
            task_accepted: True if task was accepted, False if rejected
            
        Returns:
            Dict with updated rating information
        """
        # Initialize skill if it doesn't exist
        self.initialize_user_skill(user_id, skill_id)
        
        # Calculate score for this task
        task_score = 5.0 if task_accepted else 0.0
        
        with get_db_cursor(commit=True) as cursor:
            # Get current rating data
            cursor.execute("""
                SELECT rating, num_tasks, total_score, confidence_constant, baseline_rating
                FROM contributor_skill
                WHERE user_id = %s AND skill_id = %s
            """, (user_id, skill_id))
            
            current = cursor.fetchone()
            if not current:
                raise ValueError(f"No rating found for user {user_id} and skill {skill_id}")
            
            # Update totals
            new_num_tasks = current['num_tasks'] + 1
            new_total_score = current['total_score'] + task_score
            
            # Calculate new rating
            new_rating = self.calculate_bayesian_rating(new_total_score, new_num_tasks)
            
            # Update database
            cursor.execute("""
                UPDATE contributor_skill
                SET rating = %s, num_tasks = %s, total_score = %s
                WHERE user_id = %s AND skill_id = %s
            """, (new_rating, new_num_tasks, new_total_score, user_id, skill_id))
            
            # Get skill name for response
            cursor.execute("SELECT name FROM skills WHERE id = %s", (skill_id,))
            skill_name = cursor.fetchone()['name']
            
            return {
                'user_id': user_id,
                'skill_id': skill_id,
                'skill_name': skill_name,
                'old_rating': current['rating'],
                'new_rating': new_rating,
                'num_tasks': new_num_tasks,
                'task_accepted': task_accepted,
                'task_score': task_score,
                'confidence_constant': current['confidence_constant'],
                'baseline_rating': current['baseline_rating']
            }
    
    def get_user_all_skills_ratings(self, user_id: int) -> List[Dict]:
        """
        Get all skill ratings for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of skill ratings
        """
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT cs.skill_id, cs.rating, cs.num_tasks, cs.total_score,
                       cs.confidence_constant, cs.baseline_rating,
                       s.name as skill_name
                FROM contributor_skill cs
                JOIN skills s ON cs.skill_id = s.id
                WHERE cs.user_id = %s
                ORDER BY s.name
            """, (user_id,))
            
            results = cursor.fetchall()
            return [dict(row) for row in results]
    
    def get_skill_rating_summary(self, user_id: int, skill_id: int) -> Dict:
        """
        Get a summary of user's rating for a specific skill.
        
        Args:
            user_id: User ID
            skill_id: Skill ID
            
        Returns:
            Dict with rating summary
        """
        rating_data = self.get_user_skill_rating(user_id, skill_id)
        if not rating_data:
            return {
                'skill_id': skill_id,
                'skill_name': 'Unknown',
                'rating': self.baseline_rating,
                'num_tasks': 0,
                'confidence': 'low',
                'display_text': f"{self.baseline_rating}/5 (baseline)"
            }
        
        # Determine confidence level
        if rating_data['num_tasks'] < 5:
            confidence = 'low'
        elif rating_data['num_tasks'] < 15:
            confidence = 'medium'
        else:
            confidence = 'high'
        
        # Create display text
        if rating_data['num_tasks'] == 0:
            display_text = f"{rating_data['rating']}/5 (baseline)"
        else:
            display_text = f"{rating_data['rating']:.1f}/5 (after {rating_data['num_tasks']} tasks)"
        
        return {
            'skill_id': skill_id,
            'skill_name': rating_data['skill_name'],
            'rating': rating_data['rating'],
            'num_tasks': rating_data['num_tasks'],
            'confidence': confidence,
            'display_text': display_text,
            'total_score': rating_data['total_score'],
            'confidence_constant': rating_data['confidence_constant'],
            'baseline_rating': rating_data['baseline_rating']
        }

# Global rating service instance
rating_service = RatingService(confidence_constant=20, baseline_rating=2.5) 