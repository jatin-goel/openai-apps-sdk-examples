import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Image } from "@openai/apps-sdk-ui/components/Image";

/**
 * ProductCard - Editorial-style product card with minimal aesthetic
 */
export function ProductCard({
  product,
  quantity,
  onAddToCart,
  onRemoveFromCart,
}) {
  const isMaxQuantity = quantity >= product.stockAvailable;

  return (
    <div className="group flex-shrink-0 w-[280px] sm:w-[320px] flex flex-col">
      {/* Product Image - Large square with soft rounded corners */}
      <div className="aspect-square bg-[#e8e6e1] relative overflow-hidden rounded-2xl mb-4">
        <Image
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Stock Badge - subtle */}
        {product.stockAvailable <= 5 && product.stockAvailable > 0 && (
          <span className="absolute top-4 left-4 bg-[#3d3d3d] text-white text-[10px] font-light px-3 py-1.5 rounded-full">
            Only {product.stockAvailable} left
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-3">
        <ProductCategory category={product.category} />
        
        {/* Product name - left-aligned */}
        <h3 className="font-light text-[#3d3d3d] text-base leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        {/* Price as rounded pill/badge */}
        <div className="flex items-center gap-2">
          <span className="inline-block bg-[#3d3d3d] text-white text-sm font-light px-4 py-1.5 rounded-full">
            ₹{product.price}
          </span>
          
          {/* Quantity indicator if in cart */}
          {quantity > 0 && (
            <span className="inline-block bg-[#8a8a8a] text-white text-xs font-light px-3 py-1.5 rounded-full">
              {quantity} in bag
            </span>
          )}
        </div>

        {/* Add to Bag button - solid, earthy/dark CTA */}
        {quantity === 0 ? (
          <button
            className="w-full bg-[#3d3d3d] text-white py-3 rounded-full text-sm font-light hover:bg-[#2a2a2a] active:scale-[0.98] transition-all duration-200"
            onClick={() => onAddToCart(product)}
          >
            Add To Bag
          </button>
        ) : (
          <QuantitySelector
            quantity={quantity}
            isMaxQuantity={isMaxQuantity}
            productTitle={product.title}
            onAdd={() => onAddToCart(product)}
            onRemove={() => onRemoveFromCart(product.id)}
          />
        )}
      </div>
    </div>
  );
}

function ProductCategory({ category }) {
  if (
    !category ||
    category.toLowerCase() === "others" ||
    category.toLowerCase() === "uncategorized"
  ) {
    return null;
  }

  return (
    <p className="text-[10px] text-[#8a8a8a] truncate uppercase tracking-widest font-light">
      {category}
    </p>
  );
}

function QuantitySelector({
  quantity,
  isMaxQuantity,
  productTitle,
  onAdd,
  onRemove,
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        aria-label={
          quantity === 1
            ? `Remove ${productTitle} from cart`
            : `Decrease ${productTitle} quantity`
        }
        className="flex-1 bg-[#e8e6e1] text-[#3d3d3d] py-3 rounded-full text-sm font-light hover:bg-[#ddd9d2] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        onClick={onRemove}
      >
        {quantity === 1 ? (
          <>
            <Trash2 className="w-4 h-4" />
            <span>Remove</span>
          </>
        ) : (
          <>
            <Minus className="w-4 h-4" strokeWidth={1.5} />
            <span>Less</span>
          </>
        )}
      </button>
      
      <button
        aria-label={`Increase ${productTitle} quantity`}
        className={`flex-1 py-3 rounded-full text-sm font-light transition-all duration-200 flex items-center justify-center gap-2 ${
          isMaxQuantity
            ? "bg-[#e8e6e1] text-[#8a8a8a] opacity-50 cursor-not-allowed"
            : "bg-[#3d3d3d] text-white hover:bg-[#2a2a2a] active:scale-[0.98]"
        }`}
        onClick={onAdd}
        disabled={isMaxQuantity}
      >
        <Plus className="w-4 h-4" strokeWidth={1.5} />
        <span>More</span>
      </button>
    </div>
  );
}

export default ProductCard;
