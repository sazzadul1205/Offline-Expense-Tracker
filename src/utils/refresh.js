// src/utils/refresh.js
import { useEffect } from "react";

// Custom event name
export const DATA_CHANGED_EVENT = "data-changed";

// Function to trigger data refresh across all components
export function notifyDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }
}

// Hook to listen for data changes
export function useDataRefresh(callback) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [callback]);
}
