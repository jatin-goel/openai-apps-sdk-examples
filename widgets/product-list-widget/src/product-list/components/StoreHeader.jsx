import React from "react";
import { ShoppingBag, Search } from "lucide-react";

/**
 * StoreHeader - Store name and cart indicator
 */
export function StoreHeader({ storeName, query, total, cartItemCount, onCartClick }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
      {/* Store Info */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 truncate">
          {storeName || "Store"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 truncate flex items-center gap-1.5">
          {query ? (
            <>
              <Search className="w-3 h-3" />
              <span><span className="font-medium text-gray-700">{total}</span> results for "{query}"</span>
            </>
          ) : (
            <span><span className="font-medium text-gray-700">{total}</span> products</span>
          )}
        </p>
      </div>
      
      {/* Cart Button */}
      <button 
        onClick={onCartClick}
        className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all duration-150"
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="text-sm font-medium">
          {cartItemCount > 0 ? `${cartItemCount} items` : 'Cart'}
        </span>
      </button>
    </div>
  );
}

export default StoreHeader;
