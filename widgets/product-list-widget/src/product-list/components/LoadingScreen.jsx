import React from "react";
import { Loader2 } from "lucide-react";

/**
 * LoadingScreen - Initial loading state for the store
 */
export function LoadingScreen() {
  return (
    <div className="antialiased w-full text-black bg-[#faf9f7] p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto bg-[#f5f4f0] rounded-3xl shadow-sm overflow-hidden">
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#8a8a8a]" />
          <span className="text-[#8a8a8a] text-sm font-light">Loading store...</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
