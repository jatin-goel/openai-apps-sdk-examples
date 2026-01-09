import React from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import { Image } from "@openai/apps-sdk-ui/components/Image";

/**
 * ProductCard - Individual product display with add to cart functionality
 */
export function ProductCard({ 
  product, 
  quantity, 
  onAddToCart, 
  onRemoveFromCart 
}) {
  const isMaxQuantity = quantity >= product.stockAvailable;

  return (
    <div className="group flex-shrink-0 w-[200px] sm:w-[220px] flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 snap-start">
      {/* Product Image */}
      <div className="aspect-square bg-white p-4 flex items-center justify-center relative overflow-hidden">
        <Image
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {product.stockAvailable <= 5 && product.stockAvailable > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
            Only {product.stockAvailable} left
          </span>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-3 flex flex-col flex-1 border-t border-gray-100 bg-white">
        <ProductCategory category={product.category} />
        <h3 className="font-medium text-black text-sm leading-snug">
          {product.title}
        </h3>
        <p className="mt-1.5 text-lg font-bold text-black">
          ₹{product.price}
        </p>
        
        {/* Add to Cart Section */}
        <div className="mt-3">
          {quantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              isMaxQuantity={isMaxQuantity}
              productTitle={product.title}
              onAdd={() => onAddToCart(product)}
              onRemove={() => onRemoveFromCart(product.id)}
            />
          ) : (
            <button
              className="w-full bg-black text-white py-2.5 px-3 rounded-lg text-sm font-bold hover:bg-gray-800 active:scale-[0.98] transition-all"
              onClick={() => onAddToCart(product)}
            >
              Add to Bag
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCategory({ category }) {
  if (!category || category.toLowerCase() === 'others' || category.toLowerCase() === 'uncategorized') {
    return null;
  }
  
  return (
    <p className="text-[10px] text-black/60 mb-0.5 truncate uppercase tracking-wide">
      {category}
    </p>
  );
}

function QuantitySelector({ quantity, isMaxQuantity, productTitle, onAdd, onRemove }) {
  return (
    <div className="flex items-center justify-between border-2 border-black rounded-lg">
      <button
        aria-label={`Remove ${productTitle}`}
        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
        onClick={onRemove}
      >
        <MinusCircle strokeWidth={2} className="h-4 w-4 text-black" />
      </button>
      <span className="font-bold text-black text-sm">
        {quantity}
      </span>
      <button
        aria-label={`Add ${productTitle}`}
        className={`w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors ${isMaxQuantity ? 'opacity-30 cursor-not-allowed' : ''}`}
        onClick={onAdd}
        disabled={isMaxQuantity}
      >
        <PlusCircle strokeWidth={2} className="h-4 w-4 text-black" />
      </button>
    </div>
  );
}

export default ProductCard;

