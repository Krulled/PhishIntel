import pandas as pd
import re
import matplotlib.pyplot as plt

# Load the dataset (update the filename if needed)
df = pd.read_csv('verified_online.csv')

# =======================
# Feature Engineering for URL
# =======================

# Compute the length of each URL
df['url_length'] = df['url'].apply(len)

# Count the occurrence of '@' character in each URL
df['count_at'] = df['url'].apply(lambda x: x.count('@'))

# Count the occurrence of '-' (hyphen) in each URL
df['count_hyphen'] = df['url'].apply(lambda x: x.count('-'))

# Count the number of dots '.' in each URL
df['count_dot'] = df['url'].apply(lambda x: x.count('.'))

# Count the number of digits in each URL
df['count_digit'] = df['url'].apply(lambda x: sum(c.isdigit() for c in x))

# Count the number of other special characters from a defined set
special_chars = set("!#$%&'*+,/:;<=>?[]^_`{|}~")
df['count_special'] = df['url'].apply(lambda x: sum(1 for c in x if c in special_chars))

# Check for the presence of an IP address in the URL using a regular expression
def contains_ip(url):
    # This regex matches IPv4 addresses (simple version)
    ip_pattern = r'(\d{1,3}\.){3}\d{1,3}'
    return 1 if re.search(ip_pattern, url) else 0

df['ip_in_url'] = df['url'].apply(contains_ip)

# Determine if the URL includes a protocol (e.g., http:// or https://)
df['has_protocol'] = df['url'].apply(lambda x: 1 if re.match(r'https?://', x, re.IGNORECASE) else 0)

# Count the number of subdomains by parsing the domain
def count_subdomains(url):
    try:
        # Remove the protocol, then isolate the domain part
        domain = re.split(r'://', url)[1].split('/')[0]
        # Split by dot to get the individual parts, assume the last two are domain and TLD.
        parts = domain.split('.')
        return max(len(parts) - 2, 0)
    except Exception:
        return 0

df['subdomain_count'] = df['url'].apply(count_subdomains)

# =======================
# Exploratory Analysis: Summary Statistics
# =======================
features = [
    'url_length', 'count_at', 'count_hyphen', 'count_dot', 
    'count_digit', 'count_special', 'ip_in_url', 'has_protocol', 
    'subdomain_count'
]

print("Summary Statistics for URL Features:")
print(df[features].describe())

# =======================
# Visualizations for Each Feature
# =======================
plt.figure(figsize=(15, 10))

for i, feature in enumerate(features):
    plt.subplot(3, 3, i+1)
    df[feature].hist(bins=20, edgecolor='black')
    plt.title(feature)
    plt.xlabel(feature)
    plt.ylabel('Frequency')

plt.tight_layout()
plt.show()

# =======================
# Additional Visualization: URL Length Distribution
# =======================
plt.figure(figsize=(8, 6))
plt.hist(df['url_length'], bins=30, edgecolor='black')
plt.title("Distribution of URL Lengths")
plt.xlabel("URL Length")
plt.ylabel("Frequency")
plt.show()

# Optionally, save the updated DataFrame with new features to a new CSV file
df.to_csv('phishing_dataset_with_features.csv', index=False)
