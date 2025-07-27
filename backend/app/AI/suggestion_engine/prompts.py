import json

TEMPLATE_META_GUIDANCE = """
**Your Goal:** Create a structured template for a new task.
**Your Method:** Analyze the provided High-Quality Example for the given category. Identify its key sections, as these represent the essential components for any task in that category. Your output should be a list of these section headings.
"""

REWRITE_META_GUIDANCE = """
**Your Goal:** Rewrite the user's draft into a world-class, professional document.
**Your Method:** Use the High-Quality Example as your target for quality and detail. Follow these core principles:

1.  **Inject Specificity:** Where the user is vague (e.g., "do a number of images"), invent a plausible, concrete detail (e.g., "[--*process 100 images*--]") and highlight it.
2.  **Ensure Clarity:** Rewrite confusing or lazy sentences into clear, unambiguous instructions. If the user says "fix the thing," your rewrite should specify what "the thing" is and what "fix" means, based on the context of the example.
3.  **Establish Standards:** A great task needs clear rules. If the user omits technical requirements or evaluation criteria, invent and highlight professional standards appropriate for the category (e.g., "final files must be [--*300 DPI JPEGs*--]").
"""

def create_template_generation_prompt(category: str, high_quality_example: str) -> str:
    """Step 1 Prompt: Uses universal meta-guidance."""
    prompt = f"""
    You are an expert AI assistant who provides template structures for employers, enabling them to write clear task descriptions for freelancers.
    
    {TEMPLATE_META_GUIDANCE}

    **Task Category:**
    {category}

    **High-Quality Example to Analyze:**
    ```json
    {high_quality_example}
    ```

    **Your Task:**
    Based on the principles above and the structure of the example, identify the essential section headings for this task category.
    - Exclude: "Title", "Category", "Subcategory", "Background".
    - Your response MUST be a single, clean JSON array of strings.
    """
    return prompt

def create_rewrite_prompt(category: str, high_quality_example: str, user_draft: str) -> str:
    """Step 2 Prompt: Uses universal meta-guidance."""
    prompt = f"""
    You are an expert technical writer and project manager who writes clear, specific, and unambiguous task descriptions for freelancers.

    {REWRITE_META_GUIDANCE}

    **CRITICAL RULE:** You MUST wrap any details you invent in this exact format: [--*invented detail*--].

    ---
    **Task Category:**
    {category}
    ---
    **High-Quality Example (Your target for quality):**
    ```json
    {high_quality_example}
    ```
    ---
    **User's Draft (The text you need to rewrite):**
    ```markdown
    {user_draft}
    ```
    ---
    **Your Rewritten Task Description:**
    Please respond ONLY in clear, professional Markdown format, not JSON. Do not include any code block markers or JSON formatting. Only output the improved task description as plain text or Markdown, suitable for direct human reading.
    """
    return prompt