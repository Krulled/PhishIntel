from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import os
import tempfile
from analyze import analyze_and_log
import uuid as uuid_lib
from datetime import datetime
import requests
import typing as t
from pathlib import Path

app = Flask(__name__)
# Allow frontend dev server (5173) to call the API (5000)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Auth feature flags and config (safe defaults)
AUTH_ENABLED = (os.getenv('AUTH_ENABLED') or 'false').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY') or 'devsecret'
WEB_USERNAME = os.getenv('WEB_USERNAME') or 'admin'
WEB_PASSWORD = os.getenv('WEB_PASSWORD') or 'change_me'

try:
    import jwt  # PyJWT
except Exception:  # pragma: no cover
    jwt = None  # Will only be used if AUTH_ENABLED is enabled

# In-memory cache for scan results (per-process)
SCAN_CACHE = {}
RECENT_UUIDS = []
MAX_RECENT = 20

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def auth_login():
    """Feature-flagged login endpoint. Returns 501 when AUTH is disabled."""
    # Minimal CORS for this endpoint only
    if request.method == 'OPTIONS':
        resp = app.response_class(status=204)
        _set_auth_cors_headers(resp)
        return resp

    if not AUTH_ENABLED:
        resp = jsonify({'error': 'auth_disabled'})
        _set_auth_cors_headers(resp)
        return resp, 501

    if jwt is None:
        resp = jsonify({'error': 'jwt_unavailable'})
        _set_auth_cors_headers(resp)
        return resp, 500

    try:
        payload = request.get_json(force=True) or {}
        username = (payload.get('username') or '').strip()
        password = (payload.get('password') or '').strip()
        if not username or not password:
            resp = jsonify({'error': 'missing_credentials'})
            _set_auth_cors_headers(resp)
            return resp, 400
        if username != WEB_USERNAME or password != WEB_PASSWORD:
            resp = jsonify({'error': 'invalid_credentials'})
            _set_auth_cors_headers(resp)
            return resp, 401

        now = datetime.utcnow()
        token = jwt.encode({'sub': username, 'iat': now, 'exp': now + timedelta(hours=6)}, SECRET_KEY, algorithm='HS256')
        resp = jsonify({'token': token, 'user': {'name': username}})
        _set_auth_cors_headers(resp)
        _set_auth_security_headers(resp)
        return resp
    except Exception as e:
        resp = jsonify({'error': 'server_error', 'detail': str(e)})
        _set_auth_cors_headers(resp)
        return resp, 500


def _set_auth_cors_headers(resp):
    """Apply CORS only for auth endpoints to avoid changing global behavior."""
    origin = request.headers.get('Origin')
    if origin:
        resp.headers['Access-Control-Allow-Origin'] = origin
        resp.headers['Vary'] = 'Origin'
    else:
        resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Credentials'] = 'false'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    resp.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'


def _set_auth_security_headers(resp):
    resp.headers['Cache-Control'] = 'no-store'
    resp.headers['X-Content-Type-Options'] = 'nosniff'


def _require_auth(fn: t.Callable):
    """Simple decorator that checks for a valid Bearer token when AUTH is enabled."""
    from functools import wraps

    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not AUTH_ENABLED:
            # Paranoid: if called while disabled, do not enforce
            return fn(*args, **kwargs)
        if jwt is None:
            return jsonify({'error': 'jwt_unavailable'}), 500
        auth = request.headers.get('Authorization') or ''
        parts = auth.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'missing_token'}), 401
        token = parts[1]
        try:
            jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except Exception as e:
            return jsonify({'error': 'invalid_token', 'detail': str(e)}), 401
        return fn(*args, **kwargs)

    return wrapper

# Conditionally register a demo protected endpoint to prove server-side works
if AUTH_ENABLED:
    @app.route('/api/ping-auth', methods=['GET', 'OPTIONS'])
    @_require_auth
    def ping_auth():
        if request.method == 'OPTIONS':
            resp = app.response_class(status=204)
            _set_auth_cors_headers(resp)
            return resp
        resp = jsonify({'ok': True})
        _set_auth_cors_headers(resp)
        _set_auth_security_headers(resp)
        return resp

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


@app.route('/api/urlscan/<scan_id>/screenshot')
def get_urlscan_screenshot(scan_id):
    """
    Get URLScan screenshot for a given scan_id.
    Returns the PNG image bytes with proper caching headers.
    """
    try:
        # Create cache directory if it doesn't exist
        cache_dir = Path('./Data/urlscan_screenshots')
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Check if we have a cached version
        cache_file = cache_dir / f"{scan_id}.png"
        if cache_file.exists():
            with open(cache_file, 'rb') as f:
                image_data = f.read()
            response = app.response_class(image_data, mimetype='image/png')
            response.headers['Cache-Control'] = 'public, max-age=3600'
            return response
        
        # Fetch from URLScan API
        # Get the scan result from cache to find the URLScan UUID
        scan_data = SCAN_CACHE.get(scan_id)
        if not scan_data:
            return jsonify({'error': 'screenshot_not_found'}), 404
            
        # Try to get URLScan UUID from the scan data
        # This assumes the analyze_and_log stores urlscan data somewhere
        # For now, we'll use the URLScan API directly with the URL
        
        # Get API key from environment
        api_key = os.getenv('URLSCAN_API_KEY', '')
        
        # Submit scan to URLScan if we don't have a UUID
        headers = {}
        if api_key:
            headers['API-Key'] = api_key
            
        # First try to get an existing scan result by searching
        search_url = f"https://urlscan.io/api/v1/search/?q=page.url:\"{scan_data.get('normalized', '')}\""
        
        try:
            search_response = requests.get(search_url, headers=headers, timeout=10)
            if search_response.status_code == 200:
                search_data = search_response.json()
                results = search_data.get('results', [])
                if results:
                    # Use the most recent scan
                    urlscan_uuid = results[0].get('task', {}).get('uuid')
                    if urlscan_uuid:
                        # Get the screenshot
                        screenshot_url = f"https://urlscan.io/screenshots/{urlscan_uuid}.png"
                        screenshot_response = requests.get(screenshot_url, timeout=10)
                        if screenshot_response.status_code == 200:
                            image_data = screenshot_response.content
                            # Cache it
                            with open(cache_file, 'wb') as f:
                                f.write(image_data)
                            response = app.response_class(image_data, mimetype='image/png')
                            response.headers['Cache-Control'] = 'public, max-age=3600'
                            return response
        except Exception:
            pass
            
        # If we couldn't find or fetch the screenshot
        return jsonify({'error': 'screenshot_not_found'}), 404
        
    except Exception as e:
        return jsonify({'error': 'screenshot_not_found'}), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)
