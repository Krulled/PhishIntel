# PhishIntel UI MVP PR Checklist

- [x] No changes to existing scripts (only additions)
- [x] No backend calls required for MVP (mock path available)
- [x] Adds UUID per scan and `/scan/:id` route
- [x] IndexedDB storage with idb; base64 hash share fallback
- [x] Landing page with trust visuals and accessible components
- [x] WCAG keyboard flow tested
- [x] Unit tests pass (`npm test`)
- [x] Axe + Lighthouse script run (`npm run report`) producing `reports/landing.png`, `reports/results.png`

## Opening the PR

The branch `phishintel_ui_uuid_redirect_mvp` has been pushed. Open a PR here:
`https://github.com/Krulled/PhishIntel/pull/new/phishintel_ui_uuid_redirect_mvp`

Include the checklist above in the description.

# UI Integration Notes

## Change Log (Auth MVP)
- Added feature-flagged backend endpoints: `POST /api/auth/login`, `GET /api/ping-auth` (enabled only when `AUTH_ENABLED=true`).
- UI additions (behind `VITE_UI_AUTH_ENABLED=true`): `/login` route, `Guard` component to protect routes, Authorization header attachment in API client, and optional Logout controls in `Home` and `Scan`.
- No changes to existing API signatures or removal of routes/components.

## Verification Steps (non-interference)
1. Ensure flags are off (default):
   - Backend: do not set `AUTH_ENABLED`.
   - Frontend: do not set `VITE_UI_AUTH_ENABLED`.
2. Run Backend: `python app.py` → existing routes work: `/`, `POST /analyze`, `GET /api/scan/:uuid`, `GET /api/recent`.
3. Run Frontend: `cd ui && npm run dev` → SPA shows Home and can navigate to `/scan/:uuid` normally; no `/login` route is registered.
4. Try calling `POST /api/auth/login` → returns 501 `auth_disabled` when server flag is off.
5. Flip flags on to test auth:
   - Backend: `export AUTH_ENABLED=true SECRET_KEY=supersecret WEB_USERNAME=admin WEB_PASSWORD=pass && python app.py`
   - Frontend: `echo VITE_UI_AUTH_ENABLED=true > ui/.env.local && (cd ui && npm run dev)`
   - Visit `/login`, sign in, verify guard allows accessing `/` and `/scan/:id`.