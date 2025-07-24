from app.database.connection import get_db_cursor

class ReviewerQualityService:
    def __init__(self, confidence_constant: int = 20, baseline_rating: float = 2.5):
        self.confidence_constant = confidence_constant
        self.baseline_rating = baseline_rating

    def calculate_bayesian_rating(self, total_score: float, num_reviews: int) -> float:
        if num_reviews == 0:
            return self.baseline_rating
        rating = (self.confidence_constant * self.baseline_rating + total_score) / (self.confidence_constant + num_reviews)
        return max(0.0, min(5.0, rating))

    def is_aligned_with_majority(self, reviewer_decision, majority_decision) -> bool:
        """
        Returns True if the reviewer's decision matches the majority decision.
        """
        if reviewer_decision is None:
            return False
        return bool(reviewer_decision) == bool(majority_decision)

    # def update_reviewer_quality_rating(self, user_id: int, aligned: bool) -> dict:
    #     """
    #     Update reviewer's quality rating based on alignment with majority decision.
    #     Args:
    #         user_id: Reviewer user ID
    #         aligned: True if review matches majority (see is_aligned_with_majority), False otherwise
    #     Returns:
    #         Dict with updated rating information
    #     """
    #     # Initialize reviewer quality if not exists
    #     with get_db_cursor(commit=True) as cursor:
    #         cursor.execute("""
    #             INSERT INTO reviewer_quality (user_id, rating, num_reviews, total_score, confidence_constant, baseline_rating)
    #             VALUES (%s, %s, 0, 0.0, %s, %s)
    #             ON CONFLICT (user_id) DO NOTHING
    #         """, (user_id, self.baseline_rating, self.confidence_constant, self.baseline_rating))
    #         # Get current rating data
    #         cursor.execute("""
    #             SELECT rating, num_reviews, total_score, confidence_constant, baseline_rating
    #             FROM reviewer_quality
    #             WHERE user_id = %s
    #         """, (user_id,))
    #         current = cursor.fetchone()
    #         if not current:
    #             raise ValueError(f"No reviewer quality rating found for user {user_id}")
    #         # Update totals
    #         new_num_reviews = current['num_reviews'] + 1
    #         review_score = 5.0 if aligned else -5.0
    #         new_total_score = current['total_score'] + review_score
    #         new_rating = self.calculate_bayesian_rating(new_total_score, new_num_reviews)
    #         # Clamp rating between 0 and 5
    #         new_rating = max(0.0, min(5.0, new_rating))
    #         # Update database
    #         cursor.execute("""
    #             UPDATE reviewer_quality
    #             SET rating = %s, num_reviews = %s, total_score = %s
    #             WHERE user_id = %s
    #         """, (new_rating, new_num_reviews, new_total_score, user_id))
    #         return {
    #             'user_id': user_id,
    #             'old_rating': current['rating'],
    #             'new_rating': new_rating,
    #             'num_reviews': new_num_reviews,
    #             'aligned': aligned,
    #             'review_score': review_score,
    #             'confidence_constant': current['confidence_constant'],
    #             'baseline_rating': current['baseline_rating']
    #         }

reviewer_quality_service = ReviewerQualityService(confidence_constant=20, baseline_rating=2.5) 