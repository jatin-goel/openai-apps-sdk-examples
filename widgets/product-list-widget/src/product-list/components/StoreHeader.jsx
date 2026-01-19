import React from "react";
import { Search } from "lucide-react";

/**
 * StoreHeader - Elegant store header with logo and search
 */
export function StoreHeader({ storeName, query, total, cartItemCount, onCartClick }) {
  return (
    <div className="py-6 border-b border-gray-200">
      {/* Store Logo/Name */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">
          <span className="font-normal">{storeName?.split(' ')[0] || "alder"}</span>
          {storeName?.split(' ')[1] && (
            <>
              <span className="text-amber-600 mx-1">&</span>
              <span className="font-normal">{storeName.split(' ')[1]}</span>
            </>
          )}
        </h1>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for products..."
          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
          defaultValue={query}
          readOnly
        />
      </div>
    </div>
  );
}

export default StoreHeader;
