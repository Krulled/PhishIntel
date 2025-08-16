"""Rate limiting for PhishIntel backend."""

from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta
from collections import defaultdict
import time

# In-memory rate limit storage (use Redis in production)
rate_limit_storage = defaultdict(list)

class RateLimiter:
    def __init__(self, requests_per_minute=60, requests_per_hour=1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
    
    def get_client_id(self):
        """Get a unique identifier for the client."""
        # Use IP address as identifier (in production, consider authenticated user ID)
        return request.remote_addr or 'unknown'
    
    def is_rate_limited(self, client_id):
        """Check if client has exceeded rate limits."""
        current_time = time.time()
        
        # Clean old entries
        rate_limit_storage[client_id] = [
            timestamp for timestamp in rate_limit_storage[client_id]
            if current_time - timestamp < 3600  # Keep last hour
        ]
        
        timestamps = rate_limit_storage[client_id]
        
        # Check per-minute limit
        recent_minute = [t for t in timestamps if current_time - t < 60]
        if len(recent_minute) >= self.requests_per_minute:
            return True, "Rate limit exceeded: too many requests per minute"
        
        # Check per-hour limit
        if len(timestamps) >= self.requests_per_hour:
            return True, "Rate limit exceeded: too many requests per hour"
        
        return False, None
    
    def record_request(self, client_id):
        """Record a request from the client."""
        rate_limit_storage[client_id].append(time.time())
    
    def __call__(self, f):
        """Decorator for rate limiting Flask routes."""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_id = self.get_client_id()
            
            # Check rate limit
            is_limited, message = self.is_rate_limited(client_id)
            if is_limited:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': message,
                    'retry_after': 60  # seconds
                }), 429
            
            # Record the request
            self.record_request(client_id)
            
            # Add rate limit headers
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                timestamps = rate_limit_storage[client_id]
                recent_minute = len([t for t in timestamps if time.time() - t < 60])
                
                response.headers['X-RateLimit-Limit'] = str(self.requests_per_minute)
                response.headers['X-RateLimit-Remaining'] = str(max(0, self.requests_per_minute - recent_minute))
                response.headers['X-RateLimit-Reset'] = str(int(time.time() + 60))
            
            return response
        
        return decorated_function

# Create rate limiters with different limits
standard_rate_limit = RateLimiter(requests_per_minute=60, requests_per_hour=1000)
strict_rate_limit = RateLimiter(requests_per_minute=10, requests_per_hour=100)
analysis_rate_limit = RateLimiter(requests_per_minute=20, requests_per_hour=200)