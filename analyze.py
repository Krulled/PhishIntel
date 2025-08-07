import sys
import json
import sqlite3
from datetime import date
from ai_analysis import query_chatgpt
from ML_and_VT import load_ml_model, analyze_url, VT_url

# Optional retrain imports; not needed for web usage
try:
    from retrain import fetch_feedback_data, preprocess_feedback_data, retrain_model
    RETRAIN_AVAILABLE = True
except Exception:
    RETRAIN_AVAILABLE = False


def combined_analyze(url):
    model = load_ml_model()[0]
    traditional_results = analyze_url(url, model)
    ai_result = query_chatgpt(url, "Provide a short phishing assessment.")
    vt_summary = dict(zip(["malicious_count", "total_engines"], VT_url(url)))

    combined_results = {
        "url": url,
        "ml_traditional_analysis": traditional_results['is_phishing'],
        "virus_total": vt_summary,
        "ai_analysis": ai_result,
        "sus_count": traditional_results['suspicion_score']
    }

    return combined_results


def prompt_feedback():
    while True:
        resp = input("is this classification correct? [Y/N]: ").strip().lower()
        if resp in {"y", "n"}:
            break
        print("Please enter Y or N.")
    comments = input("Any comments? (press Enter to skip):  ").strip()
    return ("Correct" if resp == "y" else "Incorrect", comments)


def analyze_and_log(url, db_path=None, feedback=False):
    """
    Analyze a URL and optionally log results and feedback to the database.
    Returns the combined analysis result.
    If feedback is True and db_path is provided, prompts for feedback and logs to DB.
    """
    combined = combined_analyze(url)
    if feedback and db_path:
        import sqlite3
        from datetime import date
        conn = sqlite3.connect(db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY,
                sus INTEGER, predicted_label TEXT, risk_score REAL,
                analyst_label TEXT, comments TEXT, timestamp DATETIME
            )
        """)
        conn.commit()
        label, comment = prompt_feedback()
        pred = combined.get("ml_traditional_analysis")
        sus = combined.get("sus_count")
        score = combined.get("virus_total", {}).get("malicious_count")
        conn.execute(
            "INSERT INTO feedback (sus,predicted_label,risk_score,analyst_label,comments,timestamp) "
            "VALUES (?,?,?,?,?,?)",
            (sus, pred, score, label, comment, date.today())
        )
        conn.commit()
        conn.close()
    return combined


def main(file_path, feedback, db_path):

    if feedback:
        conn = sqlite3.connect(db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY,
                sus INTEGER, predicted_label TEXT, risk_score REAL,
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
            label, comment = prompt_feedback()
            print(label)
            pred = combined.get("ml_traditional_analysis")
            sus = combined.get("sus_count")
            score = combined.get("virus_total", {}).get("malicious_count")
            conn.execute(
                "INSERT INTO feedback (sus,predicted_label,risk_score,analyst_label,comments,timestamp) "
                "VALUES (?,?,?,?,?,?)",
                (sus, pred, score, label, comment, date.today())
            )
            conn.commit()

    if feedback:
        conn.close()

    # Only attempt retraining if the module is available
    if RETRAIN_AVAILABLE:
        feedback_df = fetch_feedback_data(db_path)
        X, y = preprocess_feedback_data(feedback_df)
        model_filename = load_ml_model()[1]
        retrain_model(X, y, model_filename)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Analyze URLs (with optional feedback)")
    p.add_argument("file", help="Text file of URLs, one per line")
    p.add_argument("--feedback", action="store_true",
                   help="Prompt and log analyst feedback")
    p.add_argument("--db", default="feedback.db",
                   help="SQLite DB path for feedback")
    args = p.parse_args()

    main(args.file, args.feedback, args.db)
