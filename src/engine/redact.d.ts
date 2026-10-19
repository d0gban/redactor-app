export interface Term {
  value: string;
  entity?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

export interface Span {
  start: number;
  end: number;
  value: string;
  entity: string;
  category: string;
  priority: number;
  key: string;
}

export interface TextSegment {
  type: "text";
  text: string;
}

export interface RedactedSpan {
  type: "span";
  /** The original value. */
  text: string;
  token: string;
  key: string;
  entity: string;
  category: string;
  /** True when the user chose to keep the original instead of redacting it. */
  excluded: boolean;
}

export type RedactSegment = TextSegment | RedactedSpan;

export interface Finding {
  key: string;
  entity: string;
  category: string;
  value: string;
  token: string;
  count: number;
  excluded: boolean;
}

export interface RedactOptions {
  terms?: Term[];
  enabledCategories?: Set<string>;
  excluded?: Set<string>;
}

export interface RedactResult {
  output: string;
  segments: RedactSegment[];
  findings: Finding[];
  tokenMap: Map<string, string>;
  redactedCount: number;
}

export interface RestoredSegment {
  type: "restored";
  /** The original value the token stood for. */
  text: string;
  token: string;
  category: string;
  /** True when the user chose to leave this token redacted in the output. */
  held: boolean;
}

export interface UnknownSegment {
  type: "unknown";
  text: string;
}

export type RestoreSegment = TextSegment | RestoredSegment | UnknownSegment;

export interface RestoreResult {
  output: string;
  segments: RestoreSegment[];
  restored: number;
  held: number;
  unknown: string[];
}

export function normalizeEntity(raw: unknown): string;
export function detect(text: string, options?: Pick<RedactOptions, "terms" | "enabledCategories">): Span[];
export function resolveOverlaps(spans: Span[]): Span[];
export function redact(text: string, options?: RedactOptions): RedactResult;
export function restore(text: string, tokenMap: Map<string, string>, options?: { keep?: Set<string> }): RestoreResult;
