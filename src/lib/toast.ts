import { useSyncExternalStore } from "react";

export type ToastTone = "info" | "success" | "error";
export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

const VISIBLE_MS = 2600;

let current: ToastMessage | null = null;
let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Show one message at a time; a new message replaces the current one. */
export function toast(message: string, { tone = "info" }: { tone?: ToastTone } = {}) {
  current = { id: ++sequence, message, tone };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, VISIBLE_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToast(): ToastMessage | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
