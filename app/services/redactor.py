import json
import re


REGEX_RULES = [
    {"name": "PRIVATE_KEY", "label": "Private Key", "pattern": re.compile(r"-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----")},
    {"name": "CERTIFICATE", "label": "Certificate", "pattern": re.compile(r"-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----")},
    {"name": "ENV_ASSIGNMENT", "label": "Environment Assignment", "pattern": re.compile(r"(?im)^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*([^\r\n#]+)$")},
    {"name": "ENV_SECRET_NAME", "label": "Environment Secret Name", "pattern": re.compile(r"(?im)^(?:export\s+)?([A-Z][A-Z0-9_]*(?:SECRET|KEY|TOKEN|PASSWORD|PASS|API|AUTH|CREDENTIAL)[A-Z0-9_]*)\s*=\s*([^\r\n#]{8,})$")},
    {"name": "KEYED_SECRET", "label": "Keyed Secret", "pattern": re.compile(r"\b(?:session|sessionid|session_id|token|auth_token|access_token|refresh_token|api_key|apikey|secret|password)\s*=\s*[^\s;]+", re.IGNORECASE)},
    {"name": "AWS_KEY", "label": "AWS Key", "pattern": re.compile(r"\bAKIA[0-9A-Z]{16}\b")},
    {"name": "STRIPE_KEY", "label": "Stripe Key", "pattern": re.compile(r"\bsk_(?:test|live)_[A-Za-z0-9]{16,}\b")},
    {"name": "GITHUB_TOKEN", "label": "GitHub Token", "pattern": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")},
    {"name": "SLACK_TOKEN", "label": "Slack Token", "pattern": re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")},
    {"name": "BEARER_TOKEN", "label": "Bearer Token", "pattern": re.compile(r"\bBearer\s+(?!\[JWT\])[A-Za-z0-9._\-+/=]{20,}\b")},
    {"name": "JWT", "label": "JWT", "pattern": re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b")},
    {"name": "EMAIL", "label": "Email", "pattern": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")},
    {"name": "URL", "label": "URL", "pattern": re.compile(r"\b(?:https?|postgres|mysql|mongodb)://[^\s<>()\"']+\b")},
    {"name": "WINDOWS_PATH", "label": "Windows Path", "pattern": re.compile(r"\b[A-Za-z]:\\(?:[^\\\n\r\t]+\\)*[^\\\n\r\t]+\b")},
    {"name": "UNIX_PATH", "label": "Unix Path", "pattern": re.compile(r"(?<![\w:])/(?:[^ \n\r\t]+/?)+")},
    {"name": "UUID", "label": "UUID", "pattern": re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")},
    {"name": "MAC", "label": "MAC Address", "pattern": re.compile(r"\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b|\b(?:[0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}\b")},
    {"name": "IPV4", "label": "IPv4", "pattern": re.compile(r"\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b")},
    {"name": "IPV6", "label": "IPv6", "pattern": re.compile(r"\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b")},
    {"name": "PHONE", "label": "Phone", "pattern": re.compile(r"(?<!\w)(?:\+63\s?\d{3}\s?\d{3}\s?\d{4}|\(\d{2,4}\)\s?\d{3,4}-\d{4})(?!\w)")},
    {"name": "CREDIT_CARD", "label": "Credit Card", "pattern": re.compile(r"\b(?:\d[ -]*?){13,19}\b")},
    {"name": "IBAN", "label": "IBAN", "pattern": re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b")},
    {"name": "SG_NRIC", "label": "SG NRIC", "pattern": re.compile(r"\b[STFG]\d{7}[A-Z]\b")},
    {"name": "SG_UEN", "label": "SG UEN", "pattern": re.compile(r"\b(?:T\d{2}[A-Z]{2}\d{4}[A-Z]|\d{8}[A-Z])\b")},
]


def get_regex_rules_meta():
    return [{"name": rule["name"], "label": rule["label"]} for rule in REGEX_RULES]


def get_default_enabled_regex_rules():
    return [rule["name"] for rule in REGEX_RULES]


def parse_enabled_regex_rules(raw):
    default_names = set(get_default_enabled_regex_rules())

    if not raw:
        return default_names

    try:
        data = json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError):
        return default_names

    if not isinstance(data, list):
        return default_names

    submitted = {str(item).strip().upper() for item in data if str(item).strip()}
    valid_names = {rule["name"] for rule in REGEX_RULES}
    enabled = submitted & valid_names

    return enabled if enabled else set()


def parse_selected_finding_ids(raw):
    if not raw:
        return None

    try:
        data = json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError):
        return None

    if not isinstance(data, list):
        return None

    selected = {str(item).strip() for item in data if str(item).strip()}
    return selected


def parse_manual_rules(raw):
    if not raw:
        return []

    try:
        data = json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError):
        return []

    rules = []
    for row in data:
        if not isinstance(row, dict):
            continue

        find = str(row.get("find", "")).strip()
        entity_type = str(row.get("entity_type", "")).strip().upper()
        case_sensitive = bool(row.get("case_sensitive", False))

        if find and entity_type:
            rules.append({
                "find": find,
                "entity_type": entity_type,
                "case_sensitive": case_sensitive
            })

    return rules


def preview(value, limit=60):
    value = value.replace("\r", " ").replace("\n", " ").strip()
    return value if len(value) <= limit else value[:limit] + "..."


def apply_manual_rules(text, rules, findings):
    for idx, rule in enumerate(sorted(rules, key=lambda x: len(x["find"]), reverse=True), start=1):
        flags = 0 if rule["case_sensitive"] else re.IGNORECASE
        pattern = re.compile(re.escape(rule["find"]), flags)

        def repl(match, entity=rule["entity_type"], rid=idx):
            token = f"[{entity}]"
            findings.append({
                "id": f"manual-{rid}-{len(findings) + 1}",
                "entity": entity,
                "match": match.group(0),
                "replacement": token,
                "selected": True,
            })
            return token

        text = pattern.sub(repl, text)
    return text


def collect_spans(text, enabled_regex_rules=None):
    enabled_regex_rules = set(enabled_regex_rules or get_default_enabled_regex_rules())

    spans = []
    for rule in REGEX_RULES:
        if rule["name"] not in enabled_regex_rules:
            continue

        for match in rule["pattern"].finditer(text):
            spans.append({
                "start": match.start(),
                "end": match.end(),
                "entity": rule["name"],
                "text": match.group(0),
            })

    spans.sort(key=lambda s: (s["start"], -(s["end"] - s["start"])))

    selected = []
    last_end = -1
    for span in spans:
        if span["start"] < last_end:
            continue
        selected.append(span)
        last_end = span["end"]

    return selected


def build_regex_findings(text, enabled_regex_rules=None, selected_finding_ids=None):
    spans = collect_spans(text, enabled_regex_rules=enabled_regex_rules)
    findings = []

    selected_ids = parse_selected_finding_ids(selected_finding_ids)
    default_selected = selected_ids is None

    for i, span in enumerate(spans, start=1):
        finding_id = f"regex-{i}"
        findings.append({
            "id": finding_id,
            "entity": span["entity"],
            "match": span["text"],
            "replacement": f"[{span['entity']}]",
            "start": span["start"],
            "end": span["end"],
            "selected": True if default_selected else (finding_id in selected_ids),
        })

    return findings


def apply_selected_regex_findings(text, regex_findings, findings):
    if not regex_findings:
        return text

    out = []
    cursor = 0

    for item in regex_findings:
        if not item["selected"]:
            continue

        out.append(text[cursor:item["start"]])
        out.append(item["replacement"])
        findings.append({
            "id": item["id"],
            "entity": item["entity"],
            "match": item["match"],
            "replacement": item["replacement"],
            "selected": True,
        })
        cursor = item["end"]

    out.append(text[cursor:])
    return "".join(out)


def dedupe_findings(findings):
    seen = set()
    cleaned = []

    for item in findings:
        key = (item["id"], item["entity"], item["match"], item["replacement"])
        if key in seen:
            continue

        seen.add(key)
        cleaned_item = {
            "id": item["id"],
            "entity": item["entity"],
            "match": preview(item["match"]),
            "replacement": item["replacement"],
        }

        if "selected" in item:
            cleaned_item["selected"] = bool(item["selected"])

        cleaned.append(cleaned_item)

    return cleaned


def run_redaction(text, raw_rules, raw_selected_finding_ids=None, raw_enabled_regex_rules=None):
    manual_applied_findings = []
    manual_rules = parse_manual_rules(raw_rules)
    enabled_regex_rules = parse_enabled_regex_rules(raw_enabled_regex_rules)

    text_after_manual = apply_manual_rules(text, manual_rules, manual_applied_findings)
    regex_findings = build_regex_findings(
        text_after_manual,
        enabled_regex_rules=enabled_regex_rules,
        selected_finding_ids=raw_selected_finding_ids,
    )
    redacted = apply_selected_regex_findings(text_after_manual, regex_findings, manual_applied_findings)

    all_findings = manual_applied_findings + regex_findings

    return {
        "redacted_text": redacted,
        "findings": dedupe_findings(all_findings),
        "manual_rules": manual_rules,
        "enabled_regex_rules": sorted(enabled_regex_rules),
        "regex_rules": get_regex_rules_meta(),
    }