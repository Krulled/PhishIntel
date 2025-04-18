import sys
import json
import argparse
import sqlite3
from ai_analysis import query_chatgpt
from ML_and_VT import load_ml_model, analyze_url, VT_url

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

def prompt_feedback():
    while True:
        resp = input("is this classification correct? [Y/N]: ").strip().lower()
        if resp in {"y", "n"}:
            break
        print("Please enter Y or N.")
    comments = input("Any comments? (press Enter to skip):  ".strip()
        return ("Correct" if resp=="y" else "Incorrect"), comments



def main(file_path, feedback, db_path):

    if feedback:
        conn = sqlite3.connect(db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY,
                url TEXT, predicted_label TEXT, risk_score REAL,
                analyst_label TEXT, comments TEXT, timestamp DATETIME
            )
        """)
        conn.commit()

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

        if feedback:
            label, comment = prompt_feedback
            pred = result.get("ml_traditional_analysis")
            score = result.get("virus_total", {}).get("malicious_count")
            conn.execute(
                "INSERT INTO feedback (url,predicted_label,risk_score,analyst_label,comments,timestamp) "
                "VALUES (?,?,?,?,?,?)",
                (url, pred, score, label, comment, datetime.now())
            )
            conn.commit()

    if feedback:
        conn.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Analyze URLs (with optional feedback)")
    p.add_argument("file", help="Text file of URLs, one per line")
    p.add_argument("--feedback", action="store_true",
                   help="Prompt and log analyst feedback")
    p.add_argument("--db", default="feedback.db",
                   help="SQLite DB path for feedback")
    args = p.parse_args()

    main(args.file, args.feedback, args.db)


