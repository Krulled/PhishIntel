import os
import importlib
import json
from contextlib import contextmanager

@contextmanager
def envset(**env):
    old = {}
    try:
        for k, v in env.items():
            old[k] = os.environ.get(k)
            os.environ[k] = v
        yield
    finally:
        for k, v in old.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


def fresh_app():
    if 'app' in globals():
        pass
    if 'app' in importlib.sys.modules:
        importlib.reload(importlib.import_module('app'))
    mod = importlib.import_module('app')
    return getattr(mod, 'app')


def test_login_disabled_returns_501():
    with envset(AUTH_ENABLED='false', SECRET_KEY='devsecret', WEB_USERNAME='admin', WEB_PASSWORD='pw'):
        app = fresh_app()
        client = app.test_client()
        res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'pw'})
        assert res.status_code == 501
        body = res.get_json()
        assert body.get('error') == 'auth_disabled'


def test_login_enabled_returns_token():
    with envset(AUTH_ENABLED='true', SECRET_KEY='devsecret', WEB_USERNAME='admin', WEB_PASSWORD='pw'):
        app = fresh_app()
        client = app.test_client()
        res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'pw'})
        assert res.status_code == 200
        body = res.get_json()
        assert 'token' in body and body['token']
        assert body.get('user', {}).get('name') == 'admin'