import { useSyncExternalStore } from "react";

export type ToastTone = "info" | "success" | "error";
export interface ToastAction {
  label: string;
  onClick: () => void;
}
export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
}

const VISIBLE_MS = 2600;
// Long enough to read the message, find the button and press it.
const ACTION_VISIBLE_MS = 6000;

let current: ToastMessage | null = null;
let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Show one message at a time; a new message replaces the current one. */
export function toast(message: string, { tone = "info", action }: { tone?: ToastTone; action?: ToastAction } = {}) {
  current = { id: ++sequence, message, tone, action };
  emit();
  clearTimeout(timer);
  timer = setTimeout(dismissToast, action ? ACTION_VISIBLE_MS : VISIBLE_MS);
}

export function dismissToast() {
  clearTimeout(timer);
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToast(): ToastMessage | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
