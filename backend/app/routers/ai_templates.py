from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
import sys
import os
import json
from pathlib import Path
from dotenv import load_dotenv
import re

# Add the AI directory to the Python path
ai_path = Path(__file__).resolve().parent.parent.parent.parent / "AI"
sys.path.append(str(ai_path))

print(f"[INFO] Added AI directory to Python path: {ai_path}")

# Load environment variables
load_dotenv()
# Also load AI environment file
ai_env_path = Path(__file__).resolve().parent.parent.parent.parent / "AI" / "env" / ".env"
if ai_env_path.exists():
    load_dotenv(ai_env_path)
    print(f"[INFO] Loaded AI environment from: {ai_env_path}")
else:
    print(f"[WARNING] AI environment file not found at: {ai_env_path}")
print("[INFO] Loaded environment variables")

try:
    from suggestion_engine.core import generate_template, rewrite_task
    from suggestion_engine.clients import OpenAIClient
    print("[INFO] Successfully imported AI modules")
except ImportError as e:
    print(f"[ERROR] Failed to import AI modules: {str(e)}")
    raise

from app.dependencies import get_current_user

router = APIRouter(
    prefix="/ai-templates",
    tags=["ai-templates"],
    responses={404: {"description": "Not found"}},
)

class TaskTemplateRequest(BaseModel):
    title: str
    category: str
    skills: List[str]
    subcategory: str = None
    background: str = None

class TaskRewriteRequest(BaseModel):
    description: str
    category: str

def strip_code_block_markers(content: str) -> str:
    """
    Remove triple backtick code block markers (with or without 'json') from the content.
    """
    return re.sub(r"^```(?:json)?\\s*|\\s*```$", "", content.strip(), flags=re.MULTILINE)

def convert_json_to_markdown(json_content: str) -> str:
    """
    Convert JSON response from LLM to human-readable markdown format.
    
    Args:
        json_content (str): JSON string from LLM response
        
    Returns:
        str: Human-readable markdown format
    """
    print(f"[DEBUG] convert_json_to_markdown called with content length: {len(json_content)}")
    print(f"[DEBUG] Input content preview: {json_content[:200]}...")
    
    try:
        # Strip code block markers if present
        cleaned_content = strip_code_block_markers(json_content)
        # Try to parse the JSON
        print("[DEBUG] Attempting to parse JSON...")
        data = json.loads(cleaned_content)
        print(f"[DEBUG] JSON parsed successfully. Data type: {type(data)}")
        print(f"[DEBUG] Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        # Build markdown content
        markdown = ""
        
        # Define special handling for specific keys
        special_keys = {
            "Title": "h1",  # Main title with #
            "Brief Description": "bold",  # Bold text
            "Category": "inline",  # Inline with other metadata
            "Subcategory": "inline",  # Inline with other metadata
            "Background": "h2",  # Section heading with ##
            "Objectives": "numbered_list",  # Numbered list
            "Step-by-Step Instructions": "steps",  # Special step formatting
            "Technical Requirements": "dict_section",  # Dictionary section
            "Evaluation Criteria": "dict_section",  # Dictionary section
        }
        
        print(f"[DEBUG] Special keys defined: {list(special_keys.keys())}")
        
        # Handle inline metadata first (Category, Subcategory)
        inline_metadata = []
        for key in ["Category", "Subcategory"]:
            if key in data:
                inline_metadata.append(f"**{key}:** {data[key]}")
                print(f"[DEBUG] Added inline metadata for {key}: {data[key]}")
        
        print(f"[DEBUG] Inline metadata collected: {inline_metadata}")
        
        # Process all keys dynamically
        print("[DEBUG] Processing all keys in data...")
        for key, value in data.items():
            print(f"[DEBUG] Processing key: '{key}', value type: {type(value)}")
            
            if key in special_keys:
                handling = special_keys[key]
                print(f"[DEBUG] Key '{key}' has special handling: {handling}")
                
                if handling == "h1":
                    # Main title
                    markdown += f"# {value}\n\n"
                    print(f"[DEBUG] Added H1 title: {value}")
                
                elif handling == "bold":
                    # Bold description
                    markdown += f"**{key}:** {value}\n\n"
                    print(f"[DEBUG] Added bold description for {key}")
                
                elif handling == "inline":
                    # Skip - handled separately
                    print(f"[DEBUG] Skipping inline key: {key}")
                    continue
                
                elif handling == "h2":
                    # Section heading
                    markdown += f"## {key}\n\n{value}\n\n"
                    print(f"[DEBUG] Added H2 section: {key}")
                
                elif handling == "numbered_list":
                    # Numbered list
                    if isinstance(value, list):
                        markdown += f"## {key}\n\n"
                        for i, item in enumerate(value, 1):
                            markdown += f"{i}. {item}\n"
                        markdown += "\n"
                        print(f"[DEBUG] Added numbered list for {key} with {len(value)} items")
                    else:
                        print(f"[DEBUG] Warning: {key} expected list but got {type(value)}")
                
                elif handling == "steps":
                    # Step-by-step instructions
                    if isinstance(value, list):
                        markdown += f"## {key}\n\n"
                        for step in value:
                            if isinstance(step, dict) and "stepNumber" in step and "instruction" in step:
                                markdown += f"### Step {step['stepNumber']}\n\n{step['instruction']}\n\n"
                            elif isinstance(step, str):
                                markdown += f"- {step}\n"
                        markdown += "\n"
                        print(f"[DEBUG] Added steps for {key} with {len(value)} steps")
                    else:
                        print(f"[DEBUG] Warning: {key} expected list but got {type(value)}")
                
                elif handling == "dict_section":
                    # Dictionary section (Technical Requirements, Evaluation Criteria)
                    if isinstance(value, dict):
                        markdown += f"## {key}\n\n"
                        for sub_key, sub_value in value.items():
                            if isinstance(sub_value, list):
                                markdown += f"### {sub_key}\n\n"
                                for item in sub_value:
                                    markdown += f"- {item}\n"
                                markdown += "\n"
                            else:
                                markdown += f"**{sub_key}:** {sub_value}\n\n"
                        print(f"[DEBUG] Added dict section for {key} with {len(value)} sub-items")
                    else:
                        print(f"[DEBUG] Warning: {key} expected dict but got {type(value)}")
            else:
                # Handle unknown keys dynamically
                print(f"[DEBUG] Key '{key}' not in special keys, handling dynamically")
                if isinstance(value, str):
                    # Simple string - treat as section
                    markdown += f"## {key}\n\n{value}\n\n"
                    print(f"[DEBUG] Added dynamic string section: {key}")
                elif isinstance(value, list):
                    # List - treat as bullet points
                    markdown += f"## {key}\n\n"
                    for item in value:
                        markdown += f"- {item}\n"
                    markdown += "\n"
                    print(f"[DEBUG] Added dynamic list section: {key} with {len(value)} items")
                elif isinstance(value, dict):
                    # Dictionary - treat as subsection
                    markdown += f"## {key}\n\n"
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, list):
                            markdown += f"### {sub_key}\n\n"
                            for item in sub_value:
                                markdown += f"- {item}\n"
                            markdown += "\n"
                        else:
                            markdown += f"**{sub_key}:** {sub_value}\n\n"
                    print(f"[DEBUG] Added dynamic dict section: {key} with {len(value)} sub-items")
        
        print(f"[DEBUG] Markdown built. Current length: {len(markdown)} characters")
        
        # Add inline metadata after title if we have any
        if inline_metadata:
            print(f"[DEBUG] Processing inline metadata: {inline_metadata}")
            # Find the position after the title
            lines = markdown.split('\n')
            title_index = -1
            for i, line in enumerate(lines):
                if line.startswith('# '):
                    title_index = i
                    break
            
            print(f"[DEBUG] Found title at line index: {title_index}")
            
            if title_index >= 0:
                # Insert metadata after title
                metadata_text = '\n'.join(inline_metadata) + '\n\n'
                lines.insert(title_index + 2, metadata_text)
                markdown = '\n'.join(lines)
                print(f"[DEBUG] Inserted metadata after title")
            else:
                print(f"[DEBUG] Warning: No title found to insert metadata after")
        else:
            print(f"[DEBUG] No inline metadata to process")
        
        final_markdown = markdown.strip()
        print(f"[DEBUG] Final markdown length: {len(final_markdown)} characters")
        print(f"[DEBUG] Final markdown preview: {final_markdown[:200]}...")
        
        return final_markdown
        
    except json.JSONDecodeError as e:
        # If it's not valid JSON, return as-is (might already be markdown)
        print(f"[WARNING] Could not parse JSON: {str(e)}")
        print(f"[WARNING] Returning content as-is (might already be markdown)")
        print(f"[DEBUG] Content that failed to parse: {json_content[:500]}...")
        return strip_code_block_markers(json_content)
    except Exception as e:
        print(f"[ERROR] Error converting JSON to markdown: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        import traceback
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        return json_content

@router.post("/generate-task-description")
def generate_task_description_template(
    request: TaskTemplateRequest,
    current_user = Depends(get_current_user)
):
    """
    Generate a task description template based on step 1 inputs.
    
    This endpoint takes the task title, category, and required skills from step 1
    and generates a markdown template for the task description that will be shown
    in step 2 of the task creation flow.
    
    Args:
        request (TaskTemplateRequest): Contains title, category, skills, and optional fields
        current_user (User): Currently authenticated user
        
    Returns:
        dict: Contains the generated markdown template
        
    Raises:
        HTTPException: If template generation fails
    """
    print("=== AI Template Generation Request ===")
    print(f"[INFO] User ID: {current_user.id}")
    print(f"[INFO] Request data: title='{request.title}', category='{request.category}'")
    print(f"[INFO] Skills: {request.skills}")
    print(f"[INFO] Subcategory: {request.subcategory}")
    print(f"[INFO] Background provided: {request.background is not None}")
    
    try:
        # Initialize the LLM client
        print("[INFO] Initializing OpenAI client...")
        try:
            llm_client = OpenAIClient(model="gpt-4o-mini")
            print("[INFO] OpenAI client initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize OpenAI client: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize AI client: {str(e)}"
            )
        
        # Generate the template using the existing function
        print("[INFO] Starting template generation...")
        try:
            template = generate_template(
                title=request.title,
                category=request.category,
                llm_client=llm_client,
                subcategory=request.subcategory,
                background=request.background
            )
            print(f"[INFO] Template generation completed. Template length: {len(template)} characters")
            print(f"[DEBUG] Generated template: {template}")
            
        except Exception as e:
            print(f"[ERROR] Template generation failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Template generation failed: {str(e)}"
            )
        
        # Check if template generation returned an error
        if template.startswith("# Error:"):
            print(f"[ERROR] Template generation returned error: {template}")
            raise HTTPException(
                status_code=500,
                detail=template
            )
        
        # Convert JSON to markdown if needed
        print("[INFO] Converting response to markdown format...")
        markdown_template = convert_json_to_markdown(template)
        print(f"[INFO] Markdown conversion completed. Final length: {len(markdown_template)} characters")
        
        print("=== AI Template Generation Success ===")
        return {
            "template": markdown_template,
            "success": True
        }
        
    except HTTPException:
        print("[ERROR] HTTPException raised during template generation")
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error during template generation: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        import traceback
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate template: {str(e)}"
        )

@router.post("/rewrite-task-description")
def rewrite_task_description(
    request: TaskRewriteRequest,
    current_user = Depends(get_current_user)
):
    """
    Rewrite and improve a task description using AI.
    
    This endpoint takes an existing task description and category, then uses AI
    to rewrite it for better clarity, structure, and completeness.
    
    Args:
        request (TaskRewriteRequest): Contains description and category
        current_user (User): Currently authenticated user
        
    Returns:
        dict: Contains the rewritten description
        
    Raises:
        HTTPException: If rewrite fails
    """
    print("=== AI Task Rewrite Request ===")
    print(f"[INFO] User ID: {current_user.id}")
    print(f"[INFO] Category: {request.category}")
    print(f"[INFO] Original description length: {len(request.description)} characters")
    
    try:
        # Initialize the LLM client
        print("[INFO] Initializing OpenAI client for rewrite...")
        try:
            llm_client = OpenAIClient(model="gpt-4o-mini")
            print("[INFO] OpenAI client initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize OpenAI client: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize AI client: {str(e)}"
            )
        
        # Rewrite the task description using the existing function
        print("[INFO] Starting task rewrite...")
        try:
            rewritten_description = rewrite_task(
                user_filled_template=request.description,
                category=request.category,
                llm_client=llm_client
            )
            print(f"[INFO] Task rewrite completed. New length: {len(rewritten_description)} characters")
            print(f"[DEBUG] Rewritten description: {rewritten_description}")
            
        except Exception as e:
            print(f"[ERROR] Task rewrite failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Task rewrite failed: {str(e)}"
            )
        
        # Check if rewrite returned an error
        if rewritten_description.startswith("# Error:"):
            print(f"[ERROR] Task rewrite returned error: {rewritten_description}")
            raise HTTPException(
                status_code=500,
                detail=rewritten_description
            )
        
        # Convert JSON to markdown if needed
        print("[INFO] Converting rewrite response to markdown format...")
        markdown_description = convert_json_to_markdown(rewritten_description)
        print(f"[INFO] Markdown conversion completed. Final length: {len(markdown_description)} characters")
        
        print("=== AI Task Rewrite Success ===")
        return {
            "rewritten_description": markdown_description,
            "success": True
        }
        
    except HTTPException:
        print("[ERROR] HTTPException raised during task rewrite")
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error during task rewrite: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        import traceback
        print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to rewrite task: {str(e)}"
        ) 