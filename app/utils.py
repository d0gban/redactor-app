import hashlib
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_fernet = None


def get_fernet():
    global _fernet
    if _fernet is None:
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise RuntimeError("Missing ENCRYPTION_KEY in .env")
        _fernet = Fernet(key.encode())
    return _fernet


def encrypt_text(value):
    return get_fernet().encrypt(value.encode()).decode()


def decrypt_text(value):
    return get_fernet().decrypt(value.encode()).decode()


def sha256_text(value):
    return hashlib.sha256(value.encode()).hexdigest()