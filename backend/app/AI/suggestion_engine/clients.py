import openai

from abc import ABC, abstractmethod
# from transformers.pipelines import pipeline

class LLMClient(ABC):
    """ For generic language model client."""
    @abstractmethod
    def get_response(self, prompt: str) -> str:
        """Takes a prompt and returns the model's text completion."""
        pass

class LocalTransformerClient(LLMClient):
    """ Client that uses a local Hugging Face transformer model."""
    def __init__(self, model_name: str = 'google/flan-t5-small'):
        print(f"Initializing local model '{model_name}'...")
        try:
            self.generator = pipeline('text2text-generation', model=model_name)
            print("Model initialized successfully.")
        except Exception as e:
            print(f"\n Error initializing model. Ensure internet and 'torch' installed.")
            raise e

    def get_response(self, prompt: str) -> str:
        raw_output = self.generator(prompt, max_length=512)
        return raw_output[0]['generated_text']

class OpenAIClient(LLMClient):
    """ Client that uses OpenAI API."""
    def __init__(self, model: str = "gpt-4o-mini"):
        print(f"Initializing OpenAI client for model '{model}'...")
        try:
            self.client = openai.OpenAI()
            self.model = model
            print("OpenAI client initialized successfully.")
        except openai.OpenAIError as e:
            print(f"\nError initializing OpenAI client. Ensure API key is set correctly in env/.env")
            raise e


    def get_response(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content or ""
        except openai.APIError as e:
            print(f"An error occurred with the OpenAI API: {e}")
            return '{"error": "OpenAI API call failed."}'