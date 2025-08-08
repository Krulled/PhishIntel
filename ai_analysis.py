try:
    import openai
except Exception:
    openai = None
from dotenv import load_dotenv
import os
import json
from urlscan import urlscan

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if openai is not None:
    try:
        openai.api_key = OPENAI_API_KEY
    except Exception:
        pass


def query_chatgpt(url, context):
    result_data, screenshot = urlscan(url)
    if openai is None or not OPENAI_API_KEY:
        return {"phish": "unknown", "reasoning": "OpenAI unavailable; AI analysis skipped.", "screenshot": screenshot, "urlscan": bool(result_data)}

    prompt = (
        "You are a cybersecurity AI. Given the URL '{}', {}. Also using this png link of screenshot {}"
        "Output exactly one JSON object with two keys: 'phish' (yes/no) and 'reasoning' (a short, one-sentence explanation). "
        "Your output must not include any markdown formatting or extra text—only the JSON object."
    ).format(url, context, screenshot)

    try:
        # Prefer the modern chat/completions API for broader compatibility
        if hasattr(openai, 'chat') and hasattr(openai.chat, 'completions'):
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful cybersecurity assistant."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            text = response.choices[0].message.content.strip()
        else:
            # Fallback to legacy API
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful cybersecurity assistant."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            text = response["choices"][0]["message"]["content"].strip()

        # Strip optional code fences
        if text.startswith("```"):
            text = text.strip('`')
            if text.startswith("json\n"):
                text = text[len("json\n"):]

        parsed = json.loads(text)
        phish_value = parsed.get("phish", "unknown")
        reasoning_value = parsed.get("reasoning", "")

        return {"phish": phish_value, "reasoning": reasoning_value, "screenshot": screenshot, "urlscan": bool(result_data)}

    except Exception as e:
        print("Error Querying ChatGPT:", e)
        return {"phish": "unknown", "reasoning": "AI analysis failed.", "error": str(e), "screenshot": screenshot, "urlscan": bool(result_data)}


if __name__ == "__main__":
    test_url = "http://amaz0n.com/deals"
    test_context = "Determine if this URL is potentially used for phishing."
    print(query_chatgpt(test_url, test_context))