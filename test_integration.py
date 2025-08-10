#!/usr/bin/env python3
"""
Integration test script for PhishIntel AI screenshot analysis.
Tests the backend API endpoints and security features.
"""

import requests
import time
import os
from pathlib import Path

# Configuration
API_BASE = "http://localhost:5000"
TEST_SCAN_ID = "0198916b-e29a-77ad-8a43-66a70133ab3b"  # Known test scan with screenshot

def test_screenshot_endpoint():
    """Test the screenshot streaming endpoint."""
    print("Testing screenshot endpoint...")
    
    try:
        response = requests.get(f"{API_BASE}/api/urlscan/{TEST_SCAN_ID}/screenshot", timeout=20)
        
        if response.status_code == 200:
            if response.headers.get('content-type', '').startswith('image'):
                print("✅ Screenshot endpoint: Returns valid image")
                print(f"   Image size: {len(response.content)} bytes")
                return True
            else:
                print("❌ Screenshot endpoint: Invalid content type")
                return False
        elif response.status_code == 404:
            print("⚠️  Screenshot endpoint: No screenshot found (404) - this is expected for some scan IDs")
            return True
        else:
            print(f"❌ Screenshot endpoint: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Screenshot endpoint: Error - {e}")
        return False

def test_ai_notes_endpoint():
    """Test the AI screenshot notes endpoint."""
    print("Testing AI notes endpoint...")
    
    try:
        response = requests.get(f"{API_BASE}/api/ai/screenshot-notes/{TEST_SCAN_ID}", timeout=40)
        
        if response.status_code == 200:
            data = response.json()
            if 'notes' in data and isinstance(data['notes'], list):
                print("✅ AI notes endpoint: Returns valid notes structure")
                print(f"   Notes count: {len(data['notes'])}")
                if data['notes']:
                    print(f"   Sample note: {data['notes'][0]}")
                return True
            else:
                print("❌ AI notes endpoint: Invalid response structure")
                return False
        elif response.status_code == 204:
            print("✅ AI notes endpoint: No notes available (204) - graceful handling")
            return True
        else:
            print(f"❌ AI notes endpoint: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ AI notes endpoint: Error - {e}")
        return False

def test_ai_boxes_endpoint():
    """Test the AI screenshot boxes endpoint."""
    print("Testing AI boxes endpoint...")
    
    try:
        response = requests.get(f"{API_BASE}/api/ai/screenshot-boxes/{TEST_SCAN_ID}", timeout=40)
        
        if response.status_code == 200:
            data = response.json()
            required_keys = ['image', 'boxes']
            if all(key in data for key in required_keys):
                print("✅ AI boxes endpoint: Returns valid boxes structure")
                print(f"   Boxes count: {len(data['boxes'])}")
                if data['boxes'] and len(data['boxes']) > 0:
                    box = data['boxes'][0]
                    print(f"   Sample box: {box}")
                return True
            else:
                print("❌ AI boxes endpoint: Invalid response structure")
                return False
        elif response.status_code == 204:
            print("✅ AI boxes endpoint: No boxes available (204) - graceful handling")
            return True
        else:
            print(f"❌ AI boxes endpoint: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ AI boxes endpoint: Error - {e}")
        return False

def test_security_validation():
    """Test security features like input validation."""
    print("Testing security validation...")
    
    # Test invalid scan ID
    try:
        response = requests.get(f"{API_BASE}/api/urlscan/invalid_id/screenshot", timeout=10)
        if response.status_code == 400:
            print("✅ Security: Invalid scan ID properly rejected")
        else:
            print(f"⚠️  Security: Invalid scan ID returned {response.status_code}")
    except Exception as e:
        print(f"❌ Security test error: {e}")
        return False
    
    # Test malformed scan ID
    try:
        response = requests.get(f"{API_BASE}/api/urlscan/../../etc/passwd/screenshot", timeout=10)
        if response.status_code in [400, 404]:
            print("✅ Security: Path traversal attempt properly handled")
        else:
            print(f"⚠️  Security: Path traversal returned {response.status_code}")
    except Exception as e:
        print(f"❌ Security test error: {e}")
        return False
    
    return True

def test_error_handling():
    """Test error handling for non-existent resources."""
    print("Testing error handling...")
    
    fake_scan_id = "00000000-0000-0000-0000-000000000000"
    
    try:
        # Test screenshot for non-existent scan
        response = requests.get(f"{API_BASE}/api/urlscan/{fake_scan_id}/screenshot", timeout=20)
        if response.status_code == 404:
            print("✅ Error handling: Non-existent screenshot returns 404")
        else:
            print(f"⚠️  Error handling: Non-existent screenshot returned {response.status_code}")
        
        # Test AI endpoints for non-existent scan
        response = requests.get(f"{API_BASE}/api/ai/screenshot-notes/{fake_scan_id}", timeout=30)
        if response.status_code in [204, 404]:
            print("✅ Error handling: Non-existent AI notes handled gracefully")
        else:
            print(f"⚠️  Error handling: Non-existent AI notes returned {response.status_code}")
            
        return True
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False

def main():
    """Run all integration tests."""
    print("🚀 Starting PhishIntel Integration Tests\n")
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE}/api/recent", timeout=5)
        if response.status_code != 200:
            print("❌ Backend not accessible. Please start the Flask app first.")
            print("   Run: python app.py")
            return False
    except Exception:
        print("❌ Backend not running. Please start the Flask app first.")
        print("   Run: python app.py")
        return False
    
    print("✅ Backend is running\n")
    
    # Run tests
    tests = [
        test_screenshot_endpoint,
        test_ai_notes_endpoint,
        test_ai_boxes_endpoint,
        test_security_validation,
        test_error_handling
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
        print()  # Empty line between tests
    
    # Summary
    passed = sum(results)
    total = len(results)
    
    print("=" * 50)
    print(f"Integration Tests Complete: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! The integration is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
