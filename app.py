from flask import Flask, request, render_template, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import requests
from analyze import analyze_and_log
import uuid as uuid_lib
from datetime import datetime
from pathlib import Path
from ai_analysis import annotate_screenshot, analyze_screenshot_bytes, detect_boxes_on_screenshot

app = Flask(__name__)

# Get allowed origins from environment variable, fallback to localhost and Vercel for development
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,https://phish-intel.vercel.app')
origins_list = [origin.strip() for origin in allowed_origins.split(',')]

# Configure CORS to allow frontend to call the API
CORS(app, resources={r"/*": {"origins": origins_list}})

# In-memory cache for scan results (per-process)
SCAN_CACHE = {}
RECENT_UUIDS = []
MAX_RECENT = 20

# Screenshot cache directory
SCREENSHOT_CACHE_DIR = Path("Data/urlscan_screenshots")
SCREENSHOT_CACHE_DIR.mkdir(parents=True, exist_ok=True)

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


@app.route('/analyze', methods=['POST', 'GET'])
def analyze_single():
    """
    Analyze a single input (URL/IP/domain/hash) and return normalized schema.
    Request JSON: { "input": string } or { "url": string }
    GET request: ?url=string
    Response JSON: see README (status, verdict, uuid, submitted, ...)
    """
    try:
        # Extract user input based on method and format
        if request.method == 'POST':
            payload = request.get_json(force=True) or {}
            # Support both "input" and "url" parameters
            user_input = (payload.get('url') or payload.get('input') or '').strip()
        else:
            # GET method
            user_input = request.args.get('url', '').strip()
            
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

        # Try to extract URLScan UUID from the analysis result
        # Look for URLScan UUID in various possible locations in the analysis data
        urlscan_uuid = None
        if ai_part and 'urlscan_uuid' in ai_part:
            urlscan_uuid = ai_part.get('urlscan_uuid')
        elif combined and 'urlscan_uuid' in combined:
            urlscan_uuid = combined.get('urlscan_uuid')
        elif urlscan_details and 'uuid' in urlscan_details:
            urlscan_uuid = urlscan_details.get('uuid')
        
        # Use URLScan UUID if available, otherwise generate a random one
        scan_uuid = urlscan_uuid if urlscan_uuid else str(uuid_lib.uuid4())

        result = {
            'status': 'ok',
            'verdict': _verdict_from_score(risk_score),
            'uuid': scan_uuid,
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
            'ai_analysis': {
                'phish': ai_part.get('phish', 'unknown'),
                'reasoning': ai_part.get('reasoning', ''),
                'notes': ai_part.get('notes', ['Analysis unavailable']),
                'screenshot': ai_part.get('screenshot', 0),
                'urlscan_uuid': urlscan_uuid
            }
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
    Fetch URLScan screenshot for a given scan ID.
    Returns the PNG image with proper headers, or 404 JSON if not found.
    """
    try:
        # Validate scan_id format (basic UUID-like check)
        if not scan_id or len(scan_id) < 10:
            return jsonify({'error': 'invalid_scan_id'}), 400
            
        # Check if we have the image cached locally
        cached_file = SCREENSHOT_CACHE_DIR / f"{scan_id}.png"
        if cached_file.exists():
            response = send_file(cached_file, mimetype='image/png')
            response.headers['Cache-Control'] = 'public, max-age=3600'
            return response
        
        # Try to fetch screenshot directly from URLScan.io API
        # URLScan.io provides screenshots at: https://urlscan.io/screenshots/{uuid}.png
        screenshot_url = f"https://urlscan.io/screenshots/{scan_id}.png"
        
        try:
            response = requests.get(screenshot_url, timeout=15, headers={
                'User-Agent': 'PhishIntel/1.0'
            })
            if response.status_code == 200 and response.headers.get('content-type', '').startswith('image'):
                # Cache the image locally
                with open(cached_file, 'wb') as f:
                    f.write(response.content)
                
                # Return the cached file with proper headers
                flask_response = send_file(cached_file, mimetype='image/png')
                flask_response.headers['Cache-Control'] = 'public, max-age=3600'
                return flask_response
            else:
                return jsonify({'error': 'not_found'}), 404
        except requests.RequestException:
            return jsonify({'error': 'not_found'}), 404
            
    except Exception as e:
        return jsonify({'error': 'server_error', 'message': str(e)}), 500


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, port=port, host='0.0.0.0')



@app.route('/api/ai/screenshot-notes/<scan_id>')
def get_screenshot_notes(scan_id):
    """
    Get AI-generated short notes for a screenshot of the given scan.
    Returns JSON with notes array, or 204 if no notes available.
    """
    try:
        # Validate scan_id format (basic UUID-like check)
        if not scan_id or len(scan_id) < 10:
            return jsonify({'error': 'invalid_scan_id'}), 400
            
        # Check if we have the image cached locally
        cached_file = SCREENSHOT_CACHE_DIR / f"{scan_id}.png"
        screenshot_bytes = None
        
        if cached_file.exists():
            try:
                with open(cached_file, 'rb') as f:
                    screenshot_bytes = f.read()
            except Exception:
                pass
        
        # If no cached screenshot, try to fetch from URLScan.io
        if not screenshot_bytes:
            try:
                screenshot_url = f"https://urlscan.io/screenshots/{scan_id}.png"
                response = requests.get(screenshot_url, timeout=15, headers={
                    'User-Agent': 'PhishIntel/1.0'
                })
                if response.status_code == 200 and response.headers.get('content-type', '').startswith('image'):
                    screenshot_bytes = response.content
                    # Cache the image
                    with open(cached_file, 'wb') as f:
                        f.write(screenshot_bytes)
                else:
                    return '', 204  # No screenshot available
            except Exception:
                return '', 204  # No screenshot available
        
        # Analyze the screenshot
        notes = analyze_screenshot_bytes(screenshot_bytes, max_notes=6)
        
        if not notes:
            return '', 204  # No notes available
        
        return jsonify({
            'notes': notes,
            'model': 'gpt-4o-mini',
            'version': 'v1'
        })
        
    except Exception as e:
        return jsonify({'error': 'server_error', 'message': str(e)}), 500


@app.route('/api/ai/screenshot-boxes/<scan_id>')
def get_screenshot_boxes(scan_id):
    """
    Get AI-generated bounding boxes for suspicious elements in a screenshot.
    Returns JSON with boxes array, or 204 if no boxes available.
    """
    try:
        # Validate scan_id format (basic UUID-like check)
        if not scan_id or len(scan_id) < 10:
            return jsonify({'error': 'invalid_scan_id'}), 400
            
        # Check if we have the image cached locally
        cached_file = SCREENSHOT_CACHE_DIR / f"{scan_id}.png"
        screenshot_bytes = None
        
        if cached_file.exists():
            try:
                with open(cached_file, 'rb') as f:
                    screenshot_bytes = f.read()
            except Exception:
                pass
        
        # If no cached screenshot, try to fetch from URLScan.io
        if not screenshot_bytes:
            try:
                screenshot_url = f"https://urlscan.io/screenshots/{scan_id}.png"
                response = requests.get(screenshot_url, timeout=15, headers={
                    'User-Agent': 'PhishIntel/1.0'
                })
                if response.status_code == 200 and response.headers.get('content-type', '').startswith('image'):
                    screenshot_bytes = response.content
                    # Cache the image
                    with open(cached_file, 'wb') as f:
                        f.write(screenshot_bytes)
                else:
                    return '', 204  # No screenshot available
            except Exception:
                return '', 204  # No screenshot available
        
        # Detect boxes in the screenshot
        result = detect_boxes_on_screenshot(screenshot_bytes, max_boxes=7)
        
        if not result.get('boxes'):
            return '', 204  # No boxes detected
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'server_error', 'message': str(e)}), 500


@app.route('/api/ai/annotate_screenshot/<scan_id>')
def get_screenshot_annotations(scan_id):
    """
    Get AI-generated annotations for a screenshot of the given scan.
    Returns JSON with bounding boxes and tags, or 204 if no annotations available.
    """
    try:
        result = annotate_screenshot(scan_id)
        if result is None:
            return '', 204  # No content - graceful degradation
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': 'server_error', 'message': str(e)}), 500


@app.route('/api/test_scan_with_screenshot')
def test_scan_with_screenshot():
    """
    Test endpoint that returns a mock scan result with the actual URLScan UUID
    to test screenshot functionality.
    """
    test_scan_result = {
        'status': 'ok',
        'verdict': 'Suspicious',
        'uuid': '0198916b-e29a-77ad-8a43-66a70133ab3b',  # Your actual URLScan UUID
        'submitted': datetime.utcnow().isoformat() + 'Z',
        'normalized': 'https://example-phishing-site.com',
        'redirect_chain': [],
        'final_url': 'https://example-phishing-site.com',
        'whois': {'registrar': '', 'created': '', 'updated': '', 'expires': '', 'country': ''},
        'ssl': {'issuer': '', 'valid_from': '', 'valid_to': '', 'sni': ''},
        'domain_age_days': 30,
        'ip': '192.168.1.1',
        'asn': '',
        'geolocation': {'country': '', 'region': '', 'city': ''},
        'detections': {},
        'blacklists': [],
        'heuristics': {},
        'model_explanations': [],
        'risk_score': 75,
    }
    
    # Cache this test result so it can be accessed via /api/scan/<uuid>
    SCAN_CACHE['0198916b-e29a-77ad-8a43-66a70133ab3b'] = test_scan_result
    
    return jsonify(test_scan_result)

