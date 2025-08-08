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