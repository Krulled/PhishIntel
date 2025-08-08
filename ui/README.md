# PhishIntel UI

A Vite + React (TypeScript + Tailwind) UI that provides a landing page to analyze links and a shareable results view. No backend is required when the PHISHINTEL_MOCK flow is used by the analyzer service fallback.

## Quick start

```
pnpm i # or npm i
yarn dev # or pnpm dev / npm run dev
```
Open `http://localhost:5173`.

## Routing and storage

- Routes: `/` (home), `/scan/:id` (results by UUID).
- On submit we generate `crypto.randomUUID()`, run analysis, store the `SafeAnalysisResult` in IndexedDB via `idb`, then navigate to `/scan/<uuid>`.
- Sharing: if the report is small, the results page also builds a URL hash `#h=<base64-json>` for an ephemeral share link. The page first tries to hydrate from hash, then falls back to IndexedDB. If neither exists, an empty state is shown with a link back home.

## Data service

- `src/services/analyzer.ts` exports `getAnalysis(url)` returning a `Promise<SafeAnalysisResult>`.
- It attempts a backend call. If unavailable, it returns deterministic mock data for common inputs (example.com, suspicious.example, typical shorteners).
- UI components never call mock logic directly; they only call `getAnalysis`.

## Tests and checks

- Unit tests: `npm test`.
- Accessibility and Lighthouse (screenshots in `reports/`):
  - Start the dev server in one terminal: `npm run dev`.
  - In another: `npm run report` (or `npm run test:axe`).

## Feature flag

- The mock fallback is effectively the `PHISHINTEL_MOCK` path. If you add a real backend later, keep this flag defaulting to true and switch the analyzer to prefer the backend when the flag is false.

## How to add a backend later

- Replace `getAnalysis` implementation to call your API and map into `SafeAnalysisResult`.
- Keep the same IndexedDB storage so routes remain shareable.

## Screenshots

See `reports/landing.png` and `reports/results.png` after running `npm run report`.
