import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center min-h-12 px-5 font-display font-bold text-[13px] tracking-[0.06em] uppercase transition-opacity duration-150 ease-out disabled:opacity-40",
  {
    variants: {
      variant: {
        solid: "bg-fg text-bg hover:opacity-90",
        ghost: "bg-transparent text-fg border-2 border-line hover:bg-fg hover:text-bg",
        spot: "bg-spot text-spot-fg hover:opacity-90",
        heat: "bg-heat text-heat-fg hover:opacity-90",
      },
    },
    defaultVariants: { variant: "solid" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export { buttonVariants };
