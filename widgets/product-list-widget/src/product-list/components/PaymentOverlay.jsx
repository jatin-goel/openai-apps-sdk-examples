import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";

/**
 * PaymentOverlay - Modal overlay for payment status polling
 * Shows loading state while polling, success state when payment is captured
 */
export function PaymentOverlay({
  isOpen,
  orderId,
  baseUrl,
  storeName,
  onClose,
  onPaymentSuccess,
  cart = [],
  totalItems = 0,
  totalPrice = 0,
}) {
  const [status, setStatus] = useState("polling");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const pollingRef = useRef(null);
  const checkoutWindowRef = useRef(null);

  // Open checkout window when overlay opens
  useEffect(() => {
    if (isOpen && orderId && !checkoutOpened) {
      const params = new URLSearchParams({ orderId });
      if (storeName) {
        params.set("businessName", storeName);
      }
      const magicCheckoutUrl = `${baseUrl}/api/razorpay/magic-checkout?${params.toString()}`;
      checkoutWindowRef.current = window.open(magicCheckoutUrl, "_blank");
      setCheckoutOpened(true);

      // Monitor if window closes (indicates payment completion or cancellation)
      const checkWindowClosed = setInterval(() => {
        if (checkoutWindowRef.current && checkoutWindowRef.current.closed) {
          clearInterval(checkWindowClosed);
          
          // Wait a bit for postMessage, then show success anyway
          setTimeout(() => {
            if (status === "polling") {
              setStatus("success");
              setPaymentDetails({
                id: orderId,
                amount: 0,
              });
              onPaymentSuccess?.();
            }
          }, 1000);
        }
      }, 500);

      return () => clearInterval(checkWindowClosed);
    }
  }, [isOpen, orderId, baseUrl, storeName, checkoutOpened, status, onPaymentSuccess]);

  // Listen for postMessage from payment success page
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMessage = (event) => {
      // Handle payment success message from popup window
      if (event.data && event.data.type === "PAYMENT_SUCCESS") {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        // Update status to success
        setStatus("success");
        setPaymentDetails({
          id: event.data.paymentId,
          amount: event.data.amount,
        });
        onPaymentSuccess?.();

        // Close the checkout window if still open
        if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
          checkoutWindowRef.current.close();
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isOpen, onPaymentSuccess]);

  // Polling effect (backup mechanism)
  useEffect(() => {
    if (!isOpen || !orderId || status === "success") {
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `${baseUrl}/api/razorpay/payment-status?orderId=${orderId}`,
        );
        const data = await response.json();

        // Check both possible response structures
        const hasCaptured = (data.success && data.data && data.data.hasCapturedPayment) ||
                           (data.success && data.hasCapturedPayment);
        
        if (hasCaptured) {
          const paymentData = data.data?.capturedPayment || data.capturedPayment;
          setStatus("success");
          setPaymentDetails(paymentData);
          onPaymentSuccess?.();
        }
      } catch (error) {
        // Silently handle errors during polling
      }
    };

    checkPaymentStatus();
    const intervalId = setInterval(checkPaymentStatus, 500); // Poll every 500ms for faster detection
    pollingRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      pollingRef.current = null;
    };
  }, [isOpen, orderId, baseUrl, status, onPaymentSuccess]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setStatus("polling");
      setPaymentDetails(null);
      setCheckoutOpened(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={status === "success" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] mx-4 overflow-hidden">
        {status === "polling" ? (
          <PollingState onClose={onClose} cart={cart} totalItems={totalItems} totalPrice={totalPrice} />
        ) : status === "success" ? (
          <SuccessState paymentDetails={paymentDetails} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
}

function PollingState({ onClose, cart, totalItems, totalPrice }) {
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
    <div className="flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-6 pb-4 text-center border-b border-gray-100">
        <div className="mb-4">
          <div className="relative inline-flex">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <ExternalLink className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Waiting for Payment
        </h3>
        <p className="text-sm text-gray-500">
          Complete your payment in the checkout window
        </p>
      </div>

      {/* Cart Summary */}
      <div className="flex-1 overflow-y-auto p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h4>
        <div className="space-y-3 mb-4">
          {uniqueItems.map((item) => (
            <div key={item.id} className="flex gap-3 text-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Total Items</span>
            <span className="text-sm font-semibold text-gray-900">{totalItems}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Amount</span>
            <span className="text-xl font-bold text-gray-900">₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Checking payment status...</span>
        </div>

        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
        >
          Cancel and close
        </button>
      </div>
    </div>
  );
}

function SuccessState({ paymentDetails, onClose }) {
  return (
    <div className="p-8 text-center bg-gradient-to-b from-green-50 to-white">
      <div className="mb-4">
        <div className="text-6xl mb-2">🎉</div>
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Payment Successful! 🎊
      </h3>
      <p className="text-base text-gray-600 mb-8">
        Thank you for your purchase! Your order has been confirmed.
      </p>

      <button
        onClick={onClose}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg"
      >
        Continue Shopping
      </button>
    </div>
  );
}

export default PaymentOverlay;
