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

# Function to generate the quiz questions based on a topic and count
def generate_quiz_from_topic_and_count(topic: str, num_questions: int, output_filename: str):
    """Generates quiz questions based on a specific topic and number of questions."""
    
    # Step 1: Create a thread for the assistant to generate questions
    thread_id = create_thread()
    prompt = f"Generate {num_questions} multiple-choice quiz questions about the topic: '{topic}'. For each question, include 1 correct answer and 3 plausible incorrect answers."
    
    # Step 2: Send the prompt to the assistant to generate questions
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=prompt
    )

    # Step 3: Run the assistant to process the content and generate quiz questions
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=ASSISTANT_ID
    )

    # Wait for the assistant to complete processing
    while True:
        run_status = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
        if run_status.status == "completed":
            break  # Exit loop when processing is done

    # Step 4: Retrieve assistant’s response
    messages = client.beta.threads.messages.list(thread_id=thread_id)
    message = messages.data[0].content[0].text.value  # Extract the generated question text
    
    # Step 5: Print the assistant's raw response for debugging
    print("Assistant's Raw Response:")
    print(message)  # Print the response to see its structure

    # Step 6: Parse the assistant's response and format the quiz questions
    try:
        parsed_response = json.loads(message)
    except json.JSONDecodeError:
        print("Failed to parse Assistant's response.")
        return

    # Step 7: Handle response for single question or list of questions
    questions = parsed_response if isinstance(parsed_response, list) else [parsed_response]
    
    # Step 8: Process the questions
    for question in questions:
        new_question = {
            "question": question["question"],
            "image": None,  # If you want to include images, handle that here
            "answers": [
                {"text": ans["text"], "correct": ans["correct"]} for ans in question["answers"]
            ],
            "solution": question["solution"],
            "importance": question.get("importance", 1)  # Default to 1 if no importance provided
        }

        # Step 9: Save the generated question to a JSON file
        save_to_json(new_question, output_filename)

        # Step 10: Print the generated question
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

    def do_generate_quiz(self, arg):
        """Generate quiz questions based on a topic and number of questions."""
        # Prompt the user for a topic and number of questions
        print("Enter the topic for the quiz:")
        topic = input()  # Get the topic from the user
        print("Enter the number of questions to generate:")
        num_questions = int(input())  # Get the number of questions from the user

        # Generate the quiz questions based on the user input
        generate_quiz_from_topic_and_count(topic, num_questions, self.output_filename)

    def do_exit(self, arg):
        """Exit the shell."""
        print("Exiting the quiz shell.")
        return True

    def do_help(self, arg):
        """Show available commands."""
        print("\nAvailable commands:")
        print("  generate_quiz  - Generate quiz questions based on topic and number of questions")
        print("  exit           - Exit the shell")
        print("  help           - Show this help message\n")

if __name__ == '__main__':
    QuizShell().cmdloop()
