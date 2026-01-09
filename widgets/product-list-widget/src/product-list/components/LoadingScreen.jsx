import React from "react";
import { Loader2 } from "lucide-react";

/**
 * LoadingScreen - Initial loading state for the store
 */
export function LoadingScreen() {
  return (
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="py-16 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="text-black/60 text-sm">Loading store...</span>
      </div>
    </div>
  );
}

export default LoadingScreen;

