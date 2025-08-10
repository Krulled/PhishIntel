# PhishIntel
PhishIntel is a web-based AI Phishing Analysis tool that helps evaluate URLs for potential phishing threats and security risks.

## Features

### 🏠 **Simple Landing Page**
- Clean, single URL input interface
- Live activity feed showing recent scans
- Real-time "scans per minute" counter
- Mobile-first responsive design

### 🔍 **AI-Powered Analysis**
- URLScan screenshot integration with AI-detected overlay boxes
- OpenAI Vision API for identifying suspicious UI elements
- Comprehensive threat detection using multiple data sources
- Risk scoring and detailed explanations

### 📊 **Detailed Results**
- Clean, card-based results layout
- SSL certificate analysis
- DNS information
- Redirect chain tracking
- Copy scan ID functionality
- Export reports and direct URL access

### 🛡️ **Legal & Security**
- Complete Terms of Service, Privacy Policy, and Security Practices pages
- SSRF protection and rate limiting
- Input validation and secure headers
- Responsible disclosure process

## Quick Start

### Backend Setup
1. Clone the repository
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables (see Environment Variables section)
4. Run the Flask backend:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the UI directory:
   ```bash
   cd ui
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5173 in your browser

### Environment Variables
Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=your_openai_api_key_here
URLSCAN_API_KEY=your_urlscan_api_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FLASK_ENV=development
```

## Legal Pages
The application includes three legal pages accessible from the home page footer:
- **Terms of Service** (`/terms`) - Usage terms and acceptable use policy
- **Privacy Policy** (`/privacy`) - Data collection and usage practices  
- **Security Practices** (`/security`) - Security controls and vulnerability reporting

To update legal content, edit the respective files in `ui/src/routes/` and update the "Last updated" date.

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
