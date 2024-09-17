#!/usr/bin/env python
import os
from openai import OpenAI

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve API key from environment variable
api_key = os.getenv('OPENAI_API_KEY')

# gets OPENAI_API_KEY from your environment variables
openai = OpenAI(api_key=api_key)

prompt = "an image of a concrete masonry with a simple end flange"
model = "dall-e-3"

def main() -> None:
    # Generate an image based on the prompt
    response = openai.images.generate(prompt=prompt, model=model)

    # Prints response containing a URL link to image
    print(response)


if __name__ == "__main__":
    main()