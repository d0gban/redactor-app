import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
  {
    variants: {
      variant: {
        default: "border-border text-muted-foreground",
        solid: "border-transparent bg-border-strong text-foreground",
        success: "border-success/35 bg-success/10 text-success"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
