from flask import Flask, request, render_template, jsonify
import os
import tempfile
from analyze import analyze_and_log
from flask_cors import CORS
import uuid as _uuid
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse

# Cache for scan results in-memory keyed by uuid
SCAN_CACHE = {}

app = Flask(__name__)

# Configure CORS only for the front-end origin
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
CORS(app, resources={r"/*": {"origins": [FRONTEND_ORIGIN]}}, supports_credentials=False)


def _normalize_input(raw: str) -> str:
    try:
        parsed = urlparse(raw.strip())
        # If missing scheme but has netloc in path, try to fix
        if not parsed.scheme and parsed.path:
            parsed = urlparse("http://" + raw.strip())
        # Drop fragments and normalize scheme/host casing
        norm = parsed._replace(fragment="", scheme=parsed.scheme.lower(), netloc=parsed.netloc.lower())
        return urlunparse(norm)
    except Exception:
        return raw.strip()


def _empty_schema() -> dict:
    return {
        "status": "error",
        "uuid": "",
        "submitted": datetime.now(timezone.utc).isoformat(),
        "normalized": None,
        "verdict": "Safe",
        "risk_score": 0,
        "redirect_chain": [],
        "final_url": None,
        "whois": {"registrar": None, "created": None, "updated": None, "expires": None, "country": None},
        "ssl": {"issuer": None, "valid_from": None, "valid_to": None, "sni": None},
        "domain_age_days": None,
        "ip": None,
        "asn": None,
        "geo": {"country": None, "region": None, "city": None},
        "detections": {},
        "blacklists": [],
        "heuristics": {},
        "model_explanations": [],
        "error": None,
    }


def _derive_verdict(ai_flag: str, vt_malicious: int, vt_total: int, ml_label) -> str:
    try:
        vt_ratio = (vt_malicious or 0) / max(vt_total or 1, 1)
    except Exception:
        vt_ratio = 0
    ai_mal = str(ai_flag).lower().startswith("y")
    is_phish = str(ml_label).lower() in {"phishing", "phish", "malicious", "true"}
    if ai_mal or vt_ratio >= 0.2 or is_phish:
        return "Malicious"
    if vt_ratio >= 0.05:
        return "Suspicious"
    return "Safe"


def _compute_risk_score(vt_malicious: int, vt_total: int, sus_score: int, ai_flag: str) -> int:
    vt_component = int(round(100 * (vt_malicious or 0) / max(vt_total or 1, 1)))
    sus_component = min(max(int(sus_score or 0) * 5, 0), 100)
    ai_component = 20 if str(ai_flag).lower().startswith("y") else 0
    score = max(vt_component, sus_component)
    score = min(score + ai_component, 100)
    return int(score)


def _parse_date_to_age_days(date_str: str) -> int | None:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            dt = datetime.strptime(date_str[:19], fmt).replace(tzinfo=timezone.utc)
            return max(0, (datetime.now(timezone.utc) - dt).days)
        except Exception:
            continue
    return None


def _normalize_combined(input_value: str, combined: dict) -> dict:
    url = input_value
    vt = (combined or {}).get("virus_total", {}) or {}
    ai = (combined or {}).get("ai_analysis", {}) or {}
    ml_label = (combined or {}).get("ml_traditional_analysis")
    sus_count = (combined or {}).get("sus_count")

    vt_mal = int(vt.get("malicious_count") or 0)
    vt_total = int(vt.get("total_engines") or 0)

    urlscan_details = ai.get("urlscan") or {}
    ssl_info = (urlscan_details.get("ssl") or {})
    dns_info = (urlscan_details.get("dns") or {})
    whois_info = (urlscan_details.get("whois") or {})

    final_url = (combined or {}).get("final_url") or url

    verdict = _derive_verdict(ai.get("phish"), vt_mal, vt_total, ml_label)
    risk_score = _compute_risk_score(vt_mal, vt_total, sus_count, ai.get("phish"))

    created_str = whois_info.get("created")
    domain_age_days = _parse_date_to_age_days(created_str)

    detections = {}
    if vt_total:
        detections["VirusTotal"] = f"{vt_mal}/{vt_total} malicious"

    heuristics = {
        "ml_traditional_analysis": {
            "pass": str(ml_label).lower() not in {"phishing", "phish", "malicious", "true"},
            "score": int(sus_count or 0),
        }
    }

    model_explanations = []
    if ai.get("reasoning"):
        model_explanations.append(str(ai.get("reasoning"))[:180])

    normalized_url = _normalize_input(url)

    payload = {
        "status": "ok",
        "uuid": "",  # filled by caller
        "submitted": datetime.now(timezone.utc).isoformat(),
        "normalized": normalized_url,
        "verdict": verdict,
        "risk_score": risk_score,
        "redirect_chain": [],
        "final_url": final_url or normalized_url,
        "whois": {
            "registrar": whois_info.get("registrar"),
            "created": whois_info.get("created"),
            "updated": whois_info.get("updated"),
            "expires": whois_info.get("expires"),
            "country": whois_info.get("country"),
        },
        "ssl": {
            "issuer": ssl_info.get("issuer"),
            "valid_from": ssl_info.get("valid_from"),
            "valid_to": ssl_info.get("valid_to"),
            "sni": ssl_info.get("sni"),
        },
        "domain_age_days": domain_age_days,
        "ip": dns_info.get("a") if isinstance(dns_info.get("a"), str) else None,
        "asn": None,
        "geo": {"country": None, "region": None, "city": None},
        "detections": detections,
        "blacklists": [],
        "heuristics": heuristics,
        "model_explanations": model_explanations,
        "error": None,
    }
    return payload


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

# JSON API [Flask blueprint-style organization in-file]
@app.route('/analyze', methods=['POST'])
def analyze_endpoint():
    try:
        data = request.get_json(silent=True) or {}
        input_value = data.get('input')
        client_id = data.get('client_id')  # optional, currently unused
        if not input_value or not isinstance(input_value, str):
            resp = _empty_schema()
            resp["error"] = "Invalid input. Provide a non-empty string in 'input'."
            resp["status"] = "error"
            return jsonify(resp), 400

        scan_id = str(_uuid.uuid4())
        combined = analyze_and_log(input_value, db_path="feedback.db", feedback=False)
        payload = _normalize_combined(input_value, combined)
        payload["uuid"] = scan_id

        # Cache it
        SCAN_CACHE[scan_id] = payload
        return jsonify(payload), 200
    except Exception as e:
        resp = _empty_schema()
        resp["error"] = str(e)
        resp["status"] = "error"
        return jsonify(resp), 500


@app.route('/scan/<scan_uuid>', methods=['GET'])
def get_scan(scan_uuid):
    result = SCAN_CACHE.get(scan_uuid)
    if result:
        return jsonify(result), 200
    resp = _empty_schema()
    resp["uuid"] = scan_uuid
    resp["status"] = "error"
    resp["error"] = "Scan not found"
    return jsonify(resp), 404


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
