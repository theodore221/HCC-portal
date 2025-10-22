import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-olive-600 text-white hover:bg-olive-700 focus-visible:ring-olive-600",
  ghost: "bg-transparent hover:bg-olive-50 text-olive-700 focus-visible:ring-olive-400",
  outline:
    "border border-olive-200 bg-white hover:bg-olive-50 text-olive-700 focus-visible:ring-olive-400",
};

export const buttonStyles = (variant: ButtonVariant = "primary", className?: string) =>
  cn(baseClasses, variantClasses[variant], className);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return <button ref={ref} className={buttonStyles(variant, className)} {...props} />;
  }
);

Button.displayName = "Button";
