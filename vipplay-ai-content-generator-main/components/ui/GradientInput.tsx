import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface GradientInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const GradientInput = React.forwardRef<
  HTMLInputElement,
  GradientInputProps
>(({ className, label, helperText, error, type = "text", ...props }, ref) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDark ? "text-gray-200" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}
      {helperText && (
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {helperText}
        </p>
      )}
      <input
        type={type}
        className={cn(
          "w-full px-4 py-3.5 rounded-lg font-sans focus:outline-none transition-all duration-200",
          isDark
            ? "bg-white/[0.05] border-2 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:bg-white/[0.08] focus:shadow-[0_0_0_2px_rgba(34,211,238,0.15)]"
            : "bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.15)]",
          error &&
            (isDark
              ? "border-red-500 focus:border-red-500"
              : "border-red-400 focus:border-red-400"),
          className,
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

GradientInput.displayName = "GradientInput";
