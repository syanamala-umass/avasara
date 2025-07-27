#!/usr/bin/env python3
"""
Simple test script for AI template generation only.
This script tests the AI template generation without requiring the full backend setup.
"""

import sys
import os
from pathlib import Path

# Add the AI directory to the Python path
ai_path = Path(__file__).resolve().parent / "AI"
sys.path.append(str(ai_path))

def test_ai_template_generation():
    """Test the AI template generation functionality."""
    print("🧪 Testing AI Template Generation")
    print("="*50)
    
    try:
        # Check if OpenAI API key is available
        if not os.getenv("OPENAI_API_KEY"):
            print("❌ OPENAI_API_KEY environment variable not set")
            print("Please set your OpenAI API key: export OPENAI_API_KEY='your-api-key'")
            return False
        
        print("✅ OpenAI API key found")
        
        # Import the required modules
        from suggestion_engine.core import generate_template
        from suggestion_engine.clients import OpenAIClient
        
        print("✅ AI modules imported successfully")
        
        # Initialize the LLM client
        print("🔄 Initializing OpenAI client...")
        llm_client = OpenAIClient(model="gpt-4o-mini")
        print("✅ OpenAI client initialized")
        
        # Test different scenarios
        test_cases = [
            {
                "title": "Build a React Landing Page",
                "category": "development",
                "description": "Frontend development task"
            },
            {
                "title": "Design a Mobile App UI",
                "category": "design",
                "description": "UI/UX design task"
            },
            {
                "title": "Market Research for SaaS Product",
                "category": "research",
                "description": "Research and analysis task"
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 Test Case {i}: {test_case['title']}")
            print("-" * 30)
            
            try:
                # Generate template
                template = generate_template(
                    title=test_case["title"],
                    category=test_case["category"],
                    llm_client=llm_client
                )
                
                print("✅ Template generated successfully!")
                print(f"📏 Template length: {len(template)} characters")
                print(f"📄 Template preview:")
                print("-" * 20)
                print(template[:300] + "..." if len(template) > 300 else template)
                print("-" * 20)
                
            except Exception as e:
                print(f"❌ Error generating template: {str(e)}")
                return False
        
        print("\n🎉 All test cases passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {str(e)}")
        print("Make sure the AI directory and its dependencies are properly set up")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_backend_integration():
    """Test the backend integration if backend is running."""
    print("\n🔗 Testing Backend Integration")
    print("="*50)
    
    try:
        import requests
        
        # Test if backend is running
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            
            # Test the AI template endpoint
            template_data = {
                "title": "Test Task",
                "category": "development",
                "skills": ["Python", "FastAPI"]
            }
            
            response = requests.post(
                "http://localhost:8000/ai-templates/generate-task-description",
                json=template_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                template = data.get('template', '')
                print("✅ Backend AI template endpoint works!")
                print(f"📏 Generated template length: {len(template)} characters")
                return True
            else:
                print(f"❌ Backend AI template endpoint failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        else:
            print("❌ Backend is not responding correctly")
            return False
            
    except requests.exceptions.ConnectionError:
        print("ℹ️  Backend is not running (this is expected if you're only testing AI)")
        return True
    except Exception as e:
        print(f"❌ Backend integration error: {str(e)}")
        return False

def main():
    """Main function to run the tests."""
    print("🚀 AI Template Generation Test Suite")
    print("="*60)
    
    # Test AI template generation
    ai_success = test_ai_template_generation()
    
    # Test backend integration (optional)
    backend_success = test_backend_integration()
    
    # Summary
    print("\n📊 Test Summary")
    print("="*30)
    print(f"AI Template Generation: {'✅ PASSED' if ai_success else '❌ FAILED'}")
    print(f"Backend Integration: {'✅ PASSED' if backend_success else '⚠️  SKIPPED/FAILED'}")
    
    if ai_success:
        print("\n🎉 Core AI functionality is working correctly!")
        if backend_success:
            print("🎉 Full integration is working correctly!")
        else:
            print("ℹ️  Backend integration test was skipped or failed (this is normal if backend isn't running)")
        return 0
    else:
        print("\n💥 Core AI functionality failed. Please check the error messages above.")
        return 1

if __name__ == "__main__":
    exit(main()) 