from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import os
import tempfile
from analyze import analyze_and_log
import uuid as uuid_lib
from datetime import datetime

app = Flask(__name__)
# Allow frontend dev server (5173) to call the API (5000)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# In-memory cache for scan results (per-process)
SCAN_CACHE = {}
RECENT_UUIDS = []
MAX_RECENT = 20

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


def _verdict_from_score(score: float) -> str:
    try:
        s = float(score)
    except Exception:
        s = 0.0
    if s >= 80:
        return 'Malicious'
    if s >= 50:
        return 'Suspicious'
    return 'Safe'


def _safe_get(d: dict, *path, default=None):
    cur = d or {}
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return default
        cur = cur.get(key)
    return cur if cur is not None else default


@app.route('/analyze', methods=['POST'])
def analyze_single():
    """
    Analyze a single input (URL/IP/domain/hash) and return normalized schema.
    Request JSON: { "input": string }
    Response JSON: see README (status, verdict, uuid, submitted, ...)
    """
    try:
        payload = request.get_json(force=True) or {}
        user_input = (payload.get('input') or '').strip()
        if not user_input:
            return jsonify({
                'status': 'error',
                'verdict': 'Safe',
                'uuid': '',
                'submitted': '',
                'normalized': '',
                'redirect_chain': [],
                'final_url': '',
                'whois': {'registrar': '', 'created': '', 'updated': '', 'expires': '', 'country': ''},
                'ssl': {'issuer': '', 'valid_from': '', 'valid_to': '', 'sni': ''},
                'domain_age_days': 0,
                'ip': '',
                'asn': '',
                'geolocation': {'country': '', 'region': '', 'city': ''},
                'detections': {},
                'blacklists': [],
                'heuristics': {},
                'model_explanations': [],
                'risk_score': 0,
                'error': 'Missing input'
            }), 400

        # Normalize input (basic URL normalization)
        normalized = user_input
        try:
            if not user_input.startswith(('http://', 'https://')):
                normalized = 'http://' + user_input
        except Exception:
            normalized = user_input

        # Invoke existing orchestrator (which calls urlscan and AI)
        combined = analyze_and_log(normalized, db_path="feedback.db", feedback=False)
        ai_part = combined.get('ai_analysis') or {}
        vt = combined.get('virus_total') or {}

        # Build mapped response
        submitted = datetime.utcnow().isoformat() + 'Z'
        risk_parts = [
            float(vt.get('malicious_count') or 0) / max(float(vt.get('total_engines') or 1), 1) * 100.0,
            float(combined.get('sus_count') or 0)
        ]
        # Clamp to 0..100
        risk_score = max(0.0, min(100.0, max(risk_parts))) if risk_parts else 0.0

        urlscan_details = ai_part.get('urlscan') or {}
        ssl_info = _safe_get(urlscan_details, 'ssl', default={}) or {}
        dns_info = _safe_get(urlscan_details, 'dns', default={}) or {}
        whois_info = _safe_get(urlscan_details, 'whois', default={}) or {}

        result = {
            'status': 'ok',
            'verdict': _verdict_from_score(risk_score),
            'uuid': str(uuid_lib.uuid4()),
            'submitted': submitted,
            'normalized': normalized,
            'redirect_chain': [],
            'final_url': normalized,
            'whois': {
                'registrar': whois_info.get('registrar') or '',
                'created': whois_info.get('created') or '',
                'updated': whois_info.get('updated') or '',
                'expires': whois_info.get('expires') or '',
                'country': whois_info.get('country') or '',
            },
            'ssl': {
                'issuer': ssl_info.get('issuer') or '',
                'valid_from': ssl_info.get('valid_from') or '',
                'valid_to': ssl_info.get('valid_to') or '',
                'sni': ssl_info.get('sni') or '',
            },
            'domain_age_days': int(_safe_get(urlscan_details, 'ssl', 'age_days', default=0) or 0),
            'ip': (dns_info.get('a') or ''),
            'asn': '',
            'geolocation': {'country': '', 'region': '', 'city': ''},
            'detections': {
                'VirusTotal': {
                    'malicious': vt.get('malicious_count') or 0,
                    'total': vt.get('total_engines') or 0,
                },
                'ML': combined.get('ml_traditional_analysis'),
            },
            'blacklists': [],
            'heuristics': {
                'ml_label': {
                    'pass': bool(combined.get('ml_traditional_analysis') == 'phishing'),
                    'score': float(combined.get('sus_count') or 0)
                }
            },
            'model_explanations': [ai_part.get('reasoning')] if ai_part.get('reasoning') else [],
            'risk_score': round(float(risk_score), 2),
        }

        # Cache and recent list
        scan_uuid = result['uuid']
        SCAN_CACHE[scan_uuid] = result
        RECENT_UUIDS.insert(0, scan_uuid)
        if len(RECENT_UUIDS) > MAX_RECENT:
            del RECENT_UUIDS[MAX_RECENT:]

        return jsonify(result)

    except Exception as e:
        return jsonify({'status': 'error', 'verdict': 'Safe', 'uuid': '', 'submitted': '', 'normalized': '', 'redirect_chain': [], 'final_url': '', 'whois': {'registrar': '', 'created': '', 'updated': '', 'expires': '', 'country': ''}, 'ssl': {'issuer': '', 'valid_from': '', 'valid_to': '', 'sni': ''}, 'domain_age_days': 0, 'ip': '', 'asn': '', 'geolocation': {'country': '', 'region': '', 'city': ''}, 'detections': {}, 'blacklists': [], 'heuristics': {}, 'model_explanations': [], 'risk_score': 0, 'error': str(e)}), 500


@app.route('/api/scan/<uuid>')
def get_scan(uuid):
    data = SCAN_CACHE.get(uuid)
    if not data:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(data)


@app.route('/api/recent')
def recent_scans():
    # Return only UUIDs to keep the payload small
    return jsonify({'uuids': RECENT_UUIDS[:5]})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
