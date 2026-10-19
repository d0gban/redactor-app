import { Lock, Moon, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/lib/theme";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block min-w-[1.6em] rounded-[4px] border border-b-2 border-border-strong bg-card px-1.5 text-center font-mono text-xs">
      {children}
    </kbd>
  );
}

function HelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          Help
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-2 text-sm font-semibold">How it works</h2>
        <ol className="mb-4 grid list-decimal gap-1.5 pl-5 text-muted-foreground">
          <li>Paste your prompt. Secrets, contact details, IDs and URLs are detected as you type.</li>
          <li>
            Add names, companies or projects under <strong className="text-foreground">Always redact</strong>, or select text and press{" "}
            <strong className="text-foreground">Redact selection</strong>.
          </li>
          <li>Click any token in the safe prompt to keep the original value. Click again to redact it.</li>
          <li>Copy the safe prompt and send it to your AI tool.</li>
          <li>
            Paste the AI&apos;s reply in <strong className="text-foreground">Restore reply</strong> to put the real values back. Click a
            restored value to keep it redacted.
          </li>
        </ol>
        <h2 className="mb-2 text-sm font-semibold">Shortcuts</h2>
        <dl className="mb-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-muted-foreground">
          <dt>
            <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd> + <Kbd>Enter</Kbd>
          </dt>
          <dd>Copy the current result</dd>
          <dt>
            <Kbd>Esc</Kbd>
          </dt>
          <dd>Close this help</dd>
        </dl>
        <p className="text-xs text-subtle">Detection is pattern-based. Always skim the safe prompt before sending it.</p>
      </PopoverContent>
    </Popover>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {/* The icon shows the theme a click switches to. */}
      {theme === "light" ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
    </Button>
  );
}

export function Header({ placeholderCount }: { placeholderCount: number }) {
  return (
    <header className="relative flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="mr-auto flex items-center gap-3">
        <img className="rounded-[7px]" src="/icon/favicon-32x32.png" width={28} height={28} alt="" />
        <div>
          <h1 className="text-lg font-bold tracking-tight">Prompt Redactor</h1>
          <p className="text-sm text-muted-foreground max-lg:hidden">Strip secrets and personal data before you paste into an AI tool.</p>
        </div>
      </div>

      <Badge variant="success" className="max-lg:order-3">
        <Lock className="size-3.5" aria-hidden="true" />
        Runs locally. Nothing leaves your browser.
      </Badge>

      <div className="flex items-center gap-2 max-[560px]:w-full">
        <TabsList aria-label="Mode" className="max-[560px]:flex-1">
          <TabsTrigger value="redact" className="max-[560px]:flex-1">
            <span>
              Redact<span className="max-[560px]:hidden"> prompt</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="restore" className="max-[560px]:flex-1">
            <span>
              Restore<span className="max-[560px]:hidden"> reply</span>
            </span>
            {placeholderCount > 0 ? <Badge variant="solid">{placeholderCount}</Badge> : null}
          </TabsTrigger>
        </TabsList>
        <ThemeToggle />
        <HelpPopover />
      </div>
    </header>
  );
}
