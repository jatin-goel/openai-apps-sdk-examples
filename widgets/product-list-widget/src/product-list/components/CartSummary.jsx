import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@openai/apps-sdk-ui/components/Button";

/**
 * CartSummary - Cart total and checkout button
 */
export function CartSummary({ 
  totalItems, 
  totalPrice, 
  isProcessing, 
  error, 
  onCheckout 
}) {
  return (
    <div className="pt-2 border-t border-black/5">
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Cart Summary</span>
        <span className="text-sm font-medium">₹{totalPrice}</span>
      </div>
      <Button 
        color="primary" 
        variant="solid" 
        size="md" 
        block
        onClick={onCheckout}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <LoadingSpinner />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Pay Now ({totalItems} items)
          </>
        )}
      </Button>
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

