import React from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "./ProductCard.jsx";

/**
 * ProductList - Horizontal scrollable product strip (editorial style)
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
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#8a8a8a]" />
        <span className="text-[#8a8a8a] font-light text-sm">Searching pieces...</span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-[#8a8a8a] font-light">No pieces found.</div>
    );
  }

  return (
    <div
      className="flex gap-6 overflow-x-auto pb-2 pr-6 sm:pr-10"
      style={{ 
        scrollbarWidth: "none", 
        msOverflowStyle: "none",
        scrollBehavior: "smooth"
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
