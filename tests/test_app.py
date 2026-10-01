import pytest

from app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def test_index_renders_with_strict_headers(client):
    res = client.get("/")
    assert res.status_code == 200
    assert b"Prompt Redactor" in res.data
    csp = res.headers["Content-Security-Policy"]
    assert "script-src 'self'" in csp
    assert "unsafe-inline" not in csp
    assert "connect-src 'none'" in csp
    assert res.headers["Cache-Control"] == "no-store"
    assert res.headers["X-Frame-Options"] == "DENY"


def test_index_has_no_third_party_or_inline_scripts(client):
    html = client.get("/").get_data(as_text=True)
    assert "cdn." not in html
    assert "<script>" not in html
    assert 'type="module"' in html


def test_healthz(client):
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}


def test_fingerprinted_static_is_immutable(client):
    html = client.get("/").get_data(as_text=True)
    start = html.index("/static/css/app.css?v=")
    url = html[start : html.index('"', start)]
    res = client.get(url)
    assert res.status_code == 200
    assert "immutable" in res.headers["Cache-Control"]


def test_unversioned_static_revalidates(client):
    res = client.get("/static/js/engine/redact.js")
    assert res.status_code == 200
    assert res.headers["Cache-Control"] == "no-cache"
    assert "javascript" in res.headers["Content-Type"]


def test_favicon(client):
    assert client.get("/favicon.ico").status_code == 200
