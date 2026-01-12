import React from "react";
import { ShoppingBag, Sparkles } from "lucide-react";

/**
 * StoreHeader - Store name and cart indicator
 */
export function StoreHeader({ storeName, query, total, cartItemCount, onCartClick }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-4 sm:p-5 mb-4 shadow-lg shadow-purple-500/20">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl -translate-x-6 translate-y-6" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      <div className="relative flex items-center justify-between gap-3">
        {/* Store Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {storeName || "Store"}
            </h1>
            <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-white/70 mt-0.5 truncate">
            {query ? (
              <>
                <span className="text-white font-medium">{total}</span> results for "<span className="text-white/90">{query}</span>"
              </>
            ) : (
              <>
                <span className="text-white font-medium">{total}</span> products available
              </>
            )}
          </p>
        </div>
        
        {/* Cart Button */}
        <button 
          onClick={onCartClick}
          className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
            cartItemCount > 0 
              ? 'bg-white text-purple-700 shadow-lg shadow-black/10' 
              : 'bg-white/15 text-white/80 hover:bg-white/25 backdrop-blur-sm'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </div>
          {cartItemCount > 0 ? (
            <span className="hidden sm:inline text-sm font-semibold">Cart</span>
          ) : (
            <span className="text-xs sm:text-sm font-medium">Cart</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default StoreHeader;
