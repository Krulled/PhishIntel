try:
    import openai
except Exception:
    openai = None
from dotenv import load_dotenv
import os
import json
from urlscan import urlscan

load_dotenv()

# Optional local override for secrets without committing them
# Define OPENAI_API_KEY in a local file named config_local.py to keep it out of git
try:  # type: ignore[unused-ignore]
    from config_local import OPENAI_API_KEY as OPENAI_API_KEY_LOCAL  # pyright: ignore[reportMissingImports]
except Exception:
    OPENAI_API_KEY_LOCAL = None

OPENAI_API_KEY = (OPENAI_API_KEY_LOCAL or os.getenv("OPENAI_API_KEY", ""))
if openai is not None:
    try:
        openai.api_key = OPENAI_API_KEY
    except Exception:
        pass


def _extract_urlscan_details(result_data):
    """Extract SSL, DNS, and Whois details from a urlscan.io result JSON.

    The urlscan Result API can change fields at any time; this function is
    defensive and will gracefully handle missing keys.
    """
    if not result_data:
        return {}

    page = result_data.get("page", {}) or {}
    lists = result_data.get("lists", {}) or {}
    meta = result_data.get("meta", {}) or {}

    # SSL/TLS information primarily lives on `page.*` with potential fallbacks
    certificates = lists.get("certificates") or []
    first_cert = certificates[0] if certificates else {}
    ssl_info = {
        "issuer": page.get("tlsIssuer") or first_cert.get("issuer"),
        "valid_from": page.get("tlsValidFrom") or first_cert.get("validFrom"),
        "valid_days": page.get("tlsValidDays"),
        "age_days": page.get("tlsAgeDays"),
    }

    # DNS related (A / PTR). Nameservers may not be exposed; include if present
    dns_info = {
        "a": page.get("ip"),
        "ptr": page.get("ptr"),
        "domain": page.get("domain"),
    }
    # Attempt to pull nameservers from a few plausible locations if available
    nameservers = None
    for candidate in (
        lists.get("nameservers"),
        lists.get("ns"),
        (meta.get("processors", {}).get("dns", {}) or {}).get("data"),
    ):
        if candidate:
            nameservers = candidate
            break
    if nameservers is not None:
        dns_info["ns"] = nameservers

    # Whois data is not guaranteed; try several plausible locations
    whois_info = {}
    potential_whois = (
        meta.get("whois"),
        (meta.get("processors", {}).get("whois", {}) or {}).get("data"),
        result_data.get("whois"),
    )
    for entry in potential_whois:
        if isinstance(entry, dict) and entry:
            whois_info = {
                "registrar": entry.get("registrar") or entry.get("registrarName"),
                "created": entry.get("created") or entry.get("createdDate") or entry.get("creationDate"),
            }
            break

    return {"ssl": ssl_info, "dns": dns_info, "whois": whois_info}


def query_chatgpt(url, context):
    result_data, screenshot = urlscan(url)
    urlscan_details = _extract_urlscan_details(result_data)
    if openai is None or not OPENAI_API_KEY:
        return {
            "phish": "unknown",
            "reasoning": "OpenAI unavailable; AI analysis skipped.",
            "screenshot": screenshot,
            "urlscan": urlscan_details,
        }

    prompt = (
        "You are a cybersecurity AI. Given the URL '{}' , {}. Also using this png link of screenshot {}"
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

        return {
            "phish": phish_value,
            "reasoning": reasoning_value,
            "screenshot": screenshot,
            "urlscan": urlscan_details,
        }

    except Exception as e:
        print("Error Querying ChatGPT:", e)
        return {
            "phish": "unknown",
            "reasoning": "AI analysis failed.",
            "error": str(e),
            "screenshot": screenshot,
            "urlscan": urlscan_details,
        }


if __name__ == "__main__":
    test_url = "http://amaz0n.com/deals"
    test_context = "Determine if this URL is potentially used for phishing."
    print(query_chatgpt(test_url, test_context))