
"""
features.py – URL Analysis Module

Script allows the extraction of features in a URL, which will be used to train an ML Model 
"""

import sys
import urllib.parse
import tldextract  # For domain extraction
import re
from sklearn.tree import DecisionTreeClassifier
import joblib  # For loading ML models
import numpy as np
import pandas as pd
import vt
import os
from dotenv import load_dotenv
import os 
load_dotenv()
api_key = os.getenv("VT_API_KEY", "")
client = vt.Client(api_key)

model_filename = 'phishing.pkl'



def extract_features(url):
    """
    Given a URL, extract various features required for the phishing detection model.
    
    Features include:
      - URL length
      - Presence of HTTPS
      - Domain and subdomain extraction via tldextract
      - Heuristic counts (e.g., "@" symbols, dots, dashes)
      - Checks for the usage of an IP address as the domain
      - Detection of URL shortening service usage
      
    Returns:
      A dictionary 
    """

    parsed = urllib.parse.urlparse(url)
    extracted = tldextract.extract(url)
    
    features = {}
    features['url_length']     = len(url)
    features['has_https']      = parsed.scheme.lower() == 'https'
    features['domain']         = extracted.domain
    features['subdomain']      = extracted.subdomain
    features['path']           = parsed.path
    

    ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    features['contains_ip']    = bool(re.search(ip_pattern, url))
    

    features['at_count']       = url.count('@')
    features['dot_count']      = url.count('.')
    features['hyphen_count']     = url.count('-')
    

    features['is_shortened']   = check_url_shortening(url)
    
    return features

#known_shortners
def check_url_shortening(url): 
    known_shorteners = ['bit.ly', 'tinyurl.com', 'ow.ly', 't.co', "short.io", "rebrandly.com", "is.gd", "bit.do", "buff.ly", "adf.ly"]
    for shortener in known_shorteners:
        if shortener in url:
            return True
    return False

# ------------------------------------------------------------------------------
# Section 2: ML & Heuristic Model Functions
# ------------------------------------------------------------------------------

def load_ml_model():
    """
    Load a pre-trained machine learning model from disk.
    If an ML model is not available, this function can return None.
    
    (e.g., using joblib.load or similar)
    """
    model = joblib.load(model_filename)
    return model

def ml_predict(features, model):
    suspicious_traits = 0
    if features['contains_ip']:
        suspicious_traits += 1
    if not features['has_https']:
        suspicious_traits += 1
    if features['at_count'] > 0:
        suspicious_traits += 1
    if features['is_shortened']:
        suspicious_traits += 1

    # threshold for phishing determiniation 
    heuristic_phishing = suspicious_traits >= 2

    ml_features = [
        features.get('url_length', 0),
        features.get('count_at', 0),       # instead of at_count
        features.get('count_hyphen', 0),   # instead of hyphen_count
        features.get('count_dot', 0),      # instead of dot_count
        features.get('count_digit', 0),    # instead of digit_count
        features.get('count_special', 0),  # instead of special_char_count
        1 if features.get('has_ip', False) else 0
    ]

    feature_names = [
        'url_length',
        'count_at',
        'count_hyphen',
        'count_dot',
        'count_digit',
        'count_special',
        'has_ip'
    ]


    
    ml_features_df = pd.DataFrame([ml_features], columns=feature_names)

    # Get the ML model's prediction
    ml_prediction = model.predict(ml_features_df)[0]

    # Optionally, you might consider a strategy to combine the heuristic and ML predictions
    # For example, if both indicate phishing, you could be more confident:
    combined_phishing = heuristic_phishing and (ml_prediction == 1)
    
    # Return the heuristic result, heuristic score, ML prediction, and optionally a combined result
    return heuristic_phishing, suspicious_traits, ml_prediction, combined_phishing

def analyze_url(url, model=None):
    
    result = {'url': url}
    features = extract_features(url)
    
    heuristic_phishing, suspicious_traits, ml_prediction, combined_phishing = ml_predict(features, model)
    
    result['is_phishing']    = combined_phishing
    result['features']       = features
    result['suspicion_score']= suspicious_traits
    
    # Provide human-readable reasoning for the flagged heuristics
    reasons = []
    if features['contains_ip']:
        reasons.append("URL contains an IP address.")
    if not features['has_https']:
        reasons.append("URL does not use HTTPS.")
    if features['at_count'] > 0:
        reasons.append("URL contains an '@' character.")
    if features['is_shortened']:
        reasons.append("URL is from a URL shortening service.")
        
    result['reasons'] = reasons
    
    return result


def VT_url(url):
    #Use VT API to pull score, and extra reasons 
    analysis = client.scan_url("http://168.99.76.43/?rid=LHCrKai")

    while True:
      analysis = client.scan_url("http://168.99.76.43/?rid=LHCrKai", analysis.id)
      if analysis.status == "completed":
         break
      time.sleep(30)



    stats = analysis.get('stats', {})
    malicious_count = stats.get('malicious', 0)
    total_engines = sum(stats.values())
    results = analysis.get('results', {})
    PhishCount = 0

    for vendor, data in results.items():
        if data.get('result') == 'phishing':
            PhishCount += 1

    return malicious_count,total_engines,results,PhishCount




# ------------------------------------------------------------------------------
# Script to Process
# ------------------------------------------------------------------------------

def main(file_path):

    model = load_ml_model()

    # Read the file containing URLs
    with open(file_path, 'r') as file:
        urls = file.read().splitlines()  # Each line should have one URL

    for url in urls:
        if url.strip():  # skip empty lines
            result = analyze_url(url, model)
            malicious_count, total_engines, VTresults, PhishCount = VT_url(url) #unpack tuple
            print("URL:            ", result['url'])
            print("Phishing Flag:  ", result['is_phishing'])
            print("ML Suspicion Score:", result['suspicion_score'])
            print("VT Score: " + str(malicious_count) + "/" + str(total_engines))
            print("ML Reasons:")
            for reason in result['reasons']:
                print("  -", reason)
            print("-" * 40)
            print("VT Reasons")
            for vendor, data in VTresults.items():
                if data.get('category') == 'malicious' or data.get('result') in ['malware', 'phishing']:
                    print(f"{vendor} - {data.get('result')}")

            client.close()



# ------------------------------------------------------------------------------
# Entry Point Via Command Line
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python features.py <file_with_urls.txt>")
        sys.exit(1)
    input_file_path = sys.argv[1]
    main(input_file_path)
