import React from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@openai/apps-sdk-ui/components/Button";

/**
 * SearchBar - Product search input with button
 */
export function SearchBar({
  searchInput,
  isSearching,
  onSearchInputChange,
  onSearch,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="py-3 border-b border-black/5">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search for products..."
            className="w-full pl-10 pr-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Button
          color="primary"
          variant="solid"
          size="md"
          type="submit"
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>
    </div>
  );
}

export default SearchBar;
