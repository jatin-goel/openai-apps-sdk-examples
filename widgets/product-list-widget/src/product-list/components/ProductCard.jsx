import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Image } from "@openai/apps-sdk-ui/components/Image";

/**
 * ProductCard - Elegant furniture-style product card
 */
export function ProductCard({
  product,
  quantity,
  onAddToCart,
  onRemoveFromCart,
}) {
  const isMaxQuantity = quantity >= product.stockAvailable;

  return (
    <div className="group flex flex-col bg-white rounded-3xl overflow-hidden transition-all duration-300">
      {/* Product Image */}
      <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden rounded-3xl">
        <Image
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      {/* Product Info */}
      <div className="pt-4 flex flex-col">
        <h3 className="font-normal text-gray-900 text-base leading-snug line-clamp-2 mb-2">
          {product.title}
        </h3>
        
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">
          {product.category !== 'Uncategorized' ? product.category : 'Handcrafted curves and natural grain brought together in perfect harmony.'}
        </p>

        <div className="flex items-center justify-between gap-3">
          {/* Price Badge */}
          <div className="bg-amber-50 text-amber-900 px-4 py-2 rounded-full">
            <span className="text-lg font-semibold">₹{product.price}</span>
          </div>

          {/* Add to Bag Button */}
          {quantity === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="flex-1 bg-gray-900 text-white py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 active:scale-95 transition-all"
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
    <p className="text-[10px] text-gray-500 mb-1 truncate uppercase tracking-wider font-medium">
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
    <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
      <button
        aria-label={
          quantity === 1
            ? `Remove ${productTitle} from cart`
            : `Decrease ${productTitle} quantity`
        }
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
        onClick={onRemove}
      >
        {quantity === 1 ? (
          <Trash2 className="w-3.5 h-3.5 text-gray-700" />
        ) : (
          <Minus className="w-3.5 h-3.5 text-gray-700" strokeWidth={2.5} />
        )}
      </button>
      <span className="w-7 text-center font-semibold text-gray-900 text-sm tabular-nums">
        {quantity}
      </span>
      <button
        aria-label={`Increase ${productTitle} quantity`}
        className={`w-8 h-8 flex items-center justify-center transition-colors ${
          isMaxQuantity
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-gray-200 active:bg-gray-300"
        }`}
        onClick={onAdd}
        disabled={isMaxQuantity}
      >
        <Plus className="w-3.5 h-3.5 text-gray-700" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default ProductCard;
