# PhishIntel

A phishing intelligence analyzer with Flask backend and Vite/React UI.

## Web Login (MVP) — Feature flags & local setup

This repository now supports an optional, feature-flagged web login. By default, all auth features are OFF and behavior is unchanged.

Env flags and variables:
- Backend (Flask):
  - `AUTH_ENABLED` (default `false`): Enable auth endpoints.
  - `SECRET_KEY` (default `devsecret`): HMAC secret for JWT.
  - `WEB_USERNAME` (default `admin`)
  - `WEB_PASSWORD` (default `change_me`)
- Frontend (Vite):
  - `VITE_UI_AUTH_ENABLED` (default `false`): Enable SPA login/route guard.
  - `VITE_API_BASE` (default `http://localhost:5000`): API base URL.

Local run (auth OFF → current behavior):
- Backend:
  - `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r requirements.txt`
  - `python app.py`
- Frontend:
  - `cd ui && npm i && npm run dev`
- Visit `http://localhost:5173`

Local run (auth ON):
- Backend:
  - `export AUTH_ENABLED=true SECRET_KEY=supersecret WEB_USERNAME=admin WEB_PASSWORD=somethingStrong`
  - `python app.py`
- Frontend:
  - `cd ui && echo VITE_UI_AUTH_ENABLED=true > .env.local && npm run dev`
- Visit `/login` → sign in → access `/scan`

New endpoints (when `AUTH_ENABLED=true`):
- `POST /api/auth/login` → `{ token, user: { name } }`
- `GET /api/ping-auth` (requires `Authorization: Bearer <token>`)

Client behavior (when `VITE_UI_AUTH_ENABLED=true`):
- `/login` route is available.
- Protected routes are guarded; token is stored in `localStorage` as `phishintel_token` and sent as `Authorization: Bearer <token>`.
- Logout clears storage and returns to `/login`.

Notes:
- No existing endpoints were modified; the new endpoints are additive and disabled by default.
- Do not commit local `.env.local` files.
