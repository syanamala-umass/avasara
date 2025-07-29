import json

from pathlib import Path
from dotenv import load_dotenv
from suggestion_engine.core import generate_template
from suggestion_engine.clients import OpenAIClient

def run_step1():
    """
    Executes the template generation step.
    - Reads initial user input.
    - Generates a markdown template.
    - Saves the template to a file.
    """

    llm_client = OpenAIClient(model="gpt-4o-mini") # can use LocalTransformerClient() for SLM...

    SCRIPT_DIR = Path(__file__).resolve().parent
    INPUT_FILE = SCRIPT_DIR / "data" / "step1_user_input.json"
    OUTPUT_FILE = SCRIPT_DIR / "step1_template.txt"

    with open(INPUT_FILE, 'r') as f:
        step1_input = json.load(f)

    markdown_template = generate_template(llm_client=llm_client, **step1_input)
    
    with open(OUTPUT_FILE, "w") as f:
        f.write(markdown_template)

    print(f"Step 1 complete: Template saved to '{OUTPUT_FILE}'")

if __name__ == "__main__":
    load_dotenv(dotenv_path=Path(__file__).resolve().parent / 'env' / '.env')
    run_step1()