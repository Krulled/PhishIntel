import requests
import time
import os
import sys
import json

API_KEY = "019635c1-db9d-7514-9dc0-b51f2cde4320"

def urlscan(url):
	headers = {'API-Key':API_KEY,
	'Content-Type':'application/json'
	}
	data = {"url": url, 
	"visibility": "public"
	}
	response = requests.post('https://urlscan.io/api/v1/scan/',headers=headers, data=json.dumps(data))
	if response.status_code == 200:
	    data = response.json()
	    
	    # Extract the UUID for the scan which is used to fetch results
	    scan_uuid = data.get("uuid")
	    if scan_uuid:
	        result_url = f"https://urlscan.io/api/v1/result/{scan_uuid}/"
	        
	        print("Waiting for scan results...")
	        time.sleep(15)
	        
	        result_response = requests.get(result_url)
	        if result_response.status_code == 200:
	        	result_data = result_response.json()
	        	screenshot = result_data.get('task', {}).get('screenshotURL')
	        	return result_data, screenshot
	        else:
	            print(f"Failed to retrieve result: {result_response.status_code}")
	    else:
	        print("No UUID found in the response.")
	        return 0, 0
	else:
	    print(f"Error submitting scan: {response.status_code} - {response.text}")
	    return 0, 0

def main(): 
    if len(sys.argv) < 2:
        print("Usage: python urlscan.py <url>")
        sys.exit(1)
    
    # The URL to scan is provided as the first argument.
    link = sys.argv[1]
    result = urlscan(link)
    

if __name__ == '__main__':
    main()

