"""Security utilities for PhishIntel backend."""

import re
import ipaddress
from urllib.parse import urlparse
from typing import Optional, Set

# Blocked IP ranges for SSRF protection
BLOCKED_IP_RANGES = [
    ipaddress.ip_network('0.0.0.0/8'),        # Current network
    ipaddress.ip_network('10.0.0.0/8'),       # Private network
    ipaddress.ip_network('100.64.0.0/10'),    # Shared address space
    ipaddress.ip_network('127.0.0.0/8'),      # Loopback
    ipaddress.ip_network('169.254.0.0/16'),   # Link local
    ipaddress.ip_network('172.16.0.0/12'),    # Private network
    ipaddress.ip_network('192.0.0.0/24'),     # IETF protocol assignments
    ipaddress.ip_network('192.168.0.0/16'),   # Private network
    ipaddress.ip_network('198.18.0.0/15'),    # Network benchmark tests
    ipaddress.ip_network('224.0.0.0/4'),      # Multicast
    ipaddress.ip_network('240.0.0.0/4'),      # Reserved
    ipaddress.ip_network('255.255.255.255/32') # Broadcast
]

# Blocked hostnames
BLOCKED_HOSTNAMES = {
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '::',
    'metadata.google.internal',
    'metadata.azure.com',
    '169.254.169.254'
}

# Allowed URL schemes
ALLOWED_SCHEMES = {'http', 'https'}

# Blocked ports (common internal services)
BLOCKED_PORTS = {
    22,    # SSH
    23,    # Telnet
    25,    # SMTP
    110,   # POP3
    143,   # IMAP
    445,   # SMB
    3306,  # MySQL
    3389,  # RDP
    5432,  # PostgreSQL
    6379,  # Redis
    8500,  # Consul
    9200,  # Elasticsearch
    11211, # Memcached
    27017  # MongoDB
}


def validate_url_for_scanning(url: str) -> tuple[bool, Optional[str]]:
    """
    Validate a URL for safe scanning, preventing SSRF attacks.
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if not url:
        return False, "URL is required"
    
    try:
        parsed = urlparse(url)
        
        # Check scheme
        if parsed.scheme not in ALLOWED_SCHEMES:
            return False, f"Invalid URL scheme: {parsed.scheme}. Only HTTP(S) allowed."
        
        # Check for empty hostname
        if not parsed.hostname:
            return False, "Invalid URL: No hostname provided"
        
        # Check against blocked hostnames
        if parsed.hostname.lower() in BLOCKED_HOSTNAMES:
            return False, f"Blocked hostname: {parsed.hostname}"
        
        # Check for blocked ports
        port = parsed.port or (443 if parsed.scheme == 'https' else 80)
        if port in BLOCKED_PORTS:
            return False, f"Blocked port: {port}"
        
        # Try to resolve to IP and check if it's in blocked ranges
        try:
            # Check if hostname is already an IP
            ip = ipaddress.ip_address(parsed.hostname)
            
            # Check against blocked ranges
            for blocked_range in BLOCKED_IP_RANGES:
                if ip in blocked_range:
                    return False, f"Blocked IP range: {ip}"
                    
        except ValueError:
            # Not an IP address, it's a hostname
            # Additional checks for suspicious patterns
            if re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', parsed.hostname):
                # Looks like an IP but failed to parse
                return False, "Invalid IP address format"
            
            # Check for localhost variations
            if 'local' in parsed.hostname.lower() or parsed.hostname.endswith('.local'):
                return False, "Local network addresses not allowed"
        
        # Additional security checks
        if '..' in url or '%00' in url:
            return False, "URL contains suspicious characters"
            
        # Check URL length
        if len(url) > 2048:
            return False, "URL too long (max 2048 characters)"
        
        return True, None
        
    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal attacks.
    """
    # Remove any path components
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    
    # Ensure it's not empty
    if not filename:
        filename = "unnamed"
    
    return filename


def get_security_headers() -> dict:
    """
    Get recommended security headers for the application.
    """
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }