# import re
# from .validators import is_valid_ipv4, is_valid_ipv6, luhn_check, is_valid_uuid

# REGEX_RULES = [
#     {"entity": "PRIVATE_KEY", "pattern": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----"), "reversible": False},
#     {"entity": "CERTIFICATE", "pattern": re.compile(r"-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----"), "reversible": False},
#     {"entity": "DB_CONNECTION_STRING", "pattern": re.compile(r"\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|mssql|amqp)://[^\s'\"]+"), "reversible": False},
#     {"entity": "BEARER_TOKEN", "pattern": re.compile(r"\bBearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE), "reversible": False},
#     {"entity": "JWT", "pattern": re.compile(r"\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+\b"), "reversible": False},
#     {"entity": "AWS_ACCESS_KEY", "pattern": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"), "reversible": False},
#     {"entity": "STRIPE_KEY", "pattern": re.compile(r"\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{10,}\b"), "reversible": False},
#     {"entity": "GITHUB_TOKEN", "pattern": re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"), "reversible": False},
#     {"entity": "SLACK_TOKEN", "pattern": re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"), "reversible": False},
#     {"entity": "SESSION_ID", "pattern": re.compile(r"\b(?:sess|session|sid)[_=:-][A-Za-z0-9\-]{8,}\b", re.IGNORECASE), "reversible": False},
#     {"entity": "EMAIL", "pattern": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"), "reversible": True},
#     {"entity": "PHONE", "pattern": re.compile(r"\b(?:\+?\d[\d\-\s()]{7,}\d)\b"), "reversible": True},
#     {"entity": "URL", "pattern": re.compile(r"\bhttps?://[^\s<>'\"]+"), "reversible": True},
#     {"entity": "IPV4", "pattern": re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b"), "reversible": True, "validator": is_valid_ipv4},
#     {"entity": "IPV6", "pattern": re.compile(r"\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b"), "reversible": True, "validator": is_valid_ipv6},
#     {"entity": "MAC", "pattern": re.compile(r"\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b|\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b"), "reversible": True},
#     {"entity": "UUID", "pattern": re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"), "reversible": True, "validator": is_valid_uuid},
#     {"entity": "CREDIT_CARD", "pattern": re.compile(r"\b(?:\d[ -]*?){13,19}\b"), "reversible": False, "validator": luhn_check},
#     {"entity": "IBAN", "pattern": re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b"), "reversible": True},
#     {"entity": "SG_NRIC_FIN", "pattern": re.compile(r"\b[STFGM]\d{7}[A-Z]\b", re.IGNORECASE), "reversible": True},
#     {"entity": "SG_UEN", "pattern": re.compile(r"\b(?:\d{8}[A-Z]|\d{9}[A-Z]|T\d{2}[A-Z]{2}\d{4}[A-Z])\b", re.IGNORECASE), "reversible": True},
#     {"entity": "WINDOWS_PATH", "pattern": re.compile(r"\b[A-Za-z]:\\(?:[^\\/:*?\"<>|\r\n]+\\)*[^\\/:*?\"<>|\r\n]*"), "reversible": True},
#     {"entity": "UNIX_PATH", "pattern": re.compile(r"(?<!\w)/(?:[\w.-]+/)*[\w.-]+"), "reversible": True},
# ]

import re
from .validators import is_valid_ipv4, is_valid_ipv6, luhn_check, is_valid_uuid

REGEX_RULES = [
    {
        "entity": "PRIVATE_KEY",
        "pattern": re.compile(
            r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----"
        ),
        "reversible": False,
    },
    {
        "entity": "CERTIFICATE",
        "pattern": re.compile(
            r"-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----"
        ),
        "reversible": False,
    },
    {
        "entity": "DB_CONNECTION_STRING",
        "pattern": re.compile(
            r"\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|mssql|amqp)://[^\s'\"]+"
        ),
        "reversible": False,
    },
    {
        "entity": "BEARER_TOKEN",
        "pattern": re.compile(
            r"\bBearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE
        ),
        "reversible": False,
    },
    {
        "entity": "JWT",
        "pattern": re.compile(
            r"\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+\b"
        ),
        "reversible": False,
    },
    {
        "entity": "AWS_ACCESS_KEY",
        "pattern": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
        "reversible": False,
    },
    {
        "entity": "STRIPE_KEY",
        "pattern": re.compile(r"\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{10,}\b"),
        "reversible": False,
    },
    {
        "entity": "GITHUB_TOKEN",
        "pattern": re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"),
        "reversible": False,
    },
    {
        "entity": "SLACK_TOKEN",
        "pattern": re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
        "reversible": False,
    },
    {
        "entity": "SESSION_ID",
        "pattern": re.compile(
            r"\b(?:sess|session|sid)[_=:-][A-Za-z0-9\-]{8,}\b", re.IGNORECASE
        ),
        "reversible": False,
    },
    {
        "entity": "EMAIL",
        "pattern": re.compile(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
        ),
        "reversible": True,
    },
    {
        "entity": "PHONE",
        "pattern": re.compile(r"\b(?:\+?\d[\d\-\s()]{7,}\d)\b"),
        "reversible": True,
    },
    {
        "entity": "URL",
        "pattern": re.compile(r"\bhttps?://[^\s<>'\"]+"),
        "reversible": True,
    },
    {
        "entity": "IPV4",
        "pattern": re.compile(
            r"\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b"
        ),
        "reversible": True,
        "validator": is_valid_ipv4,
    },
    {
        "entity": "IPV6",
        "pattern": re.compile(
            r"\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b"
        ),
        "reversible": True,
        "validator": is_valid_ipv6,
    },
    {
        "entity": "MAC",
        "pattern": re.compile(
            r"\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b|\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b"
        ),
        "reversible": True,
    },
    {
        "entity": "UUID",
        "pattern": re.compile(
            r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"
        ),
        "reversible": True,
        "validator": is_valid_uuid,
    },
    {
        "entity": "CREDIT_CARD",
        "pattern": re.compile(r"\b(?:\d[ -]*?){13,19}\b"),
        "reversible": False,
        "validator": luhn_check,
    },
    {
        "entity": "IBAN",
        "pattern": re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b"),
        "reversible": True,
    },
    {
        "entity": "SG_NRIC_FIN",
        "pattern": re.compile(r"\b[STFGM]\d{7}[A-Z]\b", re.IGNORECASE),
        "reversible": True,
    },
    {
        "entity": "SG_UEN",
        "pattern": re.compile(
            r"\b(?:\d{8}[A-Z]|\d{9}[A-Z]|T\d{2}[A-Z]{2}\d{4}[A-Z])\b",
            re.IGNORECASE,
        ),
        "reversible": True,
    },
    {
        "entity": "WINDOWS_PATH",
        "pattern": re.compile(
            r"\b[A-Za-z]:\\(?:[^\\/:*?\"<>|\r\n]+\\)*[^\\/:*?\"<>|\r\n]*"
        ),
        "reversible": True,
    },
    {
        "entity": "UNIX_PATH",
        "pattern": re.compile(r"(?<!\w)/(?:[\w.-]+/)*[\w.-]+"),
        "reversible": True,
    },
]