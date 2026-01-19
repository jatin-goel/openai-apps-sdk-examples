import React from "react";
import { ShoppingBag } from "lucide-react";

/**
 * CartSummary - Minimal cart total and checkout button
 */
export function CartSummary({
  totalItems,
  totalPrice,
  isProcessing,
  error,
  onCheckout,
  onOpenCart,
}) {
  return (
    <div className="bg-white rounded-2xl p-6">
      {error && (
        <div className="mb-4 text-sm text-[#8a4a4a] bg-[#fef5f5] px-4 py-3 rounded-xl border border-[#f5d5d5]">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-light text-[#8a8a8a]">Your bag</span>
        <span className="text-lg font-light text-[#3d3d3d]">₹{totalPrice}</span>
      </div>
      <button
        onClick={() => {
          if (onOpenCart) {
            onOpenCart();
          } else {
            onCheckout();
          }
        }}
        disabled={isProcessing}
        className={`w-full py-3.5 rounded-full text-sm font-light flex items-center justify-center gap-2 transition-all duration-200 ${
          isProcessing
            ? "bg-[#e8e6e1] text-[#8a8a8a] cursor-not-allowed"
            : "bg-[#3d3d3d] text-white hover:bg-[#2a2a2a] active:scale-[0.98]"
        }`}
      >
        {isProcessing ? (
          <>
            <LoadingSpinner />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            <span>Checkout ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
          </>
        )}
      </button>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 mr-2"
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

export default CartSummary;
