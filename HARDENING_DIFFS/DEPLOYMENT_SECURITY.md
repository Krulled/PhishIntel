# DEPLOYMENT SECURITY CONFIGURATION GUIDE

## Vercel (Frontend) Configuration

### 1. Environment Variables
In Vercel Dashboard > Settings > Environment Variables:

```bash
# Production only
VITE_API_URL=https://phishintel-backend.onrender.com
NODE_ENV=production
```

### 2. Preview Deployment Protection
In Vercel Dashboard > Settings > Security:

1. Enable "Password Protection" for preview deployments
2. Set a strong password for preview URLs
3. Alternative: Use Vercel's "Deployment Protection" with GitHub integration

### 3. Domain Configuration
- Enable "Force HTTPS" (should be default)
- Add domain to allowlist in backend CORS configuration

### 4. Build Configuration
Ensure these settings in build:
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci --production"
}
```

## Render (Backend) Configuration

### 1. Environment Variables
In Render Dashboard > Environment:

```bash
# Required secrets (DO NOT commit these)
OPENAI_API_KEY=<your-key>
URLSCAN_API_KEY=<your-key>
VT_API_KEY=<your-key>  # VirusTotal

# Security settings
FLASK_ENV=production
ALLOWED_ORIGINS=https://phish-intel.vercel.app
SECRET_KEY=<generate-strong-secret>  # For sessions if needed

# Optional monitoring
SENTRY_DSN=<your-sentry-dsn>
LOG_LEVEL=WARNING
```

### 2. Web Service Settings
In Render Dashboard > Settings:

- **Region**: Choose closest to Vercel deployment (check Vercel region)
- **Instance Type**: At least "Starter" for production
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Enable only for specific branch

### 3. Security Headers
Render automatically handles some headers, but ensure:
- Our Flask app adds all required headers
- No conflicting header configurations

### 4. Scaling Configuration
```yaml
# In render.yaml
scaling:
  minInstances: 1
  maxInstances: 3
  targetMemoryPercent: 80
  targetCPUPercent: 80
```

## CI/CD Security Requirements

### GitHub Secrets Required
Add these in GitHub > Settings > Secrets:

```bash
VERCEL_TOKEN=<vercel-deploy-token>
RENDER_API_KEY=<render-api-key>
SECURITY_OVERRIDE_TOKEN=<emergency-override>
```

### Branch Protection Rules
In GitHub > Settings > Branches:

1. Protect `main` branch
2. Require pull request reviews
3. Require status checks:
   - `security-gate`
   - `frontend-security`
   - `backend-security`
4. Dismiss stale reviews
5. Include administrators

## Post-Deployment Verification

### 1. Security Headers Check
```bash
# Frontend
curl -I https://phish-intel.vercel.app | grep -E "Content-Security|Strict-Transport|X-Frame"

# Backend
curl -I https://phishintel-backend.onrender.com/api/health | grep -E "Content-Security|X-Content-Type"
```

### 2. CORS Verification
```javascript
// This should FAIL from browser console on different domain
fetch('https://phishintel-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)  // Should error with CORS
```

### 3. Rate Limiting Test
```bash
# Should get 429 after limit
for i in {1..100}; do
  curl https://phishintel-backend.onrender.com/api/health
done
```

### 4. SSRF Protection Test
```bash
# Should be blocked
curl -X POST https://phishintel-backend.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/"}'
```

## Monitoring & Alerts

### 1. Set up monitoring for:
- 429 responses (rate limit hits)
- 403 responses (security blocks)
- Error rate > 1%
- Response time > 2s

### 2. Security alerts for:
- Failed CORS attempts
- Path traversal attempts
- SSRF attempts
- Unusual traffic patterns

## Emergency Response

### If compromised:
1. Immediately revoke all API keys
2. Enable maintenance mode
3. Review access logs
4. Rotate secrets
5. Deploy fixes
6. Document incident

### Maintenance Mode
```python
# Add to app.py for emergency shutdown
@app.before_request
def maintenance_mode():
    if os.environ.get('MAINTENANCE_MODE') == 'true':
        return jsonify({'error': 'Service under maintenance'}), 503
```

## Regular Security Tasks

### Weekly
- Review Render/Vercel access logs
- Check for unusual API usage patterns
- Verify all security headers active

### Monthly
- Rotate API keys
- Update dependencies
- Run security scans
- Review and update CORS allowlist

### Quarterly
- Full security audit
- Penetration testing
- Update this documentation