# Test Scripts for Task Creation Flow

This document explains how to use the test scripts to verify the task creation flow with AI template generation.

## Available Test Scripts

### 1. `test_ai_template_only.py` - AI Template Generation Test
**Purpose**: Tests only the AI template generation functionality without requiring the full backend setup.

**What it tests**:
- OpenAI API key configuration
- AI module imports
- Template generation for different task categories
- Optional backend integration test

**When to use**:
- Quick verification of AI functionality
- Testing without running the full backend
- Debugging AI template generation issues

### 2. `test_task_creation_flow.py` - Complete Flow Test
**Purpose**: Tests the entire task creation flow from frontend to backend to AI generation.

**What it tests**:
- Backend health check
- User registration and authentication
- Skills fetching
- AI template generation
- Task creation with generated template
- Task retrieval and verification

**When to use**:
- End-to-end testing of the complete flow
- Integration testing
- Verification that all components work together

## Prerequisites

### 1. Environment Setup
Set your OpenAI API key:
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

### 2. Dependencies
Install required packages:
```bash
# For AI template testing only
pip install openai python-dotenv

# For complete flow testing
pip install openai python-dotenv requests
```

### 3. Backend Setup (for complete flow test)
If running the complete flow test, ensure your backend is running:
```bash
cd backend/app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Running the Tests

### Quick AI Test (Recommended First)
```bash
python test_ai_template_only.py
```

**Expected Output**:
```
🚀 AI Template Generation Test Suite
============================================================
🧪 Testing AI Template Generation
==================================================
✅ OpenAI API key found
✅ AI modules imported successfully
🔄 Initializing OpenAI client...
✅ OpenAI client initialized

📝 Test Case 1: Build a React Landing Page
------------------------------
✅ Template generated successfully!
📏 Template length: 847 characters
📄 Template preview:
--------------------
# Build a React Landing Page

**Category:** development

## Background
(Please describe the project background and goals here.)

## Objectives
(Please fill in the details here.)
...
--------------------

🎉 All test cases passed!

📊 Test Summary
------------------------------
AI Template Generation: ✅ PASSED
Backend Integration: ⚠️  SKIPPED/FAILED

🎉 Core AI functionality is working correctly!
```

### Complete Flow Test
```bash
python test_task_creation_flow.py
```

**Expected Output**:
```
🚀 Starting Task Creation Flow Test
============================================================
✅ OpenAI API key found

============================================================
STEP 1: Backend Health Check
============================================================
Description: Verify the backend is running and accessible

✅ Backend is running and accessible
Response: {'message': 'Welcome to Avasara API', 'docs_url': '/docs', 'redoc_url': '/redoc'}

============================================================
STEP 2: User Registration
============================================================
Description: Register a test user for the flow

✅ User registered successfully

============================================================
STEP 3: User Login
============================================================
Description: Login with test user to get authentication token

✅ Login successful, token obtained

============================================================
STEP 4: Fetch Skills
============================================================
Description: Get available skills for task creation

✅ Successfully fetched 15 skills
Sample skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL']

============================================================
STEP 5: AI Template Generation
============================================================
Description: Test the AI template generation endpoint

✅ Template generated successfully
Template length: 847 characters
Template preview: # Build a React Landing Page...

============================================================
STEP 6: Task Creation
============================================================
Description: Create a task using the generated template

✅ Task created successfully
Task ID: 123
Task Title: Build a React Landing Page
Task Status: open

============================================================
STEP 7: Task Retrieval
============================================================
Description: Verify the created task can be retrieved

✅ Task retrieved successfully
Task ID: 123
Task Title: Build a React Landing Page
Task Description Length: 847

============================================================
STEP 8: Test Summary
============================================================
Description: Summary of all test results

✅ All core tests completed successfully!

Flow Summary:
- Backend is accessible
- User authentication works
- Skills can be fetched
- AI template generation works
- Task creation with template works
- Task retrieval works

🎉 All tests passed! The task creation flow with AI template generation is working correctly.
```

## Troubleshooting

### Common Issues

#### 1. OpenAI API Key Not Set
**Error**: `OPENAI_API_KEY environment variable not set`

**Solution**:
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

#### 2. Backend Not Running
**Error**: `Cannot connect to backend`

**Solution**:
```bash
cd backend/app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Import Errors
**Error**: `ImportError: No module named 'suggestion_engine'`

**Solution**:
- Ensure you're running the script from the project root directory
- Check that the AI directory exists and contains the suggestion_engine module

#### 4. Template Generation Fails
**Error**: `Template generation failed: 500`

**Possible causes**:
- OpenAI API quota exceeded
- Invalid API key
- Network connectivity issues

**Solution**:
- Check OpenAI API usage and billing
- Verify API key is correct
- Check internet connectivity

### Debug Mode

To get more detailed error information, you can modify the test scripts to include debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Test Customization

### Adding New Test Cases

To add new test cases to the AI template test:

```python
test_cases = [
    # ... existing cases ...
    {
        "title": "Your Custom Task Title",
        "category": "your_category",
        "description": "Your task description"
    }
]
```

### Modifying Test Data

To test with different data, modify the test data in the scripts:

```python
# In test_task_creation_flow.py
template_data = {
    "title": "Your Custom Title",
    "category": "your_category",
    "skills": ["Your", "Custom", "Skills"]
}
```

## Performance Testing

### API Response Times

The scripts include timeout settings for API calls:
- Health check: 5 seconds
- Template generation: 30 seconds
- Task creation: 30 seconds

### Load Testing

For load testing, you can run multiple instances of the test scripts:

```bash
# Run multiple tests in parallel
python test_ai_template_only.py &
python test_ai_template_only.py &
python test_ai_template_only.py &
```

## Continuous Integration

These test scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Test AI Template Generation
  run: python test_ai_template_only.py

- name: Test Complete Flow
  run: |
    # Start backend
    cd backend/app && uvicorn main:app --host 0.0.0.0 --port 8000 &
    # Wait for backend to start
    sleep 10
    # Run test
    python test_task_creation_flow.py
```

## Support

If you encounter issues with the test scripts:

1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check the error messages for specific issues
4. Ensure the backend is running (for complete flow test)
5. Verify the OpenAI API key is valid and has sufficient quota 