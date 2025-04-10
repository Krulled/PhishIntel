import pandas as pd
import re
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
import joblib
import numpy as np

# Example: assume you already have a DataFrame df with columns 'url' and 'label'
df = pd.read_csv('combined.csv')


# Compute features for each URL
df['url_length'] = df['url'].apply(len)
df['count_at'] = df['url'].apply(lambda x: x.count('@'))
df['count_hyphen'] = df['url'].apply(lambda x: x.count('-'))
df['count_dot'] = df['url'].apply(lambda x: x.count('.'))
df['count_digit'] = df['url'].apply(lambda x: sum(c.isdigit() for c in x))
special_chars = set("!#$%&'*+,/:;<=>?[]^_`{|}~")
df['count_special'] = df['url'].apply(lambda x: sum(1 for c in x if c in special_chars))

# Function to check for the presence of an IP address in the URL
def has_ip(url):
    ip_regex = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    return 1 if re.search(ip_regex, url) else 0

df['has_ip'] = df['url'].apply(has_ip)

# Define your feature set
features = ['url_length', 'count_at', 'count_hyphen', 'count_dot',
            'count_digit', 'count_special', 'has_ip']
print(df['verified'].value_counts())


# X contains the features and y is the target variable (label)
X = df[features]
y = df['verified'] # Ensure this column contains your ground truth (e.g., 0 for safe, 1 for phishing)


# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Initialize and train the Decision Tree classifier
model = DecisionTreeClassifier(random_state=42, class_weight='balanced')
model.fit(X_train, y_train)

# Optional: Evaluate and print the model's accuracy
accuracy = model.score(X_test, y_test)
print("Model Accuracy:", accuracy)

# Save the model using joblib
model_filename = 'phishing.pkl'
joblib.dump(model, model_filename)
print(f"Model saved to {model_filename}")
