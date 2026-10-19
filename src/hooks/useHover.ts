import { useCallback, useState } from "react";

export interface Hover {
  index: number | null;
  /** Which side the pointer is on: tokens scroll into view only when the editor side is hovered. */
  from: "editor" | "token" | null;
}

/** Two-way hover link between highlights in an editor and the tokens in an output pane. */
export function useHover() {
  const [hover, setHover] = useState<Hover>({ index: null, from: null });
  const onEditor = useCallback((index: number | null) => setHover({ index, from: index == null ? null : "editor" }), []);
  const onToken = useCallback((index: number | null) => setHover({ index, from: index == null ? null : "token" }), []);
  return { hover, onEditor, onToken };
}
