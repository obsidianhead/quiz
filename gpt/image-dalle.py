#!/usr/bin/env python
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')
openai = OpenAI(api_key=api_key)

model = "dall-e-3"

def main() -> None:
    print("DALL·E 3 Image Generator")
    print("-----------------------")
    
    # Get user prompt
    prompt = input("Enter your image generation prompt: ")
    
    # Choose resolution
    print("\nAvailable resolutions:")
    print("1. 1024x1024 (Square)")
    print("2. 1024x1792 (Portrait/Tall)")
    print("3. 1792x1024 (Landscape/Wide)")
    
    choice = input("Choose resolution (1-3, default=1): ").strip()
    
    if choice == "2":
        size = "1024x1792"
    elif choice == "3":
        size = "1792x1024"
    else:
        size = "1024x1024"  # Default
    
    # Generate the image
    print("\nGenerating your image...")
    response = openai.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        quality="standard",  # or "hd" for enhanced detail (costs more)
        n=1
    )
    
    # Print the result
    print("\n✅ Image generated!")
    print("URL:", response.data[0].url)

if __name__ == "__main__":
    main()