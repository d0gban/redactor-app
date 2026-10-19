import { Fragment, useState } from "react";

import { HighlightEditor } from "@/components/HighlightEditor";
import { EmptyState, Panel, PanelActions, PanelBody, PanelFooter, PanelHeader, PanelTitle } from "@/components/panel";
import { OutputView, TokenButton, UnknownToken } from "@/components/Tokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHover, type Hover } from "@/hooks/useHover";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import type { Redactor } from "@/hooks/useRedactor";
import { restoreHighlights } from "@/lib/highlights";
import { plural } from "@/lib/text";

const paneHeight = "h-[max(420px,calc(100dvh-220px))]";

interface PaneProps {
  r: Redactor;
  hover: Hover;
  className?: string;
}

function ReplyPanel({ r, hover, onHoverEditor, className }: PaneProps & { onHoverEditor: (index: number | null) => void }) {
  return (
    <Panel className={className} aria-labelledby="reply-title">
      <PanelHeader>
        <PanelTitle step="03" id="reply-title" htmlFor="reply-text">
          AI reply
        </PanelTitle>
        <PanelActions>
          <Button variant="ghost" size="sm" onClick={() => r.setReply("")}>
            Clear
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelBody>
        <HighlightEditor
          id="reply-text"
          value={r.reply}
          onChange={r.setReply}
          segments={restoreHighlights(r.restoreResult)}
          placeholder="Paste the AI's reply that contains tokens like [EMAIL_1]…"
          activeIndex={hover.index}
          onHoverIndex={onHoverEditor}
        />
      </PanelBody>
    </Panel>
  );
}

function RestoredPanel({ r, hover, onHoverToken, className }: PaneProps & { onHoverToken: (index: number | null) => void }) {
  const res = r.restoreResult;
  const restored = res ? res.restored : 0;
  const held = res ? res.held : 0;
  const unknown = res ? res.unknown : [];

  let footer = "";
  if (unknown.length) {
    footer = `${plural(unknown.length, "token")} not found in this session's map: ${unknown.slice(0, 5).join(", ")}${unknown.length > 5 ? "…" : ""}`;
  } else if (restored + held > 0) {
    footer = "Click a value to keep it redacted. Click it again to restore it.";
  }

  return (
    <Panel className={className} aria-labelledby="restored-title">
      <PanelHeader>
        <PanelTitle step="04" id="restored-title">
          Restored reply
        </PanelTitle>
        <PanelActions className="gap-2">
          <Badge>
            {restored.toLocaleString()} restored{held ? ` · ${held.toLocaleString()} redacted` : ""}
          </Badge>
          <Button size="sm" onClick={r.copyRestored} disabled={!res || !res.output}>
            Copy restored
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelBody>
        <OutputView id="restored-view" label="Restored reply text" scrollTo={hover.from === "editor" ? hover.index : null}>
          {res && res.segments.length ? (
            res.segments.map((seg, i) => {
              if (seg.type === "text") return <Fragment key={i}>{seg.text}</Fragment>;
              if (seg.type === "unknown") {
                return <UnknownToken key={i} index={i} text={seg.text} active={hover.index === i} onHoverIndex={onHoverToken} />;
              }
              return (
                <TokenButton
                  key={i}
                  index={i}
                  label={seg.held ? seg.token : seg.text}
                  category={seg.category}
                  kept={seg.held}
                  title={seg.held ? "Kept redacted. Click to restore the original" : `${seg.token}. Click to keep it redacted`}
                  active={hover.index === i}
                  onToggle={() => r.toggleHeld(seg.token)}
                  onHoverIndex={onHoverToken}
                />
              );
            })
          ) : (
            <EmptyState className="absolute inset-0 whitespace-normal">Original values are put back here.</EmptyState>
          )}
        </OutputView>
      </PanelBody>
      {footer ? <PanelFooter className={unknown.length ? "text-warning" : undefined}>{<span>{footer}</span>}</PanelFooter> : null}
    </Panel>
  );
}

export function RestoreView({ r }: { r: Redactor }) {
  const desktop = useIsDesktop();
  const [pane, setPane] = useState("reply");
  const { hover, onEditor, onToken } = useHover();

  const info = (
    <p id="restore-info" className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
      {r.restoreInfo}
    </p>
  );

  if (!desktop) {
    return (
      <div className="flex flex-col gap-3">
        {info}
        <Tabs value={pane} onValueChange={setPane} className="flex flex-col gap-3">
          <TabsList aria-label="Panels" className="flex w-full">
            <TabsTrigger value="reply" className="flex-1">
              AI reply
            </TabsTrigger>
            <TabsTrigger value="restored" className="flex-1">
              Restored
            </TabsTrigger>
          </TabsList>
          <TabsContent value="reply">
            <ReplyPanel r={r} hover={hover} onHoverEditor={onEditor} className={paneHeight} />
          </TabsContent>
          <TabsContent value="restored">
            <RestoredPanel r={r} hover={hover} onHoverToken={onToken} className={paneHeight} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
      {info}
      <div className="flex min-h-0 min-w-0 gap-3">
        <ReplyPanel r={r} hover={hover} onHoverEditor={onEditor} className="flex-1 basis-0" />
        <RestoredPanel r={r} hover={hover} onHoverToken={onToken} className="flex-1 basis-0" />
      </div>
    </div>
  );
}
