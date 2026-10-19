import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Pure-engine tests run in the node environment and have no window to prepare.
if (typeof window !== "undefined") {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  // jsdom has no layout engine; stub the browser APIs the UI and Radix touch.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);

  window.matchMedia = (query: string) =>
    ({
      media: query,
      // Desktop by default so every pane is rendered; tests override this for mobile.
      matches: !query.includes("max-width"),
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    }) as MediaQueryList;

  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
