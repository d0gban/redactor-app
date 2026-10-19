export interface Category {
  id: string;
  label: string;
  hint: string;
  defaultEnabled: boolean;
}

export interface Detector {
  entity: string;
  category: string;
  priority?: number;
  foldCase?: boolean;
  pattern: RegExp;
  transform?: (value: string) => string;
  validator?: (value: string) => boolean;
}

export const CATEGORIES: Category[];
export const CUSTOM_CATEGORY: { id: string; label: string };
export const DETECTORS: Detector[];

export function defaultEnabledCategories(): Set<string>;
export function categoryForEntity(entity: string): string;
export function isValidIPv4(value: string): boolean;
export function isValidIPv6(value: string): boolean;
export function isValidUUID(value: string): boolean;
export function luhnCheck(value: string): boolean;
export function isLikelyPhone(value: string): boolean;
export function isLikelyDomain(value: string): boolean;
