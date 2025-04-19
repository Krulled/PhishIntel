from flask import Flask, request, render_template, jsonify
import os
import tempfile
from analyze import analyze_and_log

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    results = []
    error = None
    if request.method == 'POST':
        urls = []
        # Handle file upload or textarea
        if 'file' in request.files and request.files['file'].filename:
            file = request.files['file']
            content = file.read().decode('utf-8')
            urls = [line.strip() for line in content.splitlines() if line.strip()]
        elif 'urls' in request.form:
            urls = [line.strip() for line in request.form['urls'].splitlines() if line.strip()]
        if not urls:
            error = 'No URLs provided.'
        else:
            for url in urls:
                try:
                    analysis = analyze_and_log(
                        url,
                        db_path="feedback.db",  # Log to feedback.db
                        feedback=False          # No prompt for web UI
                    )
                    results.append(analysis)
                except Exception as e:
                    results.append({'url': url, 'error': str(e)})
    return render_template('index.html', results=results, error=error)

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    data = request.get_json()
    urls = data.get('urls', [])
    results = []
    for url in urls:
        try:
            analysis = analyze_and_log(
                url,
                db_path="feedback.db",
                feedback=False
            )
            results.append(analysis)
        except Exception as e:
            results.append({'url': url, 'error': str(e)})
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
