import os
import json
import time
import requests
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

URLSCAN_API_KEY = os.getenv("URLSCAN_API_KEY", "")
URLSCAN_BASE = os.getenv("URLSCAN_BASE", "https://urlscan.io/api/v1")

def urlscan(url):
    """Legacy function - returns (result_data, screenshot_indicator)"""
    uuid = submit_url(url)
    if not uuid:
        return {}, 0
    
    result = poll_result(uuid, timeout=15)
    if not result:
        return {}, 0
    
    # Return result and 1 if screenshot exists
    screenshot_url = get_screenshot_url(uuid)
    return result, 1 if screenshot_url else 0


def submit_url(url: str) -> str:
    """Submit URL to URLScan API and return UUID."""
    if not URLSCAN_API_KEY:
        print("URLScan API key not configured")
        return ""
    
    try:
        headers = {
            "API-Key": URLSCAN_API_KEY,
            "Content-Type": "application/json"
        }
        
        data = {
            "url": url,
            "visibility": "public"
        }
        
        response = requests.post(
            f"{URLSCAN_BASE}/scan/",
            headers=headers,
            json=data,
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("uuid", "")
        elif response.status_code == 429:
            print("URLScan rate limit exceeded")
        else:
            print(f"URLScan submit failed: {response.status_code}")
        
        return ""
        
    except Exception as e:
        print(f"URLScan submit error: {e}")
        return ""


def poll_result(uuid: str, timeout: int = 15) -> dict:
    """Poll URLScan for results with exponential backoff."""
    if not uuid:
        return None
    
    start_time = time.time()
    wait_time = 0.5  # Start with 500ms
    
    while time.time() - start_time < timeout:
        try:
            response = requests.get(
                f"{URLSCAN_BASE}/result/{uuid}/",
                timeout=min(5, timeout - (time.time() - start_time))
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                # Result not ready yet
                time.sleep(wait_time)
                wait_time = min(wait_time * 2, 5)  # Exponential backoff up to 5s
            else:
                print(f"URLScan poll failed: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"URLScan poll error: {e}")
            time.sleep(wait_time)
            wait_time = min(wait_time * 2, 5)
    
    print("URLScan poll timeout")
    return None


def get_screenshot_url(uuid: str) -> str:
    """Get screenshot URL from URLScan result."""
    if not uuid:
        return None
    
    try:
        # Try to get from cached result first
        result = poll_result(uuid, timeout=5)
        if result:
            # Check multiple possible locations for screenshot URL
            screenshot_url = (
                result.get("task", {}).get("screenshotURL") or
                result.get("screenshot") or
                result.get("page", {}).get("screenshot")
            )
            if screenshot_url:
                return screenshot_url
        
        # Fallback to direct URL construction
        return f"https://urlscan.io/screenshots/{uuid}.png"
        
    except Exception as e:
        print(f"Error getting screenshot URL: {e}")
        return None


def get_screenshot_bytes(uuid: str) -> bytes:
    """Download screenshot and return as PNG bytes."""
    if not uuid:
        return None
    
    screenshot_url = get_screenshot_url(uuid)
    if not screenshot_url:
        return None
    
    try:
        response = requests.get(screenshot_url, timeout=15)
        
        if response.status_code != 200:
            print(f"Screenshot download failed: {response.status_code}")
            return None
        
        # Check content type
        content_type = response.headers.get("Content-Type", "").lower()
        if not content_type.startswith(("image/png", "image/jpeg")):
            print(f"Invalid content type: {content_type}")
            return None
        
        # Size limit check (8MB)
        if len(response.content) > 8 * 1024 * 1024:
            print("Screenshot exceeds 8MB limit")
            return None
        
        # Convert JPEG to PNG if needed
        if content_type.startswith("image/jpeg"):
            try:
                img = Image.open(BytesIO(response.content))
                png_buffer = BytesIO()
                img.save(png_buffer, format="PNG")
                return png_buffer.getvalue()
            except Exception as e:
                print(f"Failed to convert JPEG to PNG: {e}")
                return None
        
        return response.content
        
    except Exception as e:
        print(f"Screenshot download error: {e}")
        return None

