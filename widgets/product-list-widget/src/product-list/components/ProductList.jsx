import React from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "./ProductCard.jsx";

/**
 * ProductList - Grid layout for products
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="text-gray-500">Loading products...</span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">No products found.</div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
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
