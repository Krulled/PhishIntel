try:
    from openai import OpenAI
except Exception:
    OpenAI = None
from dotenv import load_dotenv
import os
import json
import base64
from pathlib import Path
from urlscan import urlscan
import httpx

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Initialize OpenAI client
client = None
if OpenAI is not None and OPENAI_API_KEY:
    try:
        # Check if proxy is needed
        proxy_url = os.getenv("OPENAI_PROXY", "")
        if proxy_url:
            # Use httpx client with proxy support
            http_client = httpx.Client(proxies=proxy_url, timeout=30.0)
            client = OpenAI(api_key=OPENAI_API_KEY, http_client=http_client)
        else:
            # Direct connection without proxy
            client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize OpenAI client: {e}")
        client = None

# Screenshot cache directory
SCREENSHOT_CACHE_DIR = Path("Data/urlscan_screenshots")
SCREENSHOT_CACHE_DIR.mkdir(parents=True, exist_ok=True)


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


def analyze_screenshot_and_text(url: str, screenshot_bytes: bytes = None, max_notes: int = 6) -> dict:
    """
    Analyze URL and optional screenshot to detect phishing with notes.
    
    Args:
        url: The URL to analyze
        screenshot_bytes: Optional screenshot bytes for visual analysis
        max_notes: Maximum number of notes to return (default 6)
        
    Returns:
        dict with keys:
        - phish: "yes"|"no"|"unknown"
        - reasoning: Short explanation (≤140 chars)
        - notes: List of short notes (≤6 words each)
    """
    # Default response for errors
    default_response = {
        "phish": "unknown",
        "reasoning": "Analysis unavailable",
        "notes": ["Analysis unavailable"]
    }
    
    if not client or not OPENAI_API_KEY:
        return default_response
    
    try:
        # Build the analysis prompt
        if screenshot_bytes:
            # Analyze with screenshot
            # Security: Limit image size to prevent abuse (8MB max)
            if len(screenshot_bytes) > 8 * 1024 * 1024:
                print("Error: Image size exceeds 8MB limit")
                screenshot_bytes = None
        
        if screenshot_bytes:
            # Encode image to base64 for OpenAI Vision
            image_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            prompt = f"""Analyze this URL and screenshot for phishing indicators: {url}

Return ONLY a JSON object with exactly this structure:
{{
  "phish": "yes" or "no" or "unknown",
  "reasoning": "A single sentence explanation (max 140 characters)",
  "notes": ["note 1", "note 2", ...] // Maximum {max_notes} notes, each ≤6 words
}}

Focus on:
- Fake login forms
- Urgent calls to action
- Typosquatting in URL/branding
- Suspicious popups or overlays
- QR codes for crypto/wallets
- "Verify account" buttons
- Download prompts
- Data harvesting forms

Be concise. Each note should describe a specific indicator found."""

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_b64}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ]
        else:
            # Text-only analysis
            prompt = f"""Analyze this URL for phishing indicators: {url}

Return ONLY a JSON object with exactly this structure:
{{
  "phish": "yes" or "no" or "unknown",
  "reasoning": "A single sentence explanation (max 140 characters)",
  "notes": ["note 1", "note 2", ...] // Maximum {max_notes} notes, each ≤6 words
}}

Analyze the URL structure for:
- Domain typosquatting
- Suspicious subdomains
- Deceptive paths
- Known phishing patterns
- Unusual TLDs

Be concise. Each note should describe a specific indicator found."""

            messages = [
                {"role": "user", "content": prompt}
            ]
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.3,
            max_tokens=400,
            timeout=30
        )
        
        text = response.choices[0].message.content.strip()
        
        # Strip optional code fences
        if text.startswith("```"):
            text = text.strip('`')
            if text.startswith("json\n"):
                text = text[len("json\n"):]
        
        # Parse JSON response
        result = json.loads(text)
        
        # Validate and sanitize the response
        phish_value = str(result.get("phish", "unknown")).lower()
        if phish_value not in ["yes", "no", "unknown"]:
            phish_value = "unknown"
        
        # Truncate reasoning to 140 chars
        reasoning_value = str(result.get("reasoning", "Analysis completed"))[:140].strip()
        if not reasoning_value:
            reasoning_value = "No specific indicators detected" if phish_value == "no" else "Analysis completed"
        
        # Process notes
        notes_raw = result.get("notes", [])
        if not isinstance(notes_raw, list):
            notes_raw = []
        
        notes = []
        for note in notes_raw[:max_notes]:
            if isinstance(note, str):
                # Clean and validate note
                note = note.strip()
                # Limit to 6 words
                words = note.split()
                if len(words) > 6:
                    note = ' '.join(words[:6])
                if note:
                    notes.append(note)
        
        # Ensure at least one note
        if not notes:
            if phish_value == "yes":
                notes = ["Suspicious indicators detected"]
            elif phish_value == "no":
                notes = ["No phishing indicators"]
            else:
                notes = ["Analysis inconclusive"]
        
        return {
            "phish": phish_value,
            "reasoning": reasoning_value,
            "notes": notes
        }
        
    except Exception as e:
        print(f"Error in analyze_screenshot_and_text: {e}")
        return default_response


def query_chatgpt(url, context):
    try:
        result_data, screenshot = urlscan(url)
    except Exception as e:
        print(f"URLScan error: {e}")
        result_data, screenshot = {}, 0
    
    urlscan_details = _extract_urlscan_details(result_data)
    
    # Extract URLScan UUID from result_data if available
    urlscan_uuid = None
    if result_data and isinstance(result_data, dict):
        urlscan_uuid = result_data.get('task', {}).get('uuid') or result_data.get('uuid')
    
    # Get screenshot bytes if available
    screenshot_bytes = None
    if screenshot and urlscan_uuid:
        try:
            # Try to load from cache
            cached_file = SCREENSHOT_CACHE_DIR / f"{urlscan_uuid}.png"
            if cached_file.exists():
                with open(cached_file, 'rb') as f:
                    screenshot_bytes = f.read()
        except Exception as e:
            print(f"Failed to load screenshot: {e}")
    
    # Use the new analyze function
    ai_result = analyze_screenshot_and_text(url, screenshot_bytes)
    
    # Return combined result with all required fields
    return {
        "phish": ai_result["phish"],
        "reasoning": ai_result["reasoning"],
        "notes": ai_result["notes"],
        "screenshot": 1 if screenshot else 0,
        "urlscan": urlscan_details,
        "urlscan_uuid": urlscan_uuid,
    }


def analyze_screenshot_bytes(image_bytes: bytes, max_notes: int = 6) -> list[str]:
    """
    Analyze screenshot bytes using OpenAI Vision to extract short notes about potentially malicious UI elements.
    Returns a list of short phrases describing suspicious elements, or empty list on error.
    """
    if not client or not OPENAI_API_KEY or not image_bytes:
        return []
    
    # Security: Limit image size to prevent abuse (8MB max)
    if len(image_bytes) > 8 * 1024 * 1024:
        print("Error: Image size exceeds 8MB limit")
        return []
    
    try:
        # Encode image to base64 for OpenAI Vision
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = f"""Analyze this website screenshot and identify potentially malicious UI cues that could be used for phishing or fraud. Return up to {max_notes} short bullet notes (1 line each, ≤6 words per note) describing suspicious elements like:

- Fake login prompts
- Password input fields  
- "Verify account" buttons
- "Download document" links
- QR codes for wallets
- Urgent CTAs
- Suspicious popups
- Typos in branding
- Wallet connect prompts

Return ONLY a simple bulleted list, no other text. Each note should be very concise. If no suspicious elements are found, return an empty response."""

        # Call OpenAI Vision API
        if hasattr(client, 'chat') and hasattr(client.chat, 'completions'):
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user", 
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_b64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.3,
                max_tokens=400,
                timeout=30
            )
            
            text = response.choices[0].message.content.strip()
        else:
            # Fallback for older OpenAI client versions
            return []
            
        # Parse the response into a list of notes
        if not text:
            return []
            
        # Split by lines and clean up
        notes = []
        for line in text.split('\n'):
            line = line.strip()
            # Remove bullet points and numbering
            line = line.lstrip('•-*123456789. ')
            if line and len(line) <= 50:  # Reasonable max length
                notes.append(line)
        
        return notes[:max_notes]
        
    except Exception as e:
        print(f"Error in analyze_screenshot_bytes: {e}")
        return []


def detect_boxes_on_screenshot(image_bytes: bytes, max_boxes: int = 7) -> dict[str, any]:
    """
    Detect bounding boxes for suspicious UI elements in a screenshot.
    Returns dict with image dimensions and boxes, or empty structure on error.
    """
    if not client or not OPENAI_API_KEY or not image_bytes:
        return {"image": {}, "boxes": []}
    
    # Security: Limit image size to prevent abuse (8MB max)
    if len(image_bytes) > 8 * 1024 * 1024:
        print("Error: Image size exceeds 8MB limit")
        return {"image": {}, "boxes": []}
    
    try:
        # Encode image to base64 for OpenAI Vision
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = f"""Analyze this website screenshot and identify potentially malicious UI elements that could be used for phishing or fraud. Return a JSON object with this exact structure:

{{
  "image": {{"width": <int>, "height": <int>}},
  "boxes": [
    {{"x": <int>, "y": <int>, "w": <int>, "h": <int>, "tag": "<1-3 words>"}}
  ]
}}

Focus on detecting at most {max_boxes} elements like:
- Fake login prompts
- "Verify account" buttons  
- QR codes
- Urgent call-to-action buttons
- Wallet connect prompts
- Download buttons
- Suspicious modals/overlays
- Typosquatted logos/branding
- Captcha tricks

Coordinates must be integers in pixel units relative to the original image. Tags must be 1-3 words describing the suspicious element. Return only the JSON, no other text."""

        # Call OpenAI Vision API
        if hasattr(client, 'chat') and hasattr(client.chat, 'completions'):
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user", 
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_b64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.2,
                max_tokens=1000,
                timeout=30
            )
            
            text = response.choices[0].message.content.strip()
        else:
            # Fallback for older OpenAI client versions
            return {"image": {}, "boxes": []}
            
        # Parse the JSON response
        try:
            # Strip optional code fences
            if text.startswith("```"):
                text = text.strip('`')
                if text.startswith("json\n"):
                    text = text[len("json\n"):]
            
            result = json.loads(text)
            
            # Validate the structure
            if not isinstance(result, dict):
                return {"image": {}, "boxes": []}
            if "image" not in result or "boxes" not in result:
                return {"image": {}, "boxes": []}
            if not isinstance(result["boxes"], list):
                return {"image": {}, "boxes": []}
                
            # Validate each box
            valid_boxes = []
            for box in result["boxes"][:max_boxes]:  # Limit to max_boxes
                if (isinstance(box, dict) and 
                    all(k in box for k in ["x", "y", "w", "h", "tag"]) and
                    all(isinstance(box[k], (int, float)) for k in ["x", "y", "w", "h"]) and
                    isinstance(box["tag"], str) and len(box["tag"].strip()) > 0):
                    
                    # Convert to integers and ensure positive dimensions
                    valid_box = {
                        "x": int(box["x"]),
                        "y": int(box["y"]), 
                        "w": max(1, int(box["w"])),
                        "h": max(1, int(box["h"])),
                        "tag": box["tag"].strip()[:30]  # Limit tag length
                    }
                    valid_boxes.append(valid_box)
            
            # Return validated result
            return {
                "image": result.get("image", {"width": 1280, "height": 720}),
                "boxes": valid_boxes,
                "model": "gpt-4o-mini", 
                "version": "v1"
            }
            
        except json.JSONDecodeError:
            return {"image": {}, "boxes": []}
            
    except Exception as e:
        print(f"Error in detect_boxes_on_screenshot: {e}")
        return {"image": {}, "boxes": []}


def annotate_screenshot(scan_id):
    """
    Analyze a screenshot using OpenAI Vision to identify potentially malicious UI elements.
    Returns JSON with bounding boxes and tags, or None for graceful degradation.
    """
    if not client or not OPENAI_API_KEY:
        return None
    
    # Try to load screenshot from cache first
    cached_file = SCREENSHOT_CACHE_DIR / f"{scan_id}.png"
    screenshot_bytes = None
    
    if cached_file.exists():
        try:
            with open(cached_file, 'rb') as f:
                screenshot_bytes = f.read()
        except Exception:
            pass
    
    # If no cached file, try to fetch fresh screenshot
    if not screenshot_bytes:
        try:
            # This would need to integrate with your scan data to get the URLScan UUID
            # For MVP, we'll return None if no cached screenshot
            return None
        except Exception:
            return None
    
    # Encode image to base64 for OpenAI Vision
    try:
        image_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
        
        # Create the vision prompt for malicious UI element detection
        prompt = """Analyze this website screenshot and identify potentially malicious UI elements that could be used for phishing or fraud. Return a JSON object with this exact structure:

{
  "image": {"width": <int>, "height": <int>},
  "boxes": [
    {"x": <int>, "y": <int>, "w": <int>, "h": <int>, "tag": "<1-3 words>"}
  ],
  "model": "gpt-4o-mini",
  "version": "v1"
}

Focus on detecting at most 7 elements like:
- Fake login prompts
- "Verify account" buttons  
- QR codes
- Urgent call-to-action buttons
- Wallet connect prompts
- Download buttons
- Suspicious modals/overlays
- Typosquatted logos/branding
- Captcha tricks

Coordinates must be integers in pixel units relative to the original image. Tags must be 1-3 words describing the suspicious element. Return only the JSON, no other text."""

        # Call OpenAI Vision API
        if hasattr(client, 'chat') and hasattr(client.chat, 'completions'):
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user", 
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_b64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.2,
                max_tokens=1000,
                timeout=30
            )
            
            text = response.choices[0].message.content.strip()
        else:
            # Fallback for older OpenAI client versions
            return None
            
        # Parse the JSON response
        try:
            # Strip optional code fences
            if text.startswith("```"):
                text = text.strip('`')
                if text.startswith("json\n"):
                    text = text[len("json\n"):]
            
            result = json.loads(text)
            
            # Validate the structure
            if not isinstance(result, dict):
                return None
            if "image" not in result or "boxes" not in result:
                return None
            if not isinstance(result["boxes"], list):
                return None
                
            # Validate each box
            valid_boxes = []
            for box in result["boxes"][:7]:  # Limit to 7 boxes max
                if (isinstance(box, dict) and 
                    all(k in box for k in ["x", "y", "w", "h", "tag"]) and
                    all(isinstance(box[k], (int, float)) for k in ["x", "y", "w", "h"]) and
                    isinstance(box["tag"], str) and len(box["tag"].strip()) > 0):
                    
                    # Convert to integers and ensure positive dimensions
                    valid_box = {
                        "x": int(box["x"]),
                        "y": int(box["y"]), 
                        "w": max(1, int(box["w"])),
                        "h": max(1, int(box["h"])),
                        "tag": box["tag"].strip()[:50]  # Limit tag length
                    }
                    valid_boxes.append(valid_box)
            
            # Return validated result
            return {
                "image": result.get("image", {"width": 1280, "height": 720}),
                "boxes": valid_boxes,
                "model": "gpt-4o-mini", 
                "version": "v1"
            }
            
        except json.JSONDecodeError:
            return None
            
    except Exception as e:
        print(f"Error in screenshot annotation: {e}")
        return None


def summarize_screenshot(image_bytes: bytes) -> str:
    """
    Generate a two-sentence summary of a screenshot focusing on risky UI elements.
    Returns empty string on failure.
    """
    if not client or not OPENAI_API_KEY or not image_bytes:
        return ""
    
    # Size limit check (8MB)
    if len(image_bytes) > 8 * 1024 * 1024:
        print("Screenshot exceeds 8MB limit")
        return ""
    
    try:
        # Encode image to base64
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        messages = [
            {
                "role": "system",
                "content": "You write exactly two short sentences (≤280 chars total) describing a webpage screenshot and calling out any risky UI (e.g., login prompt, 'download document', urgent CTA). No extra text, no lists."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_b64}",
                            "detail": "high"
                        }
                    }
                ]
            }
        ]
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.3,
            max_tokens=100,
            timeout=15
        )
        
        summary = response.choices[0].message.content.strip()
        
        # Ensure it's not too long
        if len(summary) > 280:
            summary = summary[:277] + "..."
        
        return summary
        
    except Exception as e:
        print(f"Error generating screenshot summary: {e}")
        return ""


if __name__ == "__main__":
    test_url = "http://amaz0n.com/deals"
    test_context = "Determine if this URL is potentially used for phishing."
    print(query_chatgpt(test_url, test_context))