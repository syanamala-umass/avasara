# Task Description GenAI Assistant

## Setup and Usage

### 1. Environment Setup

For Python virtual environment:

1.  **Create a virtual environment** in the project root:
    ```bash
    python3 -m venv venv
    ```

2.  **Activate the environment**:
    ```bash
    # On macOS/Linux
    source venv/bin/activate
    
    # On Windows
    # venv\Scripts\activate
    ```

3.  **Install required packages**:
    ```bash
    pip install -r requirements.txt
    ```

### 3. API Key (Optional)

You only need to set up an API key if you plan to use the `OpenAIClient`.

1.  Create a directory named `env` in the project root.
2.  Inside `env/`, create a file named `.env`.
3.  Add your OpenAI API key to the `.env` file:
    ```
    OPENAI_API_KEY=your_actual_openai_api_key_here
    ```

### 4. Running the Workflow

The process is divided into two distinct steps.

#### **Step 1: Generate the Task Template**

This script reads the initial user input (sample file at `data/step1_user_input.json`) and creates a template for the user to fill out.

```bash
python run_step1_template_generation.py
```
**Output**: New file named `step1_template.txt`

#### **Step 2: Rewrite the User's Draft**

This script reads the user's draft (sample file at `data/step2_user_input.txt`) and rewrites it for clarity 

```bash
python run_step2_rewrite_task.py
```
**Output**: New file named `step2_rewritten_task.txt`

