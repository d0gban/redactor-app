import { useEffect, useState } from "react";

import { Header } from "@/components/Header";
import { RedactView } from "@/components/RedactView";
import { RestoreView } from "@/components/RestoreView";
import { Toaster } from "@/components/Toaster";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useRedactor } from "@/hooks/useRedactor";

type View = "redact" | "restore";

export default function App() {
  const r = useRedactor();
  const [view, setView] = useState<View>("redact");
  const { copyRestored, copySafePrompt } = r;

  // Ctrl/Cmd+Enter copies whichever result is on screen.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (view === "restore") void copyRestored();
        else void copySafePrompt();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [view, copyRestored, copySafePrompt]);

  return (
    <Tabs
      value={view}
      onValueChange={(value) => setView(value as View)}
      className="mx-auto grid min-h-dvh w-full max-w-[1920px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 px-4 py-3 max-lg:px-3 lg:h-dvh lg:overflow-hidden"
    >
      <Header placeholderCount={r.mapSize} />

      <main className="min-h-0 min-w-0">
        <TabsContent value="redact" className="h-full">
          <RedactView r={r} />
        </TabsContent>
        <TabsContent value="restore" className="h-full">
          <RestoreView r={r} />
        </TabsContent>
      </main>

      <footer className="flex flex-wrap justify-between gap-2 text-xs text-subtle max-lg:justify-center max-lg:text-center">
        <span>
          developed by{" "}
          <a
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            href="https://github.com/d0gban/redactor-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            d0gban
          </a>
        </span>
        <span>Nothing is uploaded or stored. Close the tab to discard everything.</span>
      </footer>

      <Toaster />
    </Tabs>
  );
}
