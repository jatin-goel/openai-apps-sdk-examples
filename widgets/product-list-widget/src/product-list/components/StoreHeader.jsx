import React from "react";
import { ShoppingCart } from "lucide-react";

/**
 * StoreHeader - Store name and cart indicator
 */
export function StoreHeader({ storeName, query, total, cartItemCount }) {
  return (
    <div className="flex flex-row items-center gap-4 sm:gap-4 border-b border-black/5 py-4">
      <div className="flex-1">
        <div className="text-base sm:text-xl font-medium">
          {storeName || "Store"}
        </div>
        <div className="text-sm text-black/60">
          {query ? `${total} products found for "${query}"` : `${total} products`}
        </div>
      </div>
      {cartItemCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <ShoppingCart className="h-4 w-4" />
          <span className="font-medium">{cartItemCount} items</span>
        </div>
      )}
    </div>
  );
}

export default StoreHeader;

