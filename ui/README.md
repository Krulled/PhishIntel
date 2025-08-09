# PhishIntel UI

- SPA with two views: `/` (landing) and `/scan/:uuid` (results)
- Uses fetch to talk to Flask API at `/analyze` and `/scan/:uuid`
- Caches last 10 results in `localStorage`

Scripts:
- `npm run dev` — start Vite dev server
- `npm run build` — production build (single JS bundle)
- `npm run test` — unit + smoke tests
