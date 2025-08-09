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
