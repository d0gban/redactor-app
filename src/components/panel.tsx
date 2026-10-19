// The one panel anatomy every pane in the app is built from: header (step, title, actions), body, footer.
import * as React from "react";

import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="panel"
      className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border bg-card shadow-panel", className)}
      {...props}
    />
  );
}

export function PanelHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="panel-header"
      className={cn("flex min-h-12 flex-wrap items-center justify-between gap-2 border-b py-2 pr-2 pl-4", className)}
      {...props}
    />
  );
}

interface PanelTitleProps {
  /** Position in the redact → ask AI → restore flow, shown as a small mono numeral. */
  step?: string;
  id?: string;
  /** When set, the title is the visible label of that form control. */
  htmlFor?: string;
  children: React.ReactNode;
}

export function PanelTitle({ step, id, htmlFor, children }: PanelTitleProps) {
  return (
    <h2 data-slot="panel-title" className="flex items-baseline gap-2 text-md font-semibold">
      {step ? (
        <span aria-hidden="true" className="font-mono text-2xs font-normal text-subtle tabular-nums">
          {step}
        </span>
      ) : null}
      {htmlFor ? (
        <label id={id} htmlFor={htmlFor} className="cursor-text">
          {children}
        </label>
      ) : (
        <span id={id}>{children}</span>
      )}
    </h2>
  );
}

export function PanelActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="panel-actions" className={cn("flex flex-wrap items-center gap-1", className)} {...props} />;
}

export function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="panel-body" className={cn("relative min-h-0 flex-1", className)} {...props} />;
}

export function PanelFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="panel-footer"
      className={cn(
        "flex min-h-[34px] flex-wrap items-center justify-between gap-2 border-t px-4 py-1.5 text-xs text-subtle tabular-nums",
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("grid place-items-center p-5 text-center font-sans text-subtle", className)} {...props} />;
}
