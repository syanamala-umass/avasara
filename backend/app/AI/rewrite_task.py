import json

from pathlib import Path
from dotenv import load_dotenv
from suggestion_engine.core import rewrite_task
from suggestion_engine.clients import OpenAIClient

def parse_category_from_text(file_content: str) -> str | None:
    """
    Parses the category from the markdown text.
    Looks for a line like '**Category:** Annotation'.
    """
    for line in file_content.splitlines():
        if line.strip().lower().startswith("**category:**"):
            try:
                category = line.split(":", 1)[1].strip()
                if category:
                    return category
            except IndexError:
                continue
    return None

def run_step2():
    """
    Executes the AI rewrite step with improved decoupling.
    It first tries to parse the category from the draft text itself
    and only uses the original step 1 input as a fallback.
    """

    llm_client = OpenAIClient(model="gpt-4o-mini") # or LocalTransformerCLient()...

    SCRIPT_DIR = Path(__file__).resolve().parent
    STEP2_INPUT_FILE = SCRIPT_DIR / "data" / "step2_user_input.txt"
    STEP1_FALLBACK_FILE = SCRIPT_DIR / "data" / "step1_user_input.json"
    OUTPUT_FILE = SCRIPT_DIR / "step2_rewritten_task.txt"
    
    try:
        with open(STEP2_INPUT_FILE, 'r') as f:
            user_filled_content = f.read()
    except FileNotFoundError:
        print(f"Error: '{STEP2_INPUT_FILE}' not found. Cannot proceed.")
        return

    print("Attempting to parse 'Category' from draft text...")
    category = parse_category_from_text(user_filled_content)

    if category:
        print(f"Category '{category}' found in draft text.")
    else:
        print("Warning: Could not parse category from text. Attempting to load step1 input...")
        print(f"   -> Loading '{STEP1_FALLBACK_FILE}'...")
        try:
            with open(STEP1_FALLBACK_FILE, 'r') as f:
                step1_input = json.load(f)
            category = step1_input.get("category")
            if category:
                print(f"Category '{category}' found in fallback file.")
        except FileNotFoundError:
            print(f"Error: Fallback file '{STEP1_FALLBACK_FILE}' not found.")
            category = None

    if not category:
        print("Error: Could not determine the task category from any source. Cannot proceed.")
        return

    print("\nRewriting draft ...")
    
    rewritten_task = rewrite_task(
        user_filled_template=user_filled_content,
        category=category,
        llm_client=llm_client
    )

    with open(OUTPUT_FILE, "w") as f:
        f.write(rewritten_task)
    
if __name__ == "__main__":
    load_dotenv(dotenv_path='env/.env')
    run_step2()
