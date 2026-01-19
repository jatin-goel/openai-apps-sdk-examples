import React from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "./ProductCard.jsx";

/**
 * ProductList - Horizontal scrollable product grid
 */
export function ProductList({
  products,
  isSearching,
  getProductQuantity,
  onAddToCart,
  onRemoveFromCart,
}) {
  if (isSearching) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-black/60">Searching products...</span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-6 text-center text-black/60">No products found.</div>
    );
  }

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantity={getProductQuantity(product.id)}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      ))}
    </div>
  );
}

export default ProductList;
