import React, { useState } from "react";
import { Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];
  const hasMultipleImages = images.length > 1;

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="group flex-shrink-0 w-[240px] sm:w-[280px] flex flex-col">
      {/* Product Image - Large square with soft rounded corners */}
      <div className="aspect-square bg-[#e8e6e1] relative overflow-hidden rounded-2xl mb-4">
        <Image
          src={images[currentImageIndex]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Stock Badge - subtle */}
        {product.stockAvailable <= 5 && product.stockAvailable > 0 && (
          <span className="absolute top-4 left-4 bg-[#3d3d3d] text-white text-[10px] font-light px-3 py-1.5 rounded-full z-10">
            Only {product.stockAvailable} left
          </span>
        )}

        {/* Image Navigation - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-[#3d3d3d]" strokeWidth={2} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-[#3d3d3d]" strokeWidth={2} />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? "bg-white w-4"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col">
        {/* Title and Price Row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-normal text-[#1a1a1a] leading-tight flex-1">
            {product.title}
          </h3>
          <span className="inline-block bg-[#e8dcc8] text-[#1a1a1a] text-base font-normal px-4 py-1 rounded-full whitespace-nowrap">
            ₹{product.price}
          </span>
        </div>

        {/* Description - Fixed height for consistent card sizing */}
        <div className="h-[2.75rem] mb-4">
          {product.description && (
            <p className="text-sm text-[#666666] leading-relaxed line-clamp-2 overflow-hidden">
              {product.description}
            </p>
          )}
        </div>

        {/* Fixed height container for quantity indicator - maintains consistent spacing */}
        <div className="h-[2rem] mb-3">
          {quantity > 0 && (
            <span className="inline-block bg-[#8a8a8a] text-white text-xs font-light px-3 py-1.5 rounded-full">
              {quantity} in bag
            </span>
          )}
        </div>

        {/* Add to Bag button - solid, earthy/dark CTA */}
        {quantity === 0 ? (
          <button
            className="w-full bg-[#3d3d3d] text-white py-3.5 rounded-xl text-base font-normal hover:bg-[#2a2a2a] active:scale-[0.98] transition-all duration-200"
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
        className="flex-1 bg-[#e8e6e1] text-[#3d3d3d] py-3 rounded-xl text-lg font-light hover:bg-[#ddd9d2] active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
        onClick={onRemove}
      >
        <Minus className="w-5 h-5" strokeWidth={2} />
      </button>
      
      <button
        aria-label={`Increase ${productTitle} quantity`}
        className={`flex-1 py-3 rounded-xl text-lg font-light transition-all duration-200 flex items-center justify-center ${
          isMaxQuantity
            ? "bg-[#e8e6e1] text-[#8a8a8a] opacity-50 cursor-not-allowed"
            : "bg-[#3d3d3d] text-white hover:bg-[#2a2a2a] active:scale-[0.98]"
        }`}
        onClick={onAdd}
        disabled={isMaxQuantity}
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  );
}

export default ProductCard;
