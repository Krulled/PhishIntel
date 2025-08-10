# AI Screenshot Analysis Feature

This feature adds AI-driven screenshot analysis to flag potentially malicious UI elements on URLScan screenshots.

## Features

- **AI Screenshot Notes**: Analyzes screenshots using OpenAI Vision to detect suspicious UI elements like fake login forms, urgent CTAs, and phishing indicators
- **Bounding Box Overlays**: Draws red boxes with labels around detected malicious elements
- **Fallback Support**: Allows manual URL input for screenshots when automatic fetching fails
- **Security Hardening**: Includes timeouts, size limits, input validation, and graceful error handling

## Setup

1. **Environment Variables**: Set your OpenAI API key:
   ```
   export OPENAI_API_KEY=your_api_key_here
   ```

2. **Backend**: The AI endpoints are automatically available when `app.py` runs:
   - `GET /api/urlscan/<scan_id>/screenshot` - Stream screenshot image
   - `GET /api/ai/screenshot-notes/<scan_id>` - Get AI analysis notes
   - `GET /api/ai/screenshot-boxes/<scan_id>` - Get bounding boxes for suspicious elements

3. **Frontend**: The feature is integrated into the Scan page with:
   - `UrlscanScreenshot` component with overlay rendering
   - `AINotes` component that merges textual and screenshot analysis
   - Automatic fallback to manual URL input on API failures

## Usage

1. Perform a URL scan via the web interface
2. Navigate to the scan results page (`/scan/<uuid>`)
3. The AI-annotated screenshot will appear with:
   - Red bounding boxes around suspicious elements
   - Short labels (1-3 words) describing each element
   - AI notes integrated under the Verdict section

## Testing

Run the integration tests:
```bash
python test_integration.py
```

Run frontend tests:
```bash
cd ui
npm test
```

## Security Features

- **Image Size Limits**: Maximum 8MB per image
- **Request Timeouts**: 30s for AI calls, 15s for screenshot fetching
- **Input Validation**: Scan ID format validation and sanitization
- **Error Handling**: Graceful degradation when AI services unavailable
- **No Secret Logging**: API keys and image data are not logged

## Architecture

- **Backend**: Flask endpoints in `app.py` coordinate with AI functions in `ai_analysis.py`
- **Frontend**: React components handle image display, overlay math, and fallback flows
- **AI Integration**: OpenAI Vision API (gpt-4o-mini) for screenshot analysis
- **Caching**: Local screenshot caching to reduce external API calls and improve performance
