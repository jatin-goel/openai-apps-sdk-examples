import React from "react";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Image } from "@openai/apps-sdk-ui/components/Image";

/**
 * CartDrawer - Slide-out panel showing cart items
 */
export function CartDrawer({
  isOpen,
  cart,
  totalItems,
  totalPrice,
  getProductQuantity,
  onClose,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  isProcessing,
}) {
  // Group cart items by product ID
  const groupedItems = cart.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = { ...item, quantity: 0 };
    }
    acc[item.id].quantity += 1;
    return acc;
  }, {});

  const uniqueItems = Object.values(groupedItems);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#3d3d3d]/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#faf9f7] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e0ddd8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3d3d3d] rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-light text-[#3d3d3d] text-xl">Your Bag</h2>
              <p className="text-sm text-[#8a8a8a] font-light">
                {totalItems} {totalItems === 1 ? "piece" : "pieces"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e8e6e1] transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-[#8a8a8a]" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {uniqueItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-[#e8e6e1] rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-[#8a8a8a]" />
              </div>
              <p className="text-[#8a8a8a] font-light">Your bag is empty</p>
              <p className="text-[#8a8a8a] text-sm mt-1 font-light">
                Add pieces to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onAddToCart={onAddToCart}
                  onRemoveFromCart={onRemoveFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with total and checkout */}
        {uniqueItems.length > 0 && (
          <div className="border-t border-[#e0ddd8] p-6 bg-[#f5f4f0]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#8a8a8a] font-light">Subtotal</span>
              <span className="text-2xl font-light text-[#3d3d3d]">
                ₹{totalPrice}
              </span>
            </div>
            <button
              onClick={() => {
                onCheckout();
                onClose();
              }}
              disabled={isProcessing}
              className="w-full bg-[#3d3d3d] text-white py-4 rounded-full font-light text-base flex items-center justify-center gap-2 hover:bg-[#2a2a2a] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <span className="bg-white/20 px-3 py-0.5 rounded-full text-sm">
                    {totalItems} {totalItems === 1 ? "piece" : "pieces"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CartItem({ item, onAddToCart, onRemoveFromCart }) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl">
      {/* Item Image */}
      <div className="w-24 h-24 bg-[#e8e6e1] rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="font-light text-[#3d3d3d] text-sm line-clamp-2 leading-tight">
          {item.title}
        </h3>
        <p className="text-lg font-light text-[#3d3d3d] mt-auto">₹{item.price}</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end justify-between">
        <div className="flex items-center bg-[#e8e6e1] rounded-full overflow-hidden">
          <button
            aria-label={
              item.quantity === 1 ? "Remove from cart" : "Decrease quantity"
            }
            className="w-8 h-8 flex items-center justify-center hover:bg-[#ddd9d2] active:bg-[#d3cfc8] transition-colors"
            onClick={() => onRemoveFromCart(item.id)}
          >
            {item.quantity === 1 ? (
              <Trash2 className="w-3.5 h-3.5 text-[#3d3d3d]" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-[#3d3d3d]" strokeWidth={1.5} />
            )}
          </button>
          <span className="w-7 text-center font-light text-[#3d3d3d] text-sm tabular-nums">
            {item.quantity}
          </span>
          <button
            aria-label="Increase quantity"
            className="w-8 h-8 flex items-center justify-center hover:bg-[#ddd9d2] active:bg-[#d3cfc8] transition-colors"
            onClick={() => onAddToCart(item)}
          >
            <Plus className="w-3.5 h-3.5 text-[#3d3d3d]" strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-sm text-[#8a8a8a] font-light">
          ₹{(item.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default CartDrawer;

