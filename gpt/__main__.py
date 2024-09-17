import os
from typing import List
import json
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve API key from environment variable
api_key = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

# Define the response model using Pydantic for validation
class QuizResponse(BaseModel):
    question: str
    incorrect: List[str]
    correct: List[str]  # Correct answers should be a list in case of multiple correct options
    solution: str 

# Make the API request to OpenAI's chat completion endpoint
completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "system", "content": "You are an expert civil engineer, construction manager, and land surveyor based in the USA."},
        {"role": "user", "content": "As-Built surveys all that apply"},
    ],
    response_format=QuizResponse,
)

message = completion.choices[0].message

# Check if the response contains parsed content
if message.parsed:
    # Create a list of answers based on incorrect and correct answers
    answers = [{"text": answer, "correct": False} for answer in message.parsed.incorrect]
    
    # Append all correct answers, as there can be multiple
    answers.extend([{"text": answer, "correct": True} for answer in message.parsed.correct])

    # Format the final JSON output
    formatted_output = {
        "question": message.parsed.question,
        "image": None,  # No image provided, so we leave it as None
        "answers": answers,
        "solution": message.parsed.solution
    }

    # Print the output as formatted JSON
    json_output = json.dumps(formatted_output, indent=4)
    print(json_output)
else:
    print(message.refusal)
