
"""
ML_and.py – URL Analysis Module

Script allows the extraction of features in a URL, which will be used to train an ML Model 
"""

import sys
import urllib.parse
try:
    import tldextract  # For domain extraction
except Exception:
    tldextract = None
import re
# Removed unused DecisionTreeClassifier import to reduce dependencies
import joblib  # For loading ML models
import numpy as np
try:
    import pandas as pd
except Exception:
    pd = None
import os
import time
from dotenv import load_dotenv

# Optional VirusTotal client import
try:
    import vt  # type: ignore
except Exception:
    vt = None

load_dotenv()

# Initialize VT client only if available and key provided
api_key = os.getenv("VT_API_KEY", "")
client = None
if vt and api_key:
    try:
        client = vt.Client(api_key)
    except Exception:
        client = None

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
    # Gracefully handle missing tldextract
    if tldextract:
        extracted = tldextract.extract(url)
        domain = extracted.domain
        subdomain = extracted.subdomain
    else:
        domain = parsed.hostname or ""
        # crude split for subdomain
        parts = domain.split('.') if domain else []
        subdomain = '.'.join(parts[:-2]) if len(parts) > 2 else ''

    features = {}
    features['url_length']     = len(url)
    features['has_https']      = parsed.scheme.lower() == 'https'
    features['domain']         = domain
    features['subdomain']      = subdomain
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
    Falls back to a no-op model if loading fails, so the web UI keeps working.
    """
    try:
        model = joblib.load(model_filename)
        return model, model_filename
    except Exception:
        class NullModel:
            def predict(self, X):
                # Predict benign for all rows
                return [0] * (len(X) if hasattr(X, '__len__') else 1)
        return NullModel(), model_filename

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
        features.get('at_count', 0),
        features.get('hyphen_count', 0),
        features.get('dot_count', 0),
        features.get('digit_count', 0),
        features.get('special_char_count', 0),
        1 if features.get('contains_ip', False) else 0
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

    # Build a DataFrame if pandas is available; otherwise, pass a simple structure
    if pd is not None:
        ml_features_df = pd.DataFrame([ml_features], columns=feature_names)
    else:
        ml_features_df = [ml_features]

    # Get the ML model's prediction (robust to incompatible models)
    try:
        ml_prediction = model.predict(ml_features_df)[0]
    except Exception:
        ml_prediction = 0

    combined_phishing = heuristic_phishing and (ml_prediction == 1)

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
    # Use VT API to pull score, and extra reasons
    # If VT client is not available or key missing, return neutral defaults
    if client is None:
        return 0, 0, {}, 0
    try:
        analysis = client.scan_url(url)
        # Poll until completed (with a max wait cap to avoid excessive blocking)
        max_wait_seconds = 60
        waited = 0
        while True:
            try:
                analysis = client.scan_url(url, analysis.id)
            except Exception:
                break
            if getattr(analysis, 'status', None) == "completed":
                break
            if waited >= max_wait_seconds:
                break
            time.sleep(5)
            waited += 5

        stats = getattr(analysis, 'stats', None) or (analysis.get('stats', {}) if isinstance(analysis, dict) else {})
        malicious_count = stats.get('malicious', 0)
        total_engines = sum(stats.values()) if isinstance(stats, dict) else 0
        results = getattr(analysis, 'results', None) or (analysis.get('results', {}) if isinstance(analysis, dict) else {})
        phish_count = 0
        if isinstance(results, dict):
            for vendor, data in results.items():
                try:
                    if data.get('result') == 'phishing':
                        phish_count += 1
                except Exception:
                    continue
        return malicious_count, total_engines, results, phish_count
    except Exception:
        return 0, 0, {}, 0




# ------------------------------------------------------------------------------
# Script to Process
# ------------------------------------------------------------------------------

def main(file_path):

    model = load_ml_model()[0]
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


# ------------------------------------------------------------------------------
# Entry Point Via Command Line
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python features.py <file_with_urls.txt>")
        sys.exit(1)
    input_file_path = sys.argv[1]
    main(input_file_path)
