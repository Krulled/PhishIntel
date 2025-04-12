import openai
from dotenv import load_dotenv
import os
import json
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY", "")


def query_chatgpt(url, context):
    prompt = (
        "You are a cybersecurity AI. Given the URL '{}', {}. "
        "Output exactly one JSON object with two keys: 'phish' (yes/no) and 'reasoning' (a short, one-sentence explanation). "
        "Your output must not include any markdown formatting or extra text—only the JSON object."
    ).format(url, context)

    try:
        response = openai.responses.create(
            model="gpt-4o",  # Replace with your fine-tuned model's ID if available
            input = prompt,
            temperature=0.3,
        )

        full_dump_str = response.model_dump_json()
        full_dump_dict = json.loads(full_dump_str)

        raw_text = full_dump_dict["output"][0]["content"][0]["text"].strip()
        result_data = json.loads(raw_text)
        

        phish_value = result_data["phish"]
        reasoning_value = result_data["reasoning"]

        return {"phish": phish_value, "reasoning": reasoning_value}

    except Exception as e:
        print("Error Querying ChatGPT:", e)
        return None


if __name__ == "__main__":
    test_url = "http://amaz0n.com/deals"
    test_context = "Determine if this URL is potentially used for phishing."
    query_chatgpt(test_url, test_context)