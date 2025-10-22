import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-olive-100 bg-white p-6 shadow-soft",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-olive-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-olive-700">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-sm font-medium uppercase tracking-wide text-olive-700">
        {title}
      </h3>
      <div className="rounded-xl border border-olive-100 bg-olive-50/60 p-4">
        {children}
      </div>
    </div>
  );
}
