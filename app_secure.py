from flask import Flask, request, render_template, jsonify, send_file, Response, make_response
from flask_cors import CORS
import os
import tempfile
import requests
from analyze import analyze_and_log
import uuid as uuid_lib
from datetime import datetime, timedelta
from pathlib import Path
from ai_analysis import annotate_screenshot, analyze_screenshot_bytes, detect_boxes_on_screenshot
from werkzeug.exceptions import BadRequest

# Import security modules
from security_utils import validate_url_for_scanning, sanitize_filename, get_security_headers
from rate_limiter import standard_rate_limit, strict_rate_limit, analysis_rate_limit

app = Flask(__name__)

# Security configuration
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max request size
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# Get allowed origins from environment variable
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,https://phish-intel.vercel.app')
origins_list = [origin.strip() for origin in allowed_origins.split(',')]

# Configure CORS with strict allowlist
CORS(app, resources={
    r"/*": {
        "origins": origins_list,  # No wildcard in production!
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False,
        "max_age": 86400
    }
})

# Add security headers to all responses
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses."""
    headers = get_security_headers()
    for header, value in headers.items():
        response.headers[header] = value
    
    # Add additional headers
    response.headers['X-Request-ID'] = str(uuid_lib.uuid4())
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
    
    return response

# Global error handler to prevent information disclosure
@app.errorhandler(Exception)
def handle_error(error):
    """Handle all errors without exposing internal details."""
    app.logger.error(f"Unhandled exception: {str(error)}", exc_info=True)
    
    # Don't expose internal errors in production
    if os.environ.get('FLASK_ENV') == 'production':
        return jsonify({
            'error': 'Internal server error',
            'request_id': str(uuid_lib.uuid4())
        }), 500
    else:
        # In development, show more details
        return jsonify({
            'error': str(error),
            'type': type(error).__name__,
            'request_id': str(uuid_lib.uuid4())
        }), 500

# In-memory cache for scan results (per-process)
SCAN_CACHE = {}
RECENT_UUIDS = []
MAX_RECENT = 20

# Screenshot cache directory
SCREENSHOT_CACHE_DIR = Path("Data/urlscan_screenshots")
SCREENSHOT_CACHE_DIR.mkdir(parents=True, exist_ok=True)

@app.route('/api/health', methods=['GET'])
@standard_rate_limit
def health_check():
    """Health check endpoint to verify backend is running and ready."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'phish-intel-backend',
        'version': os.environ.get('COMMIT_SHA', 'unknown'),
        'environment': os.environ.get('FLASK_ENV', 'development')
    }), 200

@app.route('/', methods=['GET', 'POST'])
@standard_rate_limit
def index():
    """Legacy endpoint - should be removed in production."""
    if request.method == 'GET':
        return render_template('index.html')
    
    # This endpoint should be deprecated
    return jsonify({
        'error': 'This endpoint is deprecated. Please use /api/analyze',
        'redirect': '/api/analyze'
    }), 410

@app.route('/api/analyze', methods=['POST'])
@analysis_rate_limit
def api_analyze():
    """Main API endpoint for URL analysis with SSRF protection."""
    try:
        # Validate Content-Type
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url'].strip()
        
        # SSRF Protection: Validate URL before scanning
        is_valid, error_message = validate_url_for_scanning(url)
        if not is_valid:
            return jsonify({
                'error': 'Invalid URL',
                'message': error_message
            }), 400
        
        # Check cache first
        if url in SCAN_CACHE:
            cached_result = SCAN_CACHE[url]
            if datetime.utcnow() - cached_result['timestamp'] < timedelta(minutes=5):
                return jsonify({
                    'result': cached_result['result'],
                    'screenshot_available': cached_result.get('screenshot_available', False),
                    'cached': True
                })
        
        # Perform analysis with timeout
        try:
            result, screenshot_available = analyze_and_log(url, feedback=data.get('feedback'))
        except requests.Timeout:
            return jsonify({'error': 'Analysis timeout'}), 504
        except Exception as e:
            app.logger.error(f"Analysis error for {url}: {str(e)}")
            return jsonify({'error': 'Analysis failed'}), 500
        
        # Generate UUID for this scan
        scan_uuid = str(uuid_lib.uuid4())
        
        # Cache the result
        SCAN_CACHE[url] = {
            'result': result,
            'screenshot_available': bool(screenshot_available),
            'timestamp': datetime.utcnow(),
            'uuid': scan_uuid
        }
        
        # Track recent scans
        RECENT_UUIDS.append({
            'uuid': scan_uuid,
            'url': url,
            'timestamp': datetime.utcnow().isoformat(),
            'result': result
        })
        
        # Limit recent scans
        if len(RECENT_UUIDS) > MAX_RECENT:
            RECENT_UUIDS.pop(0)
        
        return jsonify({
            'uuid': scan_uuid,
            'result': result,
            'screenshot_available': bool(screenshot_available),
            'cached': False
        })
        
    except BadRequest:
        return jsonify({'error': 'Invalid request body'}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error in /api/analyze: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/scan/<uuid>')
@standard_rate_limit
def get_scan_result(uuid):
    """Get scan result by UUID."""
    # Validate UUID format
    try:
        uuid_lib.UUID(uuid)
    except ValueError:
        return jsonify({'error': 'Invalid UUID format'}), 400
    
    # Find scan in recent UUIDs
    for scan in RECENT_UUIDS:
        if scan['uuid'] == uuid:
            return jsonify(scan)
    
    return jsonify({'error': 'Scan not found'}), 404

@app.route('/api/recent')
@standard_rate_limit
def get_recent_scans():
    """Get recent scans - requires authentication in production."""
    # TODO: Add authentication check here
    # if not is_authenticated(request):
    #     return jsonify({'error': 'Authentication required'}), 401
    
    return jsonify({
        'scans': RECENT_UUIDS[-10:],  # Last 10 scans only
        'total': len(RECENT_UUIDS)
    })

@app.route('/api/urlscan/<scan_id>/screenshot')
@strict_rate_limit
def get_urlscan_screenshot(scan_id):
    """Get screenshot for a scan with path traversal protection."""
    # Sanitize scan_id to prevent path traversal
    safe_scan_id = sanitize_filename(scan_id)
    
    # Validate scan_id format (should be UUID-like)
    if not safe_scan_id or len(safe_scan_id) > 64:
        return jsonify({'error': 'Invalid scan ID'}), 400
    
    cached_file = SCREENSHOT_CACHE_DIR / f"{safe_scan_id}.png"
    
    try:
        if cached_file.exists():
            # Verify file is within allowed directory
            if not str(cached_file.resolve()).startswith(str(SCREENSHOT_CACHE_DIR.resolve())):
                app.logger.error(f"Path traversal attempt detected: {scan_id}")
                return jsonify({'error': 'Invalid file path'}), 403
            
            response = make_response(send_file(cached_file, mimetype='image/png'))
            response.headers['Content-Security-Policy'] = "default-src 'none'; img-src 'self';"
            return response
        
        # If not cached, fetch from URLScan (with SSRF protection)
        # Note: This should also validate the URLScan API response
        return jsonify({'error': 'Screenshot not found'}), 404
        
    except Exception as e:
        app.logger.error(f"Error serving screenshot: {str(e)}")
        return jsonify({'error': 'Failed to retrieve screenshot'}), 500

# Remove duplicate routes and add proper rate limiting to all endpoints
# ... (continue with remaining routes, each with appropriate rate limiting and security checks)

if __name__ == '__main__':
    # Production configuration
    if os.environ.get('FLASK_ENV') == 'production':
        # Never run with debug=True in production!
        app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
    else:
        # Development mode
        app.run(host='127.0.0.1', port=5000, debug=True)