# PhishIntel

This project provides a Flask JSON API and a mobile-first SPA for phishing and link analysis.

## Backend

- POST `/analyze` — request body: `{ "input": "<url|ip|domain|hash>", "client_id": "optional" }`
- GET `/scan/<uuid>` — returns a cached result if available

CORS is restricted to the origin specified by `FRONTEND_ORIGIN` (default `http://localhost:5173`).

### Response schema (both routes)
- `status`: string
- `uuid`: string
- `submitted`: ISO string
- `normalized`: string | null
- `verdict`: one of `Safe | Suspicious | Malicious`
- `risk_score`: 0-100 number
- `redirect_chain`: string[]
- `final_url`: string | null
- `whois`: `{ registrar, created, updated, expires, country }`
- `ssl`: `{ issuer, valid_from, valid_to, sni }`
- `domain_age_days`: integer | null
- `ip`: string | null
- `asn`: string | null
- `geo`: `{ country, region, city }` (values can be null)
- `detections`: object of provider -> result
- `blacklists`: string[]
- `heuristics`: object of rule -> `{ pass: boolean, score: number }`
- `model_explanations`: string[]
- `error`: optional string

Fields are never omitted; unknown values are `null`.

### Example curl

```bash
curl -s -X POST -H 'Content-Type: application/json' \
  'http://localhost:5000/analyze' \
  -d '{"input":"http://example.com"}'
```

## Frontend

- Vite + React SPA with two routes: `/` (landing) and `/scan/:uuid` (results)
- Minimal CSS; dark theme, mobile-first; accessible controls
- Local cache: last 10 results in `localStorage`

### Development

- Backend: `python app.py`
- Frontend: `cd ui && npm i && npm run dev`

### Tests

- API client and smoke test: `cd ui && npm run test`
