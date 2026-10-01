// Tabs (mode + mobile panes) and the resizable splitter.
import { $$ } from "./dom.js";

/** Accessible tablist: click or arrow keys select; `onSelect(tab)` applies the change. */
export function initTablist(tablist, onSelect) {
  const tabs = () => $$('[role="tab"]', tablist);

  function select(tab, focus = false) {
    tabs().forEach((t) => {
      const active = t === tab;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });
    if (focus) tab.focus();
    onSelect(tab);
  }

  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });

  tablist.addEventListener("keydown", (event) => {
    const list = tabs();
    const i = list.indexOf(document.activeElement);
    if (i === -1) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(list[(next + list.length) % list.length], true);
  });

  return { select };
}

/** Pane tabs used below the desktop breakpoint: sets `data-pane` on the view. */
export function initPaneTabs(view) {
  const tablist = view.querySelector(".pane-tabs");
  const api = initTablist(tablist, (tab) => {
    view.dataset.pane = tab.dataset.paneTarget;
  });
  return {
    show(pane) {
      const tab = tablist.querySelector(`[data-pane-target="${pane}"]`);
      if (tab) api.select(tab);
    }
  };
}

/** Vertical splitter between two flex panes; stores the left share in `--split` (25–75). */
export function initSplitter(splitter, container) {
  const MIN = 25;
  const MAX = 75;
  let value = 50;

  function set(next) {
    value = Math.round(Math.min(MAX, Math.max(MIN, next)));
    container.style.setProperty("--split", String(value));
    splitter.setAttribute("aria-valuenow", String(value));
  }

  splitter.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing");
    const rect = container.getBoundingClientRect();

    const move = (e) => set(((e.clientX - rect.left) / rect.width) * 100);
    const stop = () => {
      document.body.classList.remove("is-resizing");
      splitter.removeEventListener("pointermove", move);
      splitter.removeEventListener("pointerup", stop);
      splitter.removeEventListener("pointercancel", stop);
    };
    splitter.addEventListener("pointermove", move);
    splitter.addEventListener("pointerup", stop);
    splitter.addEventListener("pointercancel", stop);
  });

  splitter.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 10 : 2;
    const next = { ArrowLeft: value - step, ArrowRight: value + step, Home: MIN, End: MAX }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    set(next);
  });

  splitter.addEventListener("dblclick", () => set(50));
  set(value);
}
