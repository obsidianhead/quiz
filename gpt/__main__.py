import os
from typing import List
import json
import rich
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve API key from environment variable
api_key = os.getenv('OPENAI_API_KEY')

client = OpenAI(
    # This is the default and can be omitted
    api_key=api_key
)

client = OpenAI()

class QuizResponse(BaseModel):
    question: str
    incorrect: List[str]
    correct: str
    solution: str 

completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "system", "content": "You are a civil engineer"},
        {"role": "user", "content": "easements"},
    ],
    response_format=QuizResponse,
)

message = completion.choices[0].message

if message.parsed:
    # Create a list of answers based on incorrect and correct answers
    answers = [{"text": answer, "correct": False} for answer in message.parsed.incorrect]
    answers.append({"text": message.parsed.correct, "correct": True})

    # Format the final JSON output
    formatted_output = {
        "question": message.parsed.question,
        "image": None,  # No image provided, so we leave it as None
        "answers": answers,
        "solution": message.parsed.solution
    }

    # Print the output as JSON
    json_output = json.dumps(formatted_output, indent=4)
    print(json_output)
else:
    print(message.refusal)
