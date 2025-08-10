# PhishIntel
PhishIntel is a CLI based AI Phishing Analysis Project

## MVP Updates (Recent Changes)

### New Landing Page & Live Activity Feed
- **Simplified Home**: Removed all option pickers (File/URL/Search). Now shows only a single URL input field and "Analyze" button.
- **Live Activity Feed**: Added real-time "scans per minute" counter (180-480 range) and a stream of randomized recent scans with fake names, risk scores, and statuses.
- **Responsive Design**: Two-column layout with main form on left, activity feed on right.

### Enhanced Results Page
- **WHOIS Removal**: Completely removed WHOIS registrar information from results display (intentionally removed per security requirements).
- **URLScan Screenshot**: Replaced map/geolocation card with URLScan screenshot display.
- **AI Annotation Overlay**: Added OpenAI Vision integration to detect potentially malicious UI elements in screenshots with red bounding boxes and 1-3 word labels.

### New Backend Endpoints
- `GET /api/urlscan/<scan_id>/screenshot` - Serves PNG screenshots with local caching
- `GET /api/ai/annotate_screenshot/<scan_id>` - Returns AI-analyzed bounding boxes for suspicious elements

### Environment Variables
Add to your `.env` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
URLSCAN_API_KEY=your_urlscan_api_key_here
```

### Manual QA Checklist
1. ✅ Home shows only URL input + Analyze button, plus live scans/min and ticker
2. ✅ Enter URL → queue/wait page → scan results flow works
3. ✅ Scan page has no WHOIS card and no Raw JSON tabs
4. ✅ URLScan Screenshot card displays PNG with AI annotation overlays (if available)
5. ✅ Error handling: missing screenshots show friendly message, annotation failures degrade gracefully

### URLScan Screenshot Functionality
The scan results page now includes a dedicated "URLScan Screenshot" card that:
- **Automatic Loading**: Fetches screenshots via `/api/urlscan/<scanId>/screenshot` endpoint
- **Fallback Option**: If automatic loading fails, users can paste screenshot URLs directly from URLScan.io
- **Click to Zoom**: Screenshots open full-size in a new tab when clicked
- **Error Handling**: Gracefully handles missing screenshots with user-friendly messages

**To manually paste a screenshot URL:**
1. Visit URLScan.io and view your scan results
2. Copy the screenshot URL (usually ends with `.png`)
3. Paste it into the "Paste screenshot URL from URLScan" field
4. Click "Use URL" to display the image

## Web API (MVP)

- Route `GET /` serves the landing page.
- Route `POST /analyze` analyzes a single input.
- Route `GET /api/scan/{uuid}` returns the cached result for deep-linking.

### Request: POST /analyze
Send JSON with a single field:

```
{ "input": "<url|ip|domain|hash>" }
```

### Response JSON schema and field order
```
{
  "status": "ok|error",
  "verdict": "Safe|Suspicious|Malicious",
  "uuid": "<uuid-v4>",
  "submitted": "ISO8601",
  "normalized": "string",
  "redirect_chain": ["..."],
  "final_url": "string",
  "whois": { "registrar": "", "created": "", "updated": "", "expires": "", "country": "" },
  "ssl": { "issuer": "", "valid_from": "", "valid_to": "", "sni": "" },
  "domain_age_days": 0,
  "ip": "",
  "asn": "",
  "geolocation": { "country": "", "region": "", "city": "" },
  "detections": { },
  "blacklists": [ ],
  "heuristics": { },
  "model_explanations": [ "..." ],
  "risk_score": 0,
  "error": "optional string"
}
```

### Frontend routes
- `/` – landing page with a single input and Analyze button (dark theme, mobile-first)
- `/scan/{uuid}` – results page; the app fetches `GET /api/scan/{uuid}`

Accessibility: keyboard accessible input+button, loader is announced to screen readers, dialogs use focus trapping when present.
