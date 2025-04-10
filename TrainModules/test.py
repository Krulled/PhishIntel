import vt
client = vt.Client("54ec36e901c1901677338551c4ebae5f350da2f7a85877d939e84c70eb9f47d4")
   #Use VT API to pull score, and extra reasons 

analysis = client.scan_url("http://168.99.76.43/?rid=LHCrKai")

while True:
  analysis = client.scan_url("http://168.99.76.43/?rid=LHCrKai", analysis.id)
  print(analysis.status)
  if analysis.status == "completed":
     break
  time.sleep(30)



stats = analysis.get('stats', {})
malicious_count = stats.get('malicious', 0)
total_engines = sum(stats.values())

print(f"Community Score: {malicious_count} out of {total_engines}")

# Now iterate through the results to get the details for vendors marking the URL as malicious.
results = analysis.get('results', {})
count = 0

print("\nDetails of vendors that marked the URL as malicious:")
for vendor, data in results.items():
    # Check if the vendor flagged the URL as malicious
    if data.get('category') == 'malicious' or data.get('result') in ['malware', 'phishing']:
        print(f"\nVendor: {vendor}")
        print(f"  Engine Name: {data.get('engine_name')}")
        print(f"  Method: {data.get('method')}")
        print(f"  Category: {data.get('category')}")
        print(f"  Result: {data.get('result')}")
        if data.get('result') == 'phishing':
        	count += 1


print(count)
client.close()  

