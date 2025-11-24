// Simple stub for use-toast
import { useState } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const toast = (props: ToastProps) => {
    console.log("Toast:", props);
    // In a real app, this would dispatch to a context
    // For now, we'll just alert for critical errors if needed, or rely on UI updates
    if (props.variant === "destructive") {
      // alert(props.title); // Optional: alert on error
    }
  };

  return { toast };
}
