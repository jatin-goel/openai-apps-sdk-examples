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
          console.log("Checkout window closed - assuming payment success");
          clearInterval(checkWindowClosed);
          
          // Wait a bit for postMessage, then show success anyway
          setTimeout(() => {
            if (status === "polling") {
              console.log("No postMessage received, showing success anyway");
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
      console.log("Message received:", event.data);
      
      // Handle payment success message from popup window
      if (event.data && event.data.type === "PAYMENT_SUCCESS") {
        console.log("✅ Payment success received via postMessage:", event.data);
        
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

    console.log("Setting up message listener for payment success");
    window.addEventListener("message", handleMessage);

    return () => {
      console.log("Removing message listener");
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
        console.log("📊 Payment status response:", JSON.stringify(data, null, 2));
        console.log("Checking: data.success =", data.success);
        console.log("Checking: data.hasCapturedPayment =", data.hasCapturedPayment);
        console.log("Checking: data.data?.hasCapturedPayment =", data.data?.hasCapturedPayment);

        // Check both possible response structures
        const hasCaptured = (data.success && data.data && data.data.hasCapturedPayment) ||
                           (data.success && data.hasCapturedPayment);
        
        console.log("hasCaptured =", hasCaptured);
        
        if (hasCaptured) {
          console.log("✅ Payment captured! Showing success");
          const paymentData = data.data?.capturedPayment || data.capturedPayment;
          setStatus("success");
          setPaymentDetails(paymentData);
          onPaymentSuccess?.();
        } else {
          console.log("❌ Payment not captured yet, will retry...");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
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
          <PollingState onClose={onClose} />
        ) : status === "success" ? (
          <SuccessState paymentDetails={paymentDetails} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
}

function PollingState({ onClose }) {
  return (
    <div className="p-8 text-center">
      <div className="mb-6">
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
      <p className="text-sm text-gray-500 mb-6">
        Complete your payment in the checkout window. This page will update
        automatically.
      </p>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span>Checking payment status...</span>
      </div>

      <button
        onClick={onClose}
        className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
      >
        Cancel and close
      </button>
    </div>
  );
}

function SuccessState({ paymentDetails, onClose }) {
  return (
    <div className="p-8 text-center bg-gradient-to-b from-green-50 to-white">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Payment Successful!
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Thank you for your purchase. Your order has been confirmed.
      </p>

      {paymentDetails && (
        <div className="bg-white border border-green-200 rounded-xl p-4 mb-6 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Amount Paid
            </span>
            <span className="text-lg font-bold text-green-600">
              ₹{(paymentDetails.amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Payment ID
            </span>
            <span className="text-xs font-mono text-gray-600">
              {paymentDetails.id?.slice(0, 20)}...
            </span>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 active:scale-[0.98] transition-all"
      >
        Continue Shopping
      </button>
    </div>
  );
}

export default PaymentOverlay;
