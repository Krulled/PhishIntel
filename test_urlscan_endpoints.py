import pytest
from unittest.mock import Mock, patch
from app import app

class TestUrlscanEndpoints:
    def setup_method(self):
        self.client = app.test_client()
    
    @patch('urlscan.get_screenshot_bytes')
    def test_urlscan_screenshot_200_png(self, mock_get_screenshot):
        """Test screenshot endpoint returns PNG with correct headers."""
        # Mock screenshot bytes
        mock_get_screenshot.return_value = b'PNG_BYTES_HERE'
        
        response = self.client.get('/api/urlscan/test-uuid-123/screenshot')
        
        assert response.status_code == 200
        assert response.content_type == 'image/png'
        assert response.headers.get('Cache-Control') == 'public, max-age=3600'
        assert len(response.data) > 0
    
    @patch('urlscan.get_screenshot_bytes')
    @patch('ai_analysis.summarize_screenshot')
    def test_urlscan_summary_200(self, mock_summarize, mock_get_screenshot):
        """Test summary endpoint returns two sentences."""
        mock_get_screenshot.return_value = b'PNG_BYTES'
        mock_summarize.return_value = "This is a login page with email and password fields. It has a prominent 'Sign In' button at the center."
        
        response = self.client.get('/api/urlscan/test-uuid-123/summary')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'summary' in data
        assert len(data['summary']) <= 280
        assert data['summary'].count('.') >= 1  # At least one sentence
    
    @patch('urlscan.get_screenshot_bytes')
    def test_urlscan_summary_204(self, mock_get_screenshot):
        """Test summary returns 204 when no screenshot available."""
        mock_get_screenshot.return_value = None
        
        response = self.client.get('/api/urlscan/test-uuid-123/summary')
        
        assert response.status_code == 204
        assert response.data == b''

if __name__ == '__main__':
    pytest.main([__file__])