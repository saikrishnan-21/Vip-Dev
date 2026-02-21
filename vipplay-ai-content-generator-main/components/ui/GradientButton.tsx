import * as React from "react";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const GradientButton = React.forwardRef<
  HTMLButtonElement,
  GradientButtonProps
>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      children,
      disabled,
      ...props
    }: GradientButtonProps,
    ref,
  ) => {
    const baseStyles =
      "relative font-sans font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<"primary" | "accent" | "outline", string> = {
      primary: "btn-gradient text-black dark:text-white", // Black in light mode, white in dark mode
      accent: "bg-accent text-accent-foreground hover:bg-accent/90",
      outline:
        "border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_20px_-5px_hsl(180,100%,45%,0.3)]",
    };

    const sizes: Record<"sm" | "md" | "lg", string> = {
      sm: "px-5 py-2.5 text-sm",
      md: "px-7 py-3.5 text-base",
      lg: "px-10 py-5 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

GradientButton.displayName = "GradientButton";
