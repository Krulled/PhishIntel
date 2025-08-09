# PhishIntel
PhishIntel is a CLI based AI Phishing Analysis Project

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

# Web Login (MVP) — Feature flags & local setup

This repository includes an optional, feature-flagged web login that is OFF by default and does not change existing behavior unless explicitly enabled.

Env flags (defaults)
- Backend: `AUTH_ENABLED=false`, `SECRET_KEY=devsecret`, `WEB_USERNAME=admin`, `WEB_PASSWORD=change_me`
- Frontend: `VITE_UI_AUTH_ENABLED=false`, `VITE_API_BASE=http://localhost:5000`

Run (auth OFF — current behavior)
- Backend: `pip install -r requirements.txt && python app.py`
- Frontend: `cd ui && npm i && npm run dev` → visit http://localhost:5173

Run (auth ON)
- Backend:
  `export AUTH_ENABLED=true SECRET_KEY=supersecret WEB_USERNAME=admin WEB_PASSWORD=somethingStrong && python app.py`
- Frontend:
  `cd ui && echo VITE_UI_AUTH_ENABLED=true > .env.local && npm run dev`
- Visit `/login`, authenticate, then access protected routes (e.g. `/scan/:id`).

Behavior
- When `VITE_UI_AUTH_ENABLED=true`, the SPA displays a `/login` route and protects routes with a guard.
- When `AUTH_ENABLED=true`, backend enables `POST /api/auth/login` (env credentials) and `GET /api/ping-auth` (JWT required). Existing endpoints remain unchanged.
- When both flags are false, nothing changes relative to prior behavior.
