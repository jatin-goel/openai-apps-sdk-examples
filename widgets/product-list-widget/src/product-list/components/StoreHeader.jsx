import React from "react";
import { ShoppingBag, Package } from "lucide-react";

/**
 * StoreHeader - Store name and cart indicator
 */
export function StoreHeader({ storeName, query, total, cartItemCount, onCartClick }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 sm:p-6 mb-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/5 rounded-full blur-xl" />
      </div>
      
      <div className="relative flex flex-row items-center gap-4">
        {/* Store Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
            {storeName || "Store"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-400 truncate">
              {query ? (
                <>
                  <span className="text-gray-300 font-medium">{total}</span> results for "<span className="text-white">{query}</span>"
                </>
              ) : (
                <>
                  <span className="text-gray-300 font-medium">{total}</span> products available
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* Cart Badge */}
        <div className="flex-shrink-0">
          <button 
            onClick={onCartClick}
            className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              cartItemCount > 0 
                ? 'bg-white text-gray-900 hover:shadow-lg' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 ? (
              <>
                <span className="font-semibold text-sm">{cartItemCount}</span>
                <span className="hidden sm:inline text-sm font-medium text-gray-600">
                  {cartItemCount === 1 ? 'item' : 'items'}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium">Empty</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoreHeader;

