import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "outline" | "neutral" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-olive-100 text-olive-800",
  success: "border-transparent bg-emerald-100 text-emerald-700",
  warning: "border-transparent bg-amber-100 text-amber-700",
  outline: "border border-olive-200 text-olive-700",
  neutral: "border-transparent bg-slate-100 text-slate-700",
  danger: "border-transparent bg-red-100 text-red-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
