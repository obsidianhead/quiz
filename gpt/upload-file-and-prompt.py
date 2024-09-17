import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve API key from environment variable
api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=api_key)

assistant_id = 'asst_ifBVA21Y6Q2h3wV2Ob3U7tPc'
file_path = 'knowledge.txt'

def upload_file_to_existing_assistant(api_key, assistant_id, file_path):

    # Initialize OpenAI client with the API key
    client = OpenAI(api_key=api_key)

    # Upload a file to OpenAI
    with open(file_path, 'rb') as file:
        uploaded_file = client.files.create(file=file, purpose='assistants')

    # Add the uploaded file to the assistant
    client.beta.assistants.files.create(assistant_id=assistant_id, file_id=uploaded_file.id)

    print(f"File '{file_path}' uploaded and added to the assistant with ID: {assistant_id}")

# Example usage
upload_file_to_existing_assistant(api_key, assistant_id, file_path)