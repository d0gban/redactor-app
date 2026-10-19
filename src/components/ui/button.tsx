import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent",
    "text-sm font-medium leading-tight transition-colors duration-(--dur-fast) ease-(--ease-standard)",
    "disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    "pointer-coarse:min-h-11"
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border-border-strong bg-secondary text-secondary-foreground hover:bg-accent",
        outline: "border-border-strong bg-card text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:text-foreground"
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-2.5",
        xs: "h-6 px-2 text-xs",
        icon: "size-8 pointer-coarse:min-w-11"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, type = "button", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
