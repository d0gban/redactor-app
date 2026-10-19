import { useRef, useState } from "react";

import { ReviewPanel } from "@/components/ReviewPanel";
import { SafePromptPanel } from "@/components/SafePromptPanel";
import { SourcePanel } from "@/components/SourcePanel";
import { Splitter } from "@/components/Splitter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHover } from "@/hooks/useHover";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import type { Redactor } from "@/hooks/useRedactor";

// One pane at a time below the desktop breakpoint.
const paneHeight = "h-[max(420px,calc(100dvh-220px))]";

export function RedactView({ r }: { r: Redactor }) {
  const desktop = useIsDesktop();
  const [pane, setPane] = useState("source");
  const [split, setSplit] = useState(50);
  const { hover, onEditor, onToken } = useHover();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const findings = r.result ? r.result.findings.length : 0;

  if (!desktop) {
    return (
      <Tabs value={pane} onValueChange={setPane} className="flex flex-col gap-3">
        <TabsList aria-label="Panels" className="flex w-full">
          <TabsTrigger value="source" className="flex-1">
            Prompt
          </TabsTrigger>
          <TabsTrigger value="review" className="flex-1">
            Review <span className="text-subtle tabular-nums">{findings}</span>
          </TabsTrigger>
          <TabsTrigger value="output" className="flex-1">
            Safe prompt
          </TabsTrigger>
        </TabsList>
        <TabsContent value="source">
          <SourcePanel r={r} hover={hover} onHoverEditor={onEditor} className={paneHeight} />
        </TabsContent>
        <TabsContent value="review">
          <ReviewPanel r={r} className="h-auto" />
        </TabsContent>
        <TabsContent value="output">
          <SafePromptPanel r={r} hover={hover} onHoverToken={onToken} className={paneHeight} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-rows-[minmax(0,1fr)_minmax(0,38%)] xl:grid-cols-[minmax(0,1fr)_var(--sidebar-w)] xl:grid-rows-[minmax(0,1fr)]">
      <div ref={workspaceRef} className="flex min-h-0 min-w-0">
        <SourcePanel r={r} hover={hover} onHoverEditor={onEditor} style={{ flex: `${split} 1 0px` }} />
        <Splitter value={split} onChange={setSplit} containerRef={workspaceRef} label="Resize prompt and safe prompt panels" />
        <SafePromptPanel r={r} hover={hover} onHoverToken={onToken} style={{ flex: `${100 - split} 1 0px` }} />
      </div>
      <ReviewPanel r={r} />
    </div>
  );
}
