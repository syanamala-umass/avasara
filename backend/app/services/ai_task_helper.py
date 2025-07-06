import openai
import os
from typing import Dict, Any, List, Optional
from app.schemas.task import AITaskSuggestion, TaskRequirements
import logging

logger = logging.getLogger(__name__)

class AITaskHelper:
    def __init__(self):
        # Initialize OpenAI client (you'll need to set OPENAI_API_KEY in environment)
        self.client = None
        if os.getenv("OPENAI_API_KEY"):
            try:
                openai.api_key = os.getenv("OPENAI_API_KEY")
                self.client = openai
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
    
    def get_task_suggestions(self, title: str, description: str, category: str = "task") -> AITaskSuggestion:
        """
        Get AI suggestions for task creation
        """
        if not self.client:
            return self._get_fallback_suggestions(title, description, category)
        
        try:
            prompt = f"""
            Analyze this task and provide suggestions for improvement:
            
            Title: {title}
            Description: {description}
            Category: {category}
            
            Please provide suggestions for:
            1. Enhanced title (if needed)
            2. Improved description
            3. Suggested skills (comma-separated)
            4. Estimated time in hours
            5. Difficulty level (beginner/intermediate/advanced)
            6. Recommended compensation range
            7. Key requirements (comma-separated)
            8. Expected deliverables (comma-separated)
            
            Format your response as JSON with these keys:
            title_suggestion, description_enhancement, suggested_skills, estimated_time, 
            difficulty_assessment, compensation_recommendation, requirements_suggestions, deliverables_suggestions
            """
            
            response = self.client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            # Parse the response (this is a simplified version)
            content = response.choices[0].message.content
            
            # For now, return structured suggestions
            return AITaskSuggestion(
                title_suggestion=self._extract_title_suggestion(content),
                description_enhancement=self._extract_description_enhancement(content),
                suggested_skills=self._extract_skills(content),
                estimated_time=self._extract_time_estimate(content),
                difficulty_assessment=self._extract_difficulty(content),
                compensation_recommendation=self._extract_compensation(content),
                requirements_suggestions=self._extract_requirements(content),
                deliverables_suggestions=self._extract_deliverables(content)
            )
            
        except Exception as e:
            logger.error(f"Error getting AI suggestions: {e}")
            return self._get_fallback_suggestions(title, description, category)
    
    def generate_requirements(self, title: str, description: str) -> TaskRequirements:
        """
        Generate detailed requirements and deliverables for a task
        """
        if not self.client:
            return self._get_fallback_requirements(title, description)
        
        try:
            prompt = f"""
            Generate detailed requirements and deliverables for this task:
            
            Title: {title}
            Description: {description}
            
            Please provide:
            1. List of specific requirements (as bullet points)
            2. List of expected deliverables (as bullet points)
            3. Estimated time in hours
            4. Difficulty level (beginner/intermediate/advanced)
            5. Priority level (low/medium/high/urgent)
            
            Format as JSON with keys: requirements, deliverables, time_estimate_hours, difficulty_level, priority_level
            """
            
            response = self.client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            return TaskRequirements(
                requirements=self._extract_requirements(content),
                deliverables=self._extract_deliverables(content),
                time_estimate_hours=self._extract_time_estimate_hours(content),
                difficulty_level=self._extract_difficulty_level(content),
                priority_level=self._extract_priority_level(content)
            )
            
        except Exception as e:
            logger.error(f"Error generating requirements: {e}")
            return self._get_fallback_requirements(title, description)
    
    def _get_fallback_suggestions(self, title: str, description: str, category: str) -> AITaskSuggestion:
        """Fallback suggestions when AI is not available"""
        return AITaskSuggestion(
            title_suggestion=title if len(title) > 10 else f"{title} - Detailed Task",
            description_enhancement=description if len(description) > 50 else f"{description}\n\nPlease provide more details about the specific requirements and expected outcomes.",
            suggested_skills=["General Skills"],
            estimated_time="2-4 hours",
            difficulty_assessment="intermediate",
            compensation_recommendation={"min": 50, "max": 200, "currency": "USD"},
            requirements_suggestions=["Clear understanding of requirements", "Quality deliverables"],
            deliverables_suggestions=["Completed task", "Documentation"]
        )
    
    def _get_fallback_requirements(self, title: str, description: str) -> TaskRequirements:
        """Fallback requirements when AI is not available"""
        return TaskRequirements(
            requirements=[
                "Understand the task requirements clearly",
                "Follow quality guidelines",
                "Meet the specified deadline",
                "Provide clear documentation"
            ],
            deliverables=[
                "Completed task output",
                "Documentation of work done",
                "Any additional files or resources"
            ],
            time_estimate_hours=4,
            difficulty_level="intermediate",
            priority_level="medium"
        )
    
    # Helper methods to extract information from AI responses
    def _extract_title_suggestion(self, content: str) -> Optional[str]:
        # Simple extraction logic
        if "title_suggestion" in content.lower():
            # Extract the title suggestion
            return "Enhanced Task Title"
        return None
    
    def _extract_description_enhancement(self, content: str) -> Optional[str]:
        if "description_enhancement" in content.lower():
            return "Enhanced description with more details"
        return None
    
    def _extract_skills(self, content: str) -> List[str]:
        if "suggested_skills" in content.lower():
            return ["Skill 1", "Skill 2", "Skill 3"]
        return []
    
    def _extract_time_estimate(self, content: str) -> Optional[str]:
        if "estimated_time" in content.lower():
            return "2-4 hours"
        return None
    
    def _extract_difficulty(self, content: str) -> Optional[str]:
        if "difficulty_assessment" in content.lower():
            return "intermediate"
        return None
    
    def _extract_compensation(self, content: str) -> Optional[Dict[str, Any]]:
        if "compensation_recommendation" in content.lower():
            return {"min": 50, "max": 200, "currency": "USD"}
        return None
    
    def _extract_requirements(self, content: str) -> List[str]:
        if "requirements" in content.lower():
            return ["Requirement 1", "Requirement 2"]
        return []
    
    def _extract_deliverables(self, content: str) -> List[str]:
        if "deliverables" in content.lower():
            return ["Deliverable 1", "Deliverable 2"]
        return []
    
    def _extract_time_estimate_hours(self, content: str) -> int:
        if "time_estimate_hours" in content.lower():
            return 4
        return 2
    
    def _extract_difficulty_level(self, content: str) -> str:
        if "difficulty_level" in content.lower():
            return "intermediate"
        return "beginner"
    
    def _extract_priority_level(self, content: str) -> str:
        if "priority_level" in content.lower():
            return "medium"
        return "low" 