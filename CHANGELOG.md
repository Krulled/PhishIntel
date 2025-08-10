# Changelog

All notable changes to PhishIntel will be documented in this file.

## [Unreleased] - 2025-01-10

### ✨ Added

#### Legal & Policy Pages
- Complete Terms of Service page (`/terms`) with acceptable use policy
- Privacy Policy page (`/privacy`) detailing data collection and usage
- Security Practices page (`/security`) with controls and vulnerability reporting
- Navigation links in home page footer with keyboard accessibility

#### UI Polish & Enhancements
- Scan ID copy button with click-to-copy functionality  
- "Open final URL" button now works as proper external link
- Consistent card styling with `rounded-2xl` and `border-zinc-700/40`
- Enhanced UrlscanScreenshot component with proper overlay math
- Click-to-open full-size screenshot functionality
- Improved error states and loading indicators

#### Development Tools
- Added audit scripts for both Python (`pip-audit`, `safety`) and Node.js (`npm audit`)
- New npm scripts: `typecheck`, `lint:fix`, `audit:ci`
- Enhanced dependency version pinning in requirements.txt

### 🗑️ Removed  

#### Code Cleanup
- Archived unused components: `WhoisCard.tsx`, `MapPlaceholder.tsx`
- Removed geolocation references from API types and data models
- Cleaned up test files to remove references to deprecated features
- Moved deprecated components to `ui/src/_deprecated/` with documentation

#### Dependencies & Bloat
- Removed unused geolocation fields from `ScanResult` interface
- Cleaned up imports and type definitions in `valuesNormalizer.ts`
- Pruned test mocks and fixtures for removed features

### 🔧 Changed

#### Component Updates
- Updated `MetaSection.tsx` to focus on SSL/DNS analysis
- Enhanced `ValuesView.tsx` with consistent card styling and better UX
- Improved `Home.tsx` links to use React Router instead of external links
- Refined error handling in `UrlscanScreenshot.tsx`

#### Test Improvements  
- Fixed test selectors to work with current UI structure
- Updated test assertions to reflect new component hierarchy
- Added tests for legal pages navigation and content

### 🛠️ Technical Details

#### Files Added
- `ui/src/routes/Terms.tsx`
- `ui/src/routes/Privacy.tsx` 
- `ui/src/routes/Security.tsx`
- `ui/src/routes/LegalPages.test.tsx`
- `ui/src/_deprecated/README.md`
- `CHANGELOG.md`

#### Files Modified
- `ui/src/App.tsx` - Added legal page routes
- `ui/src/routes/Home.tsx` - Updated footer links to use React Router
- `ui/src/components/ValuesView.tsx` - Added scan ID copy, improved styling
- `ui/src/components/UrlscanScreenshot.tsx` - Enhanced accessibility and UX
- `ui/src/services/apiClient.ts` - Removed geolocation type definitions
- `ui/src/services/valuesNormalizer.ts` - Cleaned up unused geo parsing
- `requirements.txt` - Added audit tools
- `ui/package.json` - Added new scripts for linting and auditing
- `README.md` - Complete rewrite with new feature descriptions

#### Files Archived
- `ui/src/components/WhoisCard.tsx` → `ui/src/_deprecated/WhoisCard.tsx`
- `ui/src/components/MapPlaceholder.tsx` → `ui/src/_deprecated/MapPlaceholder.tsx`

### 🎯 Quality Assurance

#### Acceptance Criteria Met
- ✅ Repository builds cleanly with no linter errors
- ✅ Tests pass (core functionality maintained)  
- ✅ No references to Raw JSON/WHOIS/Map remain in active codebase
- ✅ Home page shows single URL input with proper validation
- ✅ Scan page renders screenshots with overlays when available
- ✅ Legal pages accessible with working "Back to Home" navigation
- ✅ Footer links reachable by keyboard with proper contrast
- ✅ Dependencies audited with no high/critical vulnerabilities

#### Manual Testing Checklist
- [ ] Backend starts without errors: `python app.py`
- [ ] Frontend builds and starts: `cd ui && npm run dev`
- [ ] Home → Queue → Scan flow works end-to-end
- [ ] Screenshot overlays display when available
- [ ] Legal pages load and navigate properly
- [ ] No console errors in browser
- [ ] Copy scan ID functionality works
- [ ] Export/Final URL buttons function correctly

---

## Previous Releases

See git history for changes prior to this cleanup release.
