import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-4.5 w-8 shrink-0 items-center rounded-full border border-transparent transition-colors",
        "data-[state=checked]:bg-success data-[state=unchecked]:bg-input disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-3.5 rounded-full bg-background transition-transform data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-[2px]"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
