import React from "react";
import { Button } from "@openai/apps-sdk-ui/components/Button";

/**
 * Pagination - Previous/Next controls with page info
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
    <div className="flex gap-2">
      <Button
        color="secondary"
        variant="outline"
        size="sm"
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        Previous
      </Button>
      <Button
        color="secondary"
        variant="outline"
        size="sm"
        disabled={!hasNext}
        onClick={onNext}
      >
        Next
      </Button>
      <span className="text-sm text-black/60 self-center ml-2">
        {start}-{end} of {total}
      </span>
    </div>
  );
}

export default Pagination;
