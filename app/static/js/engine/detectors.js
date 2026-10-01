// Detector table and validators. Pure data + functions, no DOM.

export const CATEGORIES = [
  { id: "secrets", label: "Secrets & keys", hint: "API keys, tokens, passwords, private keys, DB URLs", defaultEnabled: true },
  { id: "contact", label: "Contact details", hint: "Emails, phone numbers", defaultEnabled: true },
  { id: "network", label: "URLs & network", hint: "URLs, IP and MAC addresses", defaultEnabled: true },
  { id: "financial", label: "Financial", hint: "Card numbers (Luhn-checked), IBANs", defaultEnabled: true },
  { id: "ids", label: "IDs & numbers", hint: "UUIDs, SG NRIC/FIN/UEN", defaultEnabled: true },
  { id: "infra", label: "Domains & paths", hint: "Hostnames, file paths. Noisy with code, so off by default", defaultEnabled: false }
];

// User-defined "always redact" terms live in their own category.
export const CUSTOM_CATEGORY = { id: "custom", label: "Your terms" };

export function defaultEnabledCategories() {
  return new Set(CATEGORIES.filter((c) => c.defaultEnabled).map((c) => c.id));
}

// File extensions that look like TLDs but are almost always code/filenames in prompts.
const CODE_EXTENSIONS = new Set([
  "js", "mjs", "cjs", "ts", "tsx", "jsx", "py", "pyc", "rb", "go", "rs", "java", "kt", "cs",
  "cpp", "cc", "hpp", "php", "pl", "sh", "ps1", "bat", "cmd", "html", "htm", "css", "scss",
  "less", "json", "yaml", "yml", "toml", "ini", "cfg", "conf", "env", "lock", "md", "txt",
  "csv", "tsv", "xml", "sql", "log", "zip", "gz", "tar", "png", "jpg", "jpeg", "gif", "svg",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "exe", "dll", "so", "bin", "map",
  "vue", "svelte", "swift", "dart", "lua", "rst", "ipynb", "pem", "key", "crt", "id"
]);

export function isValidIPv4(value) {
  const parts = String(value).split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

export function isValidIPv6(value) {
  const s = String(value || "").trim();
  if (!s.includes(":")) return false;
  if ((s.match(/::/g) || []).length > 1) return false;

  const hasDouble = s.includes("::");
  const parts = s.split(":");
  if (!hasDouble && parts.length !== 8) return false;
  if (parts.length > 8) return false;
  if (parts.filter(Boolean).length < 2) return false;

  return parts.every((part) => (part === "" ? hasDouble : /^[0-9A-Fa-f]{1,4}$/.test(part)));
}

export function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export function luhnCheck(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isLikelyPhone(value) {
  const s = String(value);
  const digits = s.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  // Plain digit runs are usually IDs/amounts; phones carry a +, parens or separators.
  if (!/[+()\s-]/.test(s)) return false;
  // ISO / common dates.
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s) || /^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) return false;
  return true;
}

export function isLikelyDomain(value) {
  const labels = String(value).toLowerCase().split(".");
  return !CODE_EXTENSIONS.has(labels[labels.length - 1]);
}

const hasDigit = (value) => /\d/.test(value);
const trimTrailingPunctuation = (value) => value.replace(/[.,;:!?)\]}>'"]+$/, "");

// priority breaks ties when two spans start at the same index with the same length.
// foldCase: values that differ only by case are treated as the same entity.
export const DETECTORS = [
  { entity: "PRIVATE_KEY", category: "secrets", priority: 3, pattern: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----[\s\S]+?-----END (?:[A-Z]+ )?PRIVATE KEY-----/g },
  { entity: "CERTIFICATE", category: "secrets", priority: 3, pattern: /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g },
  { entity: "DB_CONNECTION_STRING", category: "secrets", priority: 3, pattern: /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|mssql|sqlserver|amqps?):\/\/[^\s'"<>]+/g },
  { entity: "BEARER_TOKEN", category: "secrets", priority: 3, pattern: /\b[Bb]earer\s+[A-Za-z0-9\-._~+/]{16,}=*/g },
  { entity: "JWT", category: "secrets", priority: 3, pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { entity: "AWS_ACCESS_KEY", category: "secrets", priority: 3, pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { entity: "ANTHROPIC_KEY", category: "secrets", priority: 4, pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/g },
  { entity: "OPENAI_KEY", category: "secrets", priority: 3, pattern: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}/g },
  { entity: "GOOGLE_API_KEY", category: "secrets", priority: 3, pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { entity: "STRIPE_KEY", category: "secrets", priority: 3, pattern: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}\b/g },
  { entity: "GITHUB_TOKEN", category: "secrets", priority: 3, pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
  { entity: "SLACK_TOKEN", category: "secrets", priority: 3, pattern: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g },
  { entity: "SESSION_ID", category: "secrets", priority: 3, pattern: /\b(?:sess|session|sid)[_=:-][A-Za-z0-9-]{8,}\b/gi, validator: hasDigit },
  // Only the value after `password=`, `api_key: ` etc. is redacted; the key name stays readable.
  { entity: "SECRET", category: "secrets", priority: 3, pattern: /(?<=\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?key|auth[_-]?token|access[_-]?token|client[_-]?secret|private[_-]?key)["']?\s*[:=]\s*["']?)[^\s"',;]{4,}/gi },

  { entity: "EMAIL", category: "contact", priority: 2, foldCase: true, pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { entity: "PHONE", category: "contact", priority: 1, pattern: /(?<![\w+])(?:\+\d{1,3}[ -]?)?(?:\(\d{1,4}\)[ -]?)?\d[\d -]{5,}\d(?!\w)/g, validator: isLikelyPhone },

  { entity: "URL", category: "network", priority: 2, pattern: /\bhttps?:\/\/[^\s<>'"`]+/g, transform: trimTrailingPunctuation },
  { entity: "IPV4", category: "network", priority: 2, pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g, validator: isValidIPv4 },
  { entity: "IPV6", category: "network", priority: 2, foldCase: true, pattern: /(?<![\w:])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?![\w:])/g, validator: isValidIPv6 },
  { entity: "MAC", category: "network", priority: 2, foldCase: true, pattern: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b|\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b/g },

  { entity: "CREDIT_CARD", category: "financial", priority: 2, pattern: /\b(?:\d[ -]?){12,18}\d\b/g, validator: luhnCheck },
  { entity: "IBAN", category: "financial", priority: 2, pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },

  { entity: "UUID", category: "ids", priority: 2, foldCase: true, pattern: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, validator: isValidUUID },
  { entity: "SG_NRIC_FIN", category: "ids", priority: 2, pattern: /\b[STFGM]\d{7}[A-Z]\b/g },
  { entity: "SG_UEN", category: "ids", priority: 1, pattern: /\b(?:\d{8,9}[A-Z]|[TSR]\d{2}[A-Z]{2}\d{4}[A-Z])\b/g },

  { entity: "DOMAIN", category: "infra", priority: 1, foldCase: true, pattern: /\b(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[a-z]{2,63}\b/g, validator: isLikelyDomain },
  { entity: "WINDOWS_PATH", category: "infra", priority: 1, pattern: /\b[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n\s]*/g },
  { entity: "UNIX_PATH", category: "infra", priority: 1, pattern: /(?<![\w:/.~-])~?\/(?:[\w.-]+\/)*[\w.-]+/g }
];
