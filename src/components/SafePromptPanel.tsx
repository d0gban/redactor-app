import { Fragment } from "react";

import { Panel, PanelActions, PanelBody, PanelFooter, PanelHeader, PanelTitle, EmptyState } from "@/components/panel";
import { OutputView, TokenButton } from "@/components/Tokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Hover } from "@/hooks/useHover";
import type { Redactor } from "@/hooks/useRedactor";
import { preview } from "@/lib/text";

interface SafePromptPanelProps {
  r: Redactor;
  hover: Hover;
  onHoverToken: (index: number | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SafePromptPanel({ r, hover, onHoverToken, className, style }: SafePromptPanelProps) {
  const { result } = r;
  return (
    <Panel className={className} style={style} aria-labelledby="output-title">
      <PanelHeader>
        <PanelTitle step="02" id="output-title">
          Safe prompt
        </PanelTitle>
        <PanelActions className="gap-2">
          <Badge>{(result ? result.redactedCount : 0).toLocaleString()} redacted</Badge>
          <Button size="sm" onClick={r.copySafePrompt} disabled={!result || !result.output}>
            Copy safe prompt
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelBody>
        <OutputView id="output-view" label="Safe prompt text" scrollTo={hover.from === "editor" ? hover.index : null}>
          {result && result.segments.length ? (
            result.segments.map((seg, i) =>
              seg.type === "text" ? (
                <Fragment key={i}>{seg.text}</Fragment>
              ) : (
                <TokenButton
                  key={i}
                  index={i}
                  label={seg.excluded ? seg.text : seg.token}
                  category={seg.category}
                  kept={seg.excluded}
                  title={
                    seg.excluded
                      ? `Kept as-is. Click to redact as ${seg.token}`
                      : `${preview(seg.text, 120)}. Click to keep the original`
                  }
                  active={hover.index === i}
                  onToggle={() => r.setKept(seg.key, !seg.excluded)}
                  onHoverIndex={onHoverToken}
                />
              )
            )
          ) : (
            <EmptyState className="absolute inset-0 whitespace-normal">Your redacted prompt appears here as you type.</EmptyState>
          )}
        </OutputView>
      </PanelBody>
      <PanelFooter>
        <span>Click a token to keep the original. Click it again to redact it.</span>
      </PanelFooter>
    </Panel>
  );
}
