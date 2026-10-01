import hashlib
from functools import lru_cache
from pathlib import Path

from flask import Flask, url_for

from .config import Config
from .security import apply_security_headers


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    static_root = Path(app.static_folder)

    @lru_cache(maxsize=None)
    def _fingerprint(filename, mtime):
        return hashlib.sha256((static_root / filename).read_bytes()).hexdigest()[:10]

    def asset_url(filename):
        path = static_root / filename
        version = _fingerprint(filename, path.stat().st_mtime_ns) if path.is_file() else "0"
        return url_for("static", filename=filename, v=version)

    app.jinja_env.globals["asset_url"] = asset_url
    app.after_request(apply_security_headers)

    from .routes import bp

    app.register_blueprint(bp)
    return app
