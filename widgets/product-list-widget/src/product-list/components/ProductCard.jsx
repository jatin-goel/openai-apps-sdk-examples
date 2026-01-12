import React from "react";
import { Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
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
    <div className="group flex-shrink-0 w-[200px] sm:w-[220px] flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 snap-start">
      {/* Product Image */}
      <div className="aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        <Image
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        
        {/* Stock Badge */}
        {product.stockAvailable <= 5 && product.stockAvailable > 0 && (
          <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-md">
            Only {product.stockAvailable} left
          </span>
        )}

        {/* Quick Add Overlay - shows on hover when not in cart */}
        {quantity === 0 && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
            <button
              className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg hover:bg-gray-900 active:scale-95 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
              onClick={() => onAddToCart(product)}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Add to Bag
            </button>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <ProductCategory category={product.category} />
        <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>
        
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <p className="text-xl font-bold text-gray-900">
            ₹{product.price}
          </p>
          
          {/* Quantity Controls */}
          {quantity > 0 && (
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
  if (!category || category.toLowerCase() === 'others' || category.toLowerCase() === 'uncategorized') {
    return null;
  }
  
  return (
    <p className="text-[10px] text-gray-500 mb-1 truncate uppercase tracking-wider font-medium">
      {category}
    </p>
  );
}

function QuantitySelector({ quantity, isMaxQuantity, productTitle, onAdd, onRemove }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
      <button
        aria-label={quantity === 1 ? `Remove ${productTitle} from cart` : `Decrease ${productTitle} quantity`}
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
            ? 'opacity-40 cursor-not-allowed' 
            : 'hover:bg-gray-200 active:bg-gray-300'
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

