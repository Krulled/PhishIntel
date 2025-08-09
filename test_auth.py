import importlib
import os
import sys
import types
import unittest
from unittest import mock


def _install_analyze_stub():
    mod = types.ModuleType('analyze')
    def analyze_and_log(url: str, db_path: str = '', feedback: bool = False):
        return {
            'ai_analysis': {'urlscan': {}, 'reasoning': ''},
            'virus_total': {'malicious_count': 0, 'total_engines': 0},
            'sus_count': 0,
            'ml_traditional_analysis': 'benign',
        }
    mod.analyze_and_log = analyze_and_log  # type: ignore[attr-defined]
    sys.modules['analyze'] = mod


class AuthEndpointTest(unittest.TestCase):
    def setUp(self):
        # Ensure fresh module import each test
        sys.modules.pop('app', None)
        _install_analyze_stub()

    def test_login_disabled_returns_501(self):
        with mock.patch.dict(os.environ, { 'AUTH_ENABLED': 'false' }, clear=False):
            app_module = importlib.import_module('app')
            client = app_module.app.test_client()
            res = client.post('/api/auth/login', json={'username':'x','password':'y'})
            self.assertEqual(res.status_code, 501)
            self.assertIn('auth_disabled', res.get_json().get('error',''))

    def test_login_enabled_returns_token(self):
        with mock.patch.dict(os.environ, {
            'AUTH_ENABLED': 'true',
            'SECRET_KEY': 'dev',
            'WEB_USERNAME': 'admin',
            'WEB_PASSWORD': 'pw'
        }, clear=False):
            app_module = importlib.import_module('app')
            client = app_module.app.test_client()
            res = client.post('/api/auth/login', json={'username':'admin','password':'pw'})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIn('token', data)
            self.assertTrue(data['token'])

if __name__ == '__main__':
    unittest.main()