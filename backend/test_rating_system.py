#!/usr/bin/env python3
"""
Test script for the Bayesian rating system.
This script demonstrates how the rating system works with task completion.
"""

from app.services.rating_service import RatingService

def test_rating_system():
    """Test the Bayesian rating system with task completion scenarios."""
    
    print("=== Bayesian Rating System Test ===\n")
    print("This system updates ratings when tasks are completed (fixed 5.0 score per task)\n")
    
    # Test with different confidence constants
    confidence_constants = [10, 20, 50]
    
    for C in confidence_constants:
        print(f"Testing with confidence constant C = {C}")
        print("-" * 40)
        
        # Create rating service with this confidence constant
        rating_service = RatingService(confidence_constant=C, baseline_rating=2.5)
        
        # Simulate a user's task completion history
        completed_tasks = 8  # User completed 8 tasks
        
        print(f"Baseline rating: {rating_service.baseline_rating}")
        print(f"Completed tasks: {completed_tasks}")
        print()
        
        # Calculate rating progression
        total_score = 0
        num_tasks = 0
        
        for i in range(completed_tasks):
            task_score = 5.0  # Fixed score for completed tasks
            total_score += task_score
            num_tasks += 1
            
            rating = rating_service.calculate_bayesian_rating(total_score, num_tasks)
            
            print(f"Task {i+1}: Completed (score: {task_score}) → Rating: {rating:.2f}/5.0")
        
        print(f"\nFinal rating after {num_tasks} completed tasks: {rating:.2f}/5.0")
        print(f"Total score: {total_score}, Tasks: {num_tasks}")
        print()
        
        # Show how many more tasks needed to reach extremes
        print("Tasks needed to reach rating extremes:")
        
        # Calculate tasks needed to reach 4.5+ rating
        tasks_for_high = 0
        temp_score = total_score
        temp_tasks = num_tasks
        
        while True:
            temp_score += 5.0
            temp_tasks += 1
            temp_rating = rating_service.calculate_bayesian_rating(temp_score, temp_tasks)
            tasks_for_high += 1
            
            if temp_rating >= 4.5:
                break
            if tasks_for_high > 50:  # Prevent infinite loop
                break
        
        # Calculate tasks needed to reach 0.5- rating (if all future tasks were somehow rejected)
        tasks_for_low = 0
        temp_score = total_score
        temp_tasks = num_tasks
        
        while True:
            temp_score += 0.0  # Rejected task
            temp_tasks += 1
            temp_rating = rating_service.calculate_bayesian_rating(temp_score, temp_tasks)
            tasks_for_low += 1
            
            if temp_rating <= 0.5:
                break
            if tasks_for_low > 50:  # Prevent infinite loop
                break
        
        print(f"  To reach 4.5+ rating: {tasks_for_high} more completed tasks")
        print(f"  To reach 0.5- rating: {tasks_for_low} more rejected tasks (unlikely scenario)")
        print("\n" + "="*50 + "\n")

def test_rating_formula():
    """Test the rating formula with examples."""
    
    print("=== Rating Formula Examples ===\n")
    
    # Example with C=20, baseline=2.5
    C = 20
    baseline = 2.5
    
    print(f"Formula: rating = (C * baseline + total_score) / (C + num_tasks)")
    print(f"Where C = {C}, baseline = {baseline}")
    print()
    
    # Example calculations
    scenarios = [
        (0, 0, "New user, no tasks"),
        (5, 1, "1 completed task"),
        (10, 2, "2 completed tasks"),
        (25, 5, "5 completed tasks"),
        (50, 10, "10 completed tasks"),
        (100, 20, "20 completed tasks"),
    ]
    
    for total_score, num_tasks, description in scenarios:
        if num_tasks == 0:
            rating = baseline
        else:
            rating = (C * baseline + total_score) / (C + num_tasks)
            rating = max(0.0, min(5.0, rating))
        
        print(f"{description}:")
        print(f"  Total score: {total_score}, Tasks: {num_tasks}")
        print(f"  Rating: {rating:.2f}/5.0")
        print()

if __name__ == "__main__":
    test_rating_system()
    test_rating_formula() 