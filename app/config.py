import os


class Config:
    # The app never accepts uploads; keep request bodies tiny.
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 64 * 1024))
    # Cache headers for /static are finalised in security.apply_security_headers.
    SEND_FILE_MAX_AGE_DEFAULT = int(os.getenv("STATIC_MAX_AGE", 60 * 60 * 24 * 365))
    TEMPLATES_AUTO_RELOAD = os.getenv("FLASK_DEBUG") == "1"
