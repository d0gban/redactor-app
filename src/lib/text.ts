/** Collapse whitespace and cut to `limit` characters for one-line display. */
export function preview(value: string, limit = 80): string {
  const flat = String(value || "").replace(/\s+/g, " ").trim();
  return flat.length <= limit ? flat : `${flat.slice(0, limit - 1)}…`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}
