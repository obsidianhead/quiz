import os
import json
import cmd
from typing import List
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Retrieve API key from environment variable
api_key = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

# Specify your Assistant ID
ASSISTANT_ID = "asst_ifBVA21Y6Q2h3wV2Ob3U7tPc"  # Replace with your actual Assistant ID

# Define the response model using Pydantic for validation
class QuizResponse(BaseModel):
    question: str
    incorrect: List[str]
    correct: List[str]  # Correct answers should be a list in case of multiple correct options
    solution: str 

# Function to create a new thread for each session
def create_thread():
    """Creates a new conversation thread."""
    thread = client.beta.threads.create()
    return thread.id

# Function to generate the quiz question
def generate_quiz(thread_id, question_input: str, response_type: str, difficulty: str, output_filename: str):
    """Sends a quiz question to the Assistant and saves the response to a JSON file."""
    
    # Add user message to the thread
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=f"{question_input} (Type: {response_type}, Difficulty: {difficulty})"
    )

    # Run the Assistant to process the message
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=ASSISTANT_ID
    )

    # Wait for completion
    while True:
        run_status = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
        if run_status.status == "completed":
            break  # Exit loop when processing is done

    # Retrieve messages
    messages = client.beta.threads.messages.list(thread_id=thread_id)

    # Extract response
    message = messages.data[0].content[0].text.value  # Extract response text

    # Parse response as JSON
    try:
        parsed_response = json.loads(message)
    except json.JSONDecodeError:
        print("Failed to parse Assistant's response.")
        return

    # Format the final JSON output
    new_question = {
        "question": parsed_response["question"],
        "image": None,  # No image provided
        "answers": [
            {"text": ans, "correct": False} for ans in parsed_response["incorrect"]
        ] + [
            {"text": ans, "correct": True} for ans in parsed_response["correct"]
        ],
        "solution": parsed_response["solution"],
        "importance": 1
    }

    # Save to JSON file
    save_to_json(new_question, output_filename)

    # Print output
    print(json.dumps(new_question, indent=4))

# Function to save the quiz data to a JSON file
def save_to_json(data, filename):
    """Appends new data to a JSON file."""
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = []
    else:
        existing_data = []

    # Append new data
    existing_data.append(data)

    # Write updated JSON file
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=4)

# Define a custom cmd shell class for interactive quiz generation
class QuizShell(cmd.Cmd):
    intro = 'Welcome to the quiz shell. Type help or ? to list commands.\n'
    prompt = '(quiz) '

    def preloop(self):
        """Prompt user to set output filename when starting the session."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.output_filename = f"quiz_{timestamp}.json"
        print(f"Saving responses to: {self.output_filename}")

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
        difficulty = {"1": "easy", "2": "medium", "3": "hard"}.get(difficulty_input, "medium")

        thread_id = create_thread()
        generate_quiz(thread_id, question, response_type_str, difficulty, self.output_filename)

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
