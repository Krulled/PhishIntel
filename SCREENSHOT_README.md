# URLScan Screenshot Integration

This implementation adds AI-driven screenshot analysis to the PhishIntel scanning workflow.

## Features

- **Reliable Screenshot Rendering**: Screenshots are automatically fetched from URLScan.io and cached locally
- **AI-Powered Screenshot Notes**: GPT-4o-mini analyzes screenshots to identify suspicious UI elements
- **Visual Overlays**: Red-boxed overlays highlight potential phishing elements with short descriptive tags
- **Graceful Fallback**: Manual screenshot URL input when automatic fetching fails

## Setup

### Backend Requirements

1. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

2. Start the Flask backend:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Install dependencies and start the development server:
   ```bash
   cd ui
   npm install
   npm run dev
   ```

## Usage

### Automatic Flow
1. Navigate to Home → Queue → Scan
2. Screenshots load automatically if available from URLScan
3. AI notes appear below the Verdict section
4. Red overlay boxes highlight suspicious UI elements

### Manual Screenshot Input
If automatic screenshot loading fails:
1. Visit the URLScan result page
2. Copy the direct screenshot URL (usually ends with `.png`)
3. Paste it in the fallback input field that appears
4. Click "Use URL" to display the screenshot

## API Endpoints

- `GET /api/urlscan/<scan_id>/screenshot` - Returns cached or fetched screenshot image
- `GET /api/ai/screenshot-notes/<scan_id>` - Returns AI-generated notes about suspicious elements
- `GET /api/ai/screenshot-boxes/<scan_id>` - Returns bounding box coordinates for visual overlays

## Notes

- Screenshots are cached in `Data/urlscan_screenshots/` for performance
- AI analysis requires a valid OpenAI API key with GPT-4o-mini access
- Overlay positioning adapts to different image sizes and container layouts
- All AI calls gracefully degrade if OpenAI is unavailable

## Testing

Run the frontend tests:
```bash
cd ui
npm test
```

The implementation includes comprehensive tests for:
- Screenshot loading and fallback behavior
- Overlay rendering and positioning
- AI notes integration
- Error handling and graceful degradation
