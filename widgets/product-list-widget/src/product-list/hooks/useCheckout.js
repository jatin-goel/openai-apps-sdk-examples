import { useState } from "react";

/**
 * useCheckout - Hook to manage checkout process
 */
export function useCheckout(baseUrl, storeId, cart) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentOverlay, setPaymentOverlay] = useState({ 
    isOpen: false, 
    orderId: null 
  });

  const processCheckout = async () => {
    setIsProcessing(true);
    setError("");
    
    try {
      const lineItems = cart.map(item => ({
        line_item_id: item.id,
        quantity: 1
      }));

      const response = await fetch(`${baseUrl}/api/checkout/proceed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems,
          entityId: storeId,
          notes: {}
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentOverlay({ isOpen: true, orderId: data.order_id });
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const closePaymentOverlay = () => {
    setPaymentOverlay({ isOpen: false, orderId: null });
  };

  return {
    isProcessing,
    error,
    paymentOverlay,
    processCheckout,
    closePaymentOverlay
  };
}

export default useCheckout;

