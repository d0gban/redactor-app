import { useRef, useState } from "react";

import { HighlightEditor } from "@/components/HighlightEditor";
import { Panel, PanelActions, PanelBody, PanelFooter, PanelHeader, PanelTitle } from "@/components/panel";
import { Button } from "@/components/ui/button";
import type { Hover } from "@/hooks/useHover";
import { resolveEntity, type Redactor } from "@/hooks/useRedactor";
import { entityLabel } from "@/lib/entities";
import { plural, preview } from "@/lib/text";
import { toast } from "@/lib/toast";

interface SourcePanelProps {
  r: Redactor;
  hover: Hover;
  onHoverEditor: (index: number | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SourcePanel({ r, hover, onHoverEditor, className, style }: SourcePanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState("");
  const chars = r.source.length;
  const picked = selection.trim();

  const loadSample = () => {
    r.loadSample();
    // The textarea only holds the sample after this render; then park the caret at the top.
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(0, 0);
      textarea.scrollTop = 0;
    });
  };

  const redactSelection = () => {
    if (!picked || !r.addTerm(picked)) return;
    toast(`Added "${preview(picked, 60)}" as ${entityLabel(resolveEntity(r.termForm))}. You can change the type under Always redact.`, { tone: "success" });
  };

  return (
    <Panel className={className} style={style} aria-labelledby="source-title">
      <PanelHeader>
        <PanelTitle step="01" id="source-title" htmlFor="source-text">
          Your prompt
        </PanelTitle>
        <PanelActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={redactSelection}
            disabled={!picked || picked.length > 200}
            title="Select text in your prompt first"
          >
            Redact selection
          </Button>
          <Button variant="ghost" size="sm" onClick={loadSample}>
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              r.setSource("");
              setSelection("");
              textareaRef.current?.focus();
            }}
          >
            Clear
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelBody>
        <HighlightEditor
          ref={textareaRef}
          id="source-text"
          value={r.source}
          onChange={r.setSource}
          segments={r.result && r.resultIsCurrent ? r.result.segments : null}
          placeholder="Paste the prompt you want to send to an AI tool…"
          activeIndex={hover.index}
          onHoverIndex={onHoverEditor}
          onSelectionText={setSelection}
        />
      </PanelBody>
      <PanelFooter>
        <span>{chars ? `${plural(chars, "character")} · ~${plural(Math.ceil(chars / 4), "token")}` : "0 characters"}</span>
        {r.paused ? (
          <span className="inline-flex items-center gap-2 text-warning">
            Large input: live updates paused.
            <Button variant="ghost" size="xs" onClick={r.redactNow}>
              Redact now
            </Button>
          </span>
        ) : null}
      </PanelFooter>
    </Panel>
  );
}
