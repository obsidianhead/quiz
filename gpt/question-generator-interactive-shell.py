import os
import json
import cmd
from typing import List
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

# Function to generate the quiz question and append to questions.json
def generate_quiz(question_input: str, response_type: str, difficulty: str):
    # Make the API request to OpenAI's chat completion endpoint
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": "You are an expert civil engineer, construction manager, and land surveyor based in the USA. Where appliable modify question test to include laTex using << >> for inline and [[ ]] for block."},
            {"role": "user", "content": f"{question_input} ({response_type}, difficulty: {difficulty})"}
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
        new_question = {
            "question": message.parsed.question,
            "image": None,  # No image provided, so we leave it as None
            "answers": answers,
            "solution": message.parsed.solution,
            "importance": 1
        }

        # Append to questions.json
        append_to_json(new_question)

        # Print the output as formatted JSON
        json_output = json.dumps(new_question, indent=4)
        print(json_output)
    else:
        print(message.refusal)

# Function to append a new question to questions.json
def append_to_json(new_question):
    filename = "questions.json"
    
    # Load existing questions from the JSON file
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []
    else:
        data = []

    # Append new question to the list
    data.append(new_question)

    # Write updated questions list back to the JSON file
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

# Define a custom cmd shell class for the quiz generator
class QuizShell(cmd.Cmd):
    intro = 'Welcome to the quiz shell. Type help or ? to list commands.\n'
    prompt = '(quiz) '

    def do_ask(self, question):
        """Ask a quiz question: ask 'What is an As-Built survey?'"""
        response_type = input("Select response type (1: Select one, 2: Select many): ")
        if response_type == '1':
            response_type_str = "select one"
        elif response_type == '2':
            response_type_str = "select many"
        else:
            print("Invalid selection")
            return

        difficulty_input = input("Select difficulty (1: Easy, 2: Medium, 3: Hard): ")
        if difficulty_input == '1':
            difficulty = "easy"
        elif difficulty_input == '2':
            difficulty = "medium"
        elif difficulty_input == '3':
            difficulty = "hard"
        else:
            print("Invalid difficulty selection. Defaulting to 'medium'.")
            difficulty = "medium"

        generate_quiz(question, response_type_str, difficulty)

    def do_exit(self, arg):
        """Exit the shell."""
        print("Exiting the quiz shell.")
        return True

    def do_help(self, arg):
        """Show available commands."""
        print("\nAvailable commands:")
        print("  ask <question>  - Ask a quiz question")
        print("  exit            - Exit the shell")
        print("  help            - Show this help message\n")

if __name__ == '__main__':
    QuizShell().cmdloop()
