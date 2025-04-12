import json

json_str = '''{
  "phish": "yes",
  "reasoning": "The URL uses 'amaz0n.com', which is a misspelling of 'amazon.com', commonly used in phishing attempts."
}'''

# Print the raw representation to inspect for extra characters or BOM
print("Raw JSON string:", repr(json_str))

# Check if the string is empty after stripping whitespace
if not json_str.strip():
    print("Error: The JSON string is empty.")
else:
    try:
        data = json.loads(json_str.strip())
        print("Phish:", data["phish"])
        print("Reasoning:", data["reasoning"])
    except json.JSONDecodeError as err:
        print("JSON decode error:", err)
