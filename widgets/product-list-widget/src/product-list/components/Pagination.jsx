import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination - Minimal previous/next controls
 */
export function Pagination({ skip, limit, total, onPrevious, onNext }) {
  if (total <= limit) {
    return null;
  }

  const start = skip + 1;
  const end = Math.min(skip + limit, total);
  const hasPrevious = skip > 0;
  const hasNext = skip + limit < total;

  return (
    <div className="flex items-center justify-between">
      <button
        disabled={!hasPrevious}
        onClick={onPrevious}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-light transition-all duration-200 ${
          hasPrevious
            ? "bg-[#3d3d3d] text-white hover:bg-[#2a2a2a] active:scale-[0.98]"
            : "bg-[#e8e6e1] text-[#8a8a8a] cursor-not-allowed"
        }`}
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        <span>Previous</span>
      </button>
      
      <span className="text-sm text-[#8a8a8a] font-light">
        {start}–{end} of {total}
      </span>
      
      <button
        disabled={!hasNext}
        onClick={onNext}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-light transition-all duration-200 ${
          hasNext
            ? "bg-[#3d3d3d] text-white hover:bg-[#2a2a2a] active:scale-[0.98]"
            : "bg-[#e8e6e1] text-[#8a8a8a] cursor-not-allowed"
        }`}
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default Pagination;
