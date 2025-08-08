# PhishIntel UI

A fast, accessible frontend MVP for analyzing suspicious links. This UI is self-contained and mocks analysis results behind a thin data layer so a backend can be wired later.

## Quick start

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`

## Tech decisions

- Vite + React + TypeScript for fast DX and production builds
- TailwindCSS for design system in a dark security palette
- Minimal component patterns; Radix UI primitives for a11y where needed
- Vitest + Testing Library for unit tests

## How to add a real backend later

Replace the mock analyzer in `src/services/analyzer.ts` with real HTTP calls. Keep the `getAnalysis(url)` shape returning `SafeAnalysisResult` to avoid UI changes.

## Accessibility

- WCAG 2.2 AA contrast, visible focus states, keyboard navigation
- Form errors announced via `role="alert"`

## Performance

- Lazy rendering of result sections, skeletons during load, preloaded fonts
