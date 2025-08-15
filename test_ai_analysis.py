#!/usr/bin/env python3
"""
Test suite for AI analysis functionality in PhishIntel.
Tests OpenAI client initialization and analyze endpoint.
"""

import json
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_ai_client_init_no_proxies_kwarg():
    """Test that importing ai_analysis and calling analyze_screenshot_and_text doesn't raise due to proxies kwarg."""
    try:
        # Import should not raise any errors
        from ai_analysis import analyze_screenshot_and_text
        
        # Mock the OpenAI client to ensure no 'proxies' kwarg is used
        with patch('ai_analysis.client') as mock_client:
            mock_client.chat.completions.create.return_value = Mock(
                choices=[Mock(message=Mock(content='{"phish": "unknown", "reasoning": "Test", "notes": ["Test note"]}'))]
            )
            
            # This should not raise an error
            result = analyze_screenshot_and_text("http://example.com")
            
            # Verify result structure
            assert isinstance(result, dict)
            assert 'phish' in result
            assert 'reasoning' in result
            assert 'notes' in result
            assert isinstance(result['notes'], list)
            
        print("✅ test_ai_client_init_no_proxies_kwarg: PASSED")
        
    except Exception as e:
        raise AssertionError(f"Test failed with error: {e}")


def test_ai_analysis_returns_notes():
    """Test that AI analysis returns proper notes structure."""
    from ai_analysis import analyze_screenshot_and_text
    
    # Mock OpenAI response
    mock_response = {
        "phish": "no",
        "reasoning": "No phishing indicators detected in the URL",
        "notes": ["Clean domain structure", "No typosquatting", "Standard TLD"]
    }
    
    with patch('ai_analysis.client') as mock_client:
        mock_client.chat.completions.create.return_value = Mock(
            choices=[Mock(message=Mock(content=json.dumps(mock_response)))]
        )
        
        result = analyze_screenshot_and_text("http://youtube.com")
        
        # Verify response structure
        assert result['phish'] == 'no'
        assert isinstance(result['reasoning'], str)
        assert len(result['reasoning']) <= 140  # Should be truncated
        assert isinstance(result['notes'], list)
        assert len(result['notes']) >= 1
        assert all(len(note.split()) <= 6 for note in result['notes'])  # Each note ≤6 words
        
    print("✅ test_ai_analysis_returns_notes: PASSED")


def test_analyze_endpoint_integration():
    """Test the analyze endpoint with mock OpenAI."""
    # Import Flask app
    from app import app
    
    # Create test client
    client = app.test_client()
    
    # Mock the entire analyze_and_log function
    with patch('app.analyze_and_log') as mock_analyze:
        mock_analyze.return_value = {
            'url': 'http://youtube.com',
            'ml_traditional_analysis': 'safe',
            'virus_total': {'malicious_count': 0, 'total_engines': 70},
            'ai_analysis': {
                'phish': 'unknown',
                'reasoning': 'No obvious phishing UI detected.',
                'notes': ['No phishing indicators'],
                'screenshot': 0,
                'urlscan_uuid': None
            },
            'sus_count': 0
        }
        
        # Test POST with {"url": "youtube.com"}
        response = client.post('/analyze', 
                             json={'url': 'youtube.com'},
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify ai_analysis field is present and correct
        assert 'ai_analysis' in data
        assert data['ai_analysis']['phish'] == 'unknown'
        assert isinstance(data['ai_analysis']['notes'], list)
        assert len(data['ai_analysis']['notes']) >= 1
        assert 'reasoning' in data['ai_analysis']
        assert 'screenshot' in data['ai_analysis']
        
        print("✅ test_analyze_endpoint_integration (POST): PASSED")
        
        # Test GET with ?url=youtube.com
        response = client.get('/analyze?url=youtube.com')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify ai_analysis field is present
        assert 'ai_analysis' in data
        assert isinstance(data['ai_analysis']['notes'], list)
        
        print("✅ test_analyze_endpoint_integration (GET): PASSED")


def test_error_handling_no_openai():
    """Test graceful handling when OpenAI is unavailable."""
    from ai_analysis import analyze_screenshot_and_text
    
    with patch('ai_analysis.client', None):
        result = analyze_screenshot_and_text("http://example.com")
        
        assert result['phish'] == 'unknown'
        assert result['reasoning'] == 'Analysis unavailable'
        assert result['notes'] == ['Analysis unavailable']
        
    print("✅ test_error_handling_no_openai: PASSED")


def test_url_normalization():
    """Test that URLs are properly normalized."""
    from app import app
    
    client = app.test_client()
    
    with patch('app.analyze_and_log') as mock_analyze:
        mock_analyze.return_value = {
            'url': 'http://youtube.com',
            'ml_traditional_analysis': 'safe',
            'virus_total': {'malicious_count': 0, 'total_engines': 70},
            'ai_analysis': {
                'phish': 'unknown',
                'reasoning': 'Test',
                'notes': ['Test note'],
                'screenshot': 0,
                'urlscan_uuid': None
            },
            'sus_count': 0
        }
        
        # Test bare domain normalization
        response = client.post('/analyze', json={'url': 'youtube.com'})
        
        # Check that analyze_and_log was called with normalized URL
        mock_analyze.assert_called_with('http://youtube.com', db_path='feedback.db', feedback=False)
        
    print("✅ test_url_normalization: PASSED")


if __name__ == '__main__':
    print("🚀 Running AI Analysis Tests\n")
    
    tests = [
        test_ai_client_init_no_proxies_kwarg,
        test_ai_analysis_returns_notes,
        test_analyze_endpoint_integration,
        test_error_handling_no_openai,
        test_url_normalization
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__}: FAILED - {e}")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed.")
        sys.exit(1)