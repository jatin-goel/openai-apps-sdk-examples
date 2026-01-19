import React from "react";
import { Search, ShoppingBag } from "lucide-react";

/**
 * SearchBar - Minimal search input with integrated cart button
 */
export function SearchBar({
  searchInput,
  isSearching,
  onSearchInputChange,
  onSearch,
  cartItemCount,
  onCartClick,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Search for products..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#e0ddd8] rounded-full focus:outline-none focus:border-[#3d3d3d] text-sm font-light text-[#3d3d3d] placeholder:text-[#8a8a8a] transition-colors"
        />
      </div>
      
      {/* Cart button */}
      <button 
        type="button"
        onClick={onCartClick}
        className="relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3d3d3d] text-white hover:bg-[#2a2a2a] active:scale-[0.98] transition-all duration-200"
      >
        <ShoppingBag className="w-4 h-4" />
        {cartItemCount > 0 && (
          <span className="text-sm font-light">
            {cartItemCount}
          </span>
        )}
      </button>
    </form>
  );
}

export default SearchBar;
