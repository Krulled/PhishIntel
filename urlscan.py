import requests
import time
import os
import sys
import json

API_KEY = os.getenv("URLSCAN_API_KEY", "")


def urlscan(url):
    if not API_KEY:
        return 0, 0
    headers = {
        'API-Key': API_KEY,
        'Content-Type': 'application/json'
    }
    data = {
        "url": url,
        "visibility": "public"
    }
    try:
        response = requests.post(
            'https://urlscan.io/api/v1/scan/',
            headers=headers,
            data=json.dumps(data),
            timeout=10,
        )
        if response.status_code == 200:
            data = response.json()

            scan_uuid = data.get("uuid")
            if scan_uuid:
                result_url = f"https://urlscan.io/api/v1/result/{scan_uuid}/"

                # Shorter wait and capped retries to reduce blocking
                retries = 0
                max_retries = 5
                delay = 3
                while retries < max_retries:
                    time.sleep(delay)
                    result_response = requests.get(result_url, timeout=10)
                    if result_response.status_code == 200:
                        result_data = result_response.json()
                        screenshot = result_data.get('task', {}).get('screenshotURL')
                        return result_data, screenshot
                    retries += 1
                return 0, 0
            else:
                return 0, 0
        else:
            return 0, 0
    except Exception:
        return 0, 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python urlscan.py <url>")
        sys.exit(1)

    link = sys.argv[1]
    result = urlscan(link)


if __name__ == '__main__':
    main()

