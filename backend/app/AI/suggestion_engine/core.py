import json
from pathlib import Path
from .prompts import create_template_generation_prompt, create_rewrite_prompt
from .clients import LLMClient

def _clean_json_response(text: str) -> str:
    """Helper function to remove markdown fences from a JSON string."""
    print(f"[DEBUG] Cleaning JSON response. Original length: {len(text)}")
    cleaned_text = text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
        print("[DEBUG] Removed ```json prefix")
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
        print("[DEBUG] Removed ``` suffix")
    print(f"[DEBUG] Cleaned JSON response. Final length: {len(cleaned_text)}")
    return cleaned_text.strip()

def generate_template(title: str, category: str, llm_client: LLMClient, subcategory: str | None = None, background: str | None = None) -> str:
    """ Step 1: AI-powered template generation """
    
    print(f"[INFO] Starting template generation for title: '{title}', category: '{category}'")
    print(f"[INFO] Additional parameters - subcategory: {subcategory}, background: {background is not None}")
    
    # Get the current script directory to find example files
    script_dir = Path(__file__).resolve().parent.parent
    example_filename = script_dir / "data" / f"{category.lower().replace(' ', '_')}_example.json"
    
    print(f"[INFO] Looking for example file: {example_filename}")
    
    try:
        with open(example_filename, 'r') as f:
            example_data = json.load(f)
        print(f"[INFO] Successfully loaded example data from {example_filename}")
        print(f"[DEBUG] Example data keys: {list(example_data.keys())}")
    except FileNotFoundError:
        print(f"[ERROR] Example file not found: {example_filename}")
        return f"# Error: Could not find an example for category '{category}'"
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse example file {example_filename}: {str(e)}")
        return f"# Error: Invalid JSON in example file for category '{category}'"
    except Exception as e:
        print(f"[ERROR] Unexpected error loading example file {example_filename}: {str(e)}")
        return f"# Error: Failed to load example for category '{category}': {str(e)}"

    print("[INFO] Creating template generation prompt")
    try:
        prompt = create_template_generation_prompt(
            category=category,
            high_quality_example=json.dumps(example_data, indent=2)
        )
        print(f"[DEBUG] Generated prompt length: {len(prompt)} characters")
        print(f"[DEBUG] Prompt preview: {prompt[:200]}...")
    except Exception as e:
        print(f"[ERROR] Failed to create template generation prompt: {str(e)}")
        return f"# Error: Failed to create prompt for category '{category}': {str(e)}"
    
    print("[INFO] Sending prompt to LLM client")
    try:
        headings_json_str = llm_client.get_response(prompt)
        print(f"[INFO] Received response from LLM. Length: {len(headings_json_str)} characters")
        print(f"[DEBUG] Raw LLM response: {headings_json_str}")
    except Exception as e:
        print(f"[ERROR] LLM client error: {str(e)}")
        return f"# Error: LLM client failed: {str(e)}"
    
    print("[INFO] Cleaning JSON response")
    try:
        cleaned_headings_str = _clean_json_response(headings_json_str)
        print(f"[DEBUG] Cleaned response: {cleaned_headings_str}")
    except Exception as e:
        print(f"[ERROR] Failed to clean JSON response: {str(e)}")
        return f"# Error: Failed to clean LLM response: {str(e)}"
    
    print("[INFO] Parsing JSON headings")
    try:
        headings_list = json.loads(cleaned_headings_str)
        print(f"[INFO] Successfully parsed {len(headings_list)} headings")
        print(f"[DEBUG] Headings: {headings_list}")
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse headings JSON: {str(e)}")
        print(f"[ERROR] Raw response that failed to parse: {headings_json_str}")
        return "# Error: AI failed to generate a valid list of headings."

    print("[INFO] Building final markdown template")
    try:
        # build final markdown template
        md_template = f"# {title}\n\n"
        md_template += f"**Category:** {category}\n"
        if subcategory:
            md_template += f"**Subcategory:** {subcategory}\n"
        
        md_template += f"\n## Background\n"
        md_template += f"{background if background else '(Please describe the project background and goals here.)'}\n"

        for heading in headings_list:
            md_template += f"\n## {heading}\n"
            md_template += "(Please fill in the details here.)\n\n\n"
        
        print(f"[INFO] Successfully generated template. Length: {len(md_template)} characters")
        print(f"[DEBUG] Generated template: {md_template}")
        
        return md_template
        
    except Exception as e:
        print(f"[ERROR] Failed to build markdown template: {str(e)}")
        return f"# Error: Failed to build template: {str(e)}"

def rewrite_task(user_filled_template: str, category: str, llm_client: LLMClient) -> str:
    """Step 2: AI-powered task rewriting"""
    
    print(f"[INFO] Starting task rewrite for category: '{category}'")
    print(f"[INFO] User template length: {len(user_filled_template)} characters")

    # Get the current script directory to find example files
    script_dir = Path(__file__).resolve().parent.parent
    example_filename = script_dir / "data" / f"{category.lower().replace(' ', '_')}_example.json"
    
    print(f"[INFO] Looking for example file: {example_filename}")
    
    try:
        with open(example_filename, 'r') as f:
            example_data = json.load(f)
        print(f"[INFO] Successfully loaded example data from {example_filename}")
    except FileNotFoundError:
        print(f"[ERROR] Example file not found: {example_filename}")
        return f"# Error: Could not find an example for category '{category}'"
    except Exception as e:
        print(f"[ERROR] Failed to load example file {example_filename}: {str(e)}")
        return f"# Error: Failed to load example for category '{category}': {str(e)}"

    print("[INFO] Creating rewrite prompt")
    try:
        prompt = create_rewrite_prompt(
            category=category,
            high_quality_example=json.dumps(example_data, indent=2),
            user_draft=user_filled_template
        )
        print(f"[DEBUG] Generated rewrite prompt length: {len(prompt)} characters")
    except Exception as e:
        print(f"[ERROR] Failed to create rewrite prompt: {str(e)}")
        return f"# Error: Failed to create rewrite prompt: {str(e)}"
    
    print("[INFO] Sending rewrite prompt to LLM client")
    try:
        rewritten_content = llm_client.get_response(prompt)
        print(f"[INFO] Received rewritten content. Length: {len(rewritten_content)} characters")
        print(f"[DEBUG] Rewritten content: {rewritten_content}")
        return rewritten_content
    except Exception as e:
        print(f"[ERROR] LLM client error during rewrite: {str(e)}")
        return f"# Error: LLM client failed during rewrite: {str(e)}"