import { useCallback } from "react";
import { toast } from "sonner";

interface ErrorContext {
  scope?: string;
  userId?: string;
  action?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((err: any, ctx?: ErrorContext) => {
    const errorInfo = {
      message: err?.message || String(err),
      stack: err?.stack,
      scope: ctx?.scope,
      userId: ctx?.userId,
      action: ctx?.action,
      timestamp: new Date().toISOString()
    };

    // Log to console for debugging
    console.error("[useErrorHandler]", errorInfo);

    // Show user-friendly toast
    const userMessage = getUserFriendlyMessage(err);
    toast.error(userMessage);

    // TODO: Send to external logging service in production
    // await sendToLoggingService(errorInfo);
  }, []);

  return handleError;
}

function getUserFriendlyMessage(err: any): string {
  const message = err?.message || String(err);
  
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  
  if (message.includes("unauthorized") || message.includes("401")) {
    return "Please log in to continue.";
  }
  
  if (message.includes("rate limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  
  if (message.includes("insufficient")) {
    return "Insufficient funds for this transaction.";
  }
  
  return "Something went wrong. Please try again.";
}