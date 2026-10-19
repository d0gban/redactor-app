import * as React from "react";

import { cn } from "@/lib/utils";

/** 16px on touch devices: iOS Safari zooms into any field set smaller. */
const fieldClasses =
  "h-9 w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-sm placeholder:text-subtle disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:text-base";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" type={type} className={cn(fieldClasses, className)} {...props} />;
}

/** A native <select> (best on mobile) dressed like Input, with our own chevron. */
function NativeSelect({
  className,
  containerClassName,
  children,
  ...props
}: React.ComponentProps<"select"> & { containerClassName?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0", containerClassName)}>
      <select
        data-slot="native-select"
        className={cn(fieldClasses, "appearance-none pr-7", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </span>
  );
}

export { Input, NativeSelect };
