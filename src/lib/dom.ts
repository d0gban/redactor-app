/** Scroll `container` just enough to show `child`, without moving the page. */
export function scrollIntoContainer(container: HTMLElement, child: HTMLElement) {
  const box = container.getBoundingClientRect();
  const rect = child.getBoundingClientRect();
  if (rect.top < box.top) container.scrollTop -= box.top - rect.top + 8;
  else if (rect.bottom > box.bottom) container.scrollTop += rect.bottom - box.bottom + 8;
}
