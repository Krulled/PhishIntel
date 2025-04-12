import sys
import json
from ai_analysis import query_chatgpt
from features import load_ml_model, analyze_url, VT_url

def combined_analyze(url):
    model = load_ml_model()
    traditional_results = analyze_url(url, model)
    ai_result = query_chatgpt(url, "Provide a short phishing assessment.")
    vt_summary = dict(zip(["malicious_count", "total_engines"], VT_url(url)))

    combined_results = {
        "url": url,
        "ml_traditional_analysis": traditional_results['is_phishing'],
        "virus_total": vt_summary,
        "ai_analysis": ai_result
    }

    return combined_results


def main(file_path):
    # Read the file containing URLs (each URL on a separate line)
    with open(file_path, 'r') as file:
        urls = [line.strip() for line in file if line.strip()]
    
    # For each URL, get the combined analysis and pretty-print the results.
    for url in urls:
        print("=" * 40)
        combined = combined_analyze(url)
        print("Combined Analysis for URL:", url)
        print(json.dumps(combined, indent=2, default=str))
        print("=" * 40)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze.py <file_with_urls.txt>")
        sys.exit(1)
    input_file = sys.argv[1]
    main(input_file)


