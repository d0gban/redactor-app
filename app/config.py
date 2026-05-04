import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
INSTANCE_DIR = BASE_DIR / "instance"
load_dotenv(BASE_DIR / ".env")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 2 * 1024 * 1024))
    DATABASE = str(INSTANCE_DIR / "app.db")
    WTF_CSRF_TIME_LIMIT = None