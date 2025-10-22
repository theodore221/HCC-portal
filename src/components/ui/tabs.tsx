import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const activeValue = value ?? internalValue;

  const handleChange = React.useCallback(
    (next: string) => {
      onValueChange?.(next);
      if (value === undefined) {
        setInternalValue(next);
      }
    },
    [onValueChange, value]
  );

  return (
    <div className={cn("w-full", className)} {...props}>
      <TabsContext.Provider value={{ value: activeValue, onValueChange: handleChange }}>
        {children}
      </TabsContext.Provider>
    </div>
  );
}

function useTabsContext(component: string) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <Tabs>`);
  }
  return ctx;
}

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-full bg-olive-50 p-1 text-sm font-medium text-olive-600",
      className
    )}
    role="tablist"
    {...props}
  />
));
TabsList.displayName = "TabsList";

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const { value: activeValue, onValueChange } = useTabsContext("TabsTrigger");
    const isActive = activeValue === value;
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center rounded-full px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-500",
          isActive
            ? "bg-white text-olive-900 shadow-soft"
            : "text-olive-600 hover:text-olive-800",
          className
        )}
        aria-selected={isActive}
        role="tab"
        tabIndex={isActive ? 0 : -1}
        onClick={() => onValueChange(value)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: activeValue } = useTabsContext("TabsContent");
    const isHidden = activeValue !== value;
    return (
      <div
        ref={ref}
        hidden={isHidden}
        className={cn("rounded-2xl border border-olive-100 bg-white shadow-soft", className)}
        role="tabpanel"
        aria-hidden={isHidden}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";
