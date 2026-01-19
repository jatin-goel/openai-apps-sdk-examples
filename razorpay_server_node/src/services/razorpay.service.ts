import config from "../config/index.js";

// In-memory store for payment status
const paymentStatusStore = new Map<string, {
  status: 'pending' | 'success' | 'failed';
  paymentId?: string;
  amount?: number;
  timestamp: number;
}>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [orderId, data] of paymentStatusStore.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      paymentStatusStore.delete(orderId);
    }
  }
}, 5 * 60 * 1000);

export class RazorpayService {
  /**
   * Mark payment as successful
   */
  markPaymentSuccess(orderId: string, paymentId?: string, amount?: number) {
    paymentStatusStore.set(orderId, {
      status: 'success',
      paymentId,
      amount,
      timestamp: Date.now(),
    });
  }

  /**
   * Check payment status from store
   */
  checkPaymentStatus(orderId: string) {
    return paymentStatusStore.get(orderId);
  }

  /**
   * Parse Razorpay store from URL
   */
  async parseStore(razorpayUrl: string) {
    if (!razorpayUrl) {
      throw new Error("Razorpay store URL is required");
    }

    // Validate URL format
    if (!razorpayUrl.includes("pages.razorpay.com/stores/")) {
      throw new Error("Invalid Razorpay store URL format");
    }

    // Fetch the HTML page
    const response = await fetch(razorpayUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract the window.__REACT_QUERY_STATE__ data
    const scriptMatch = html.match(
      /window\.__REACT_QUERY_STATE__\s*=\s*({.*?});/s,
    );

    if (!scriptMatch || !scriptMatch[1]) {
      throw new Error("No products data found in the page");
    }

    // Parse the JSON data
    const reactQueryState = JSON.parse(scriptMatch[1]);

    // Extract products from the nested structure
    const storeQuery = reactQueryState.queries?.find(
      (q: any) =>
        q.queryKey && q.queryKey[0] && q.queryKey[0].startsWith("store-st_"),
    );

    if (!storeQuery || !storeQuery.state?.data?.store?.products) {
      throw new Error("Products data not found in the expected format");
    }

    const products = storeQuery.state.data.store.products;
    const storeInfo = {
      id: storeQuery.state.data.store.id,
      title: storeQuery.state.data.store.title,
      description: storeQuery.state.data.store.description,
      currency: storeQuery.state.data.store.currency,
      categories: storeQuery.state.data.store.categories,
      merchant: storeQuery.state.data.merchant,
    };

    return {
      store: storeInfo,
      products: products,
      totalProducts: products.length,
    };
  }

  /**
   * Get payment status for an order
   * Checks in-memory store for payment status
   */
  async getPaymentStatus(orderId: string) {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log(`🔍 Checking payment status for order: ${orderId}`);
    
    // Check in-memory store
    const status = this.checkPaymentStatus(orderId);
    console.log(`📦 Store status for ${orderId}:`, status);
    
    if (status && status.status === 'success') {
      console.log(`✅ Returning success for order: ${orderId}`);
      return {
        orderId,
        payments: [],
        count: 1,
        hasCapturedPayment: true,
        capturedPayment: {
          id: status.paymentId || `pay_${orderId}`,
          amount: status.amount || 0,
          status: 'captured',
          captured: true,
        },
      };
    }

    console.log(`❌ No payment found in store for order: ${orderId}`);
    // Return no payment found - widget will keep polling
    return {
      orderId,
      payments: [],
      count: 0,
      hasCapturedPayment: false,
      capturedPayment: null,
    };
  }

  /**
   * Generate Magic Checkout HTML page with embedded script
   */
  generateMagicCheckoutHTML(params: {
    orderId: string;
    name?: string;
    businessName?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    couponCode?: string;
    callbackUrl?: string;
    showCoupons?: string;
    address?: string;
  }): string {
    const {
      orderId,
      businessName: businessNameParam,
      name: nameParam,
      customerName = "Guest Customer",
      customerEmail = "",
      customerPhone = "",
      couponCode = "",
      callbackUrl = "https://example.com/payment-success",
      showCoupons = "true",
      address = "",
    } = params;

    const businessName = businessNameParam || "Store";
    const name = nameParam || `${businessName} - Checkout`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center p-4">
        <!-- Loading indicator while checkout opens -->
        <div id="loading-indicator" class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Opening checkout...</p>
        </div>

        <!-- Payment Status (shown after successful payment) -->
        <div id="payment-status" class="hidden max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div id="status-message" class="text-center"></div>
            </div>

        <!-- Hidden fallback button -->
        <button id="rzp-button1" class="hidden">Pay Now</button>
    </div>

    <script src="https://checkout.razorpay.com/v1/magic-checkout.js"></script>
    <script>
    const orderId = "${orderId}";
    let pollingInterval = null;
    let paymentWindow = null;

    // Razorpay options
    var callbackUrl = "${callbackUrl}" === "https://example.com/payment-success"
        ? window.location.origin + "/payment-success"
        : "${callbackUrl}";

    var options = {
        "key": "${config.razorpay.keyId}",
        "one_click_checkout": true,
        "name": "${businessName}",
        "order_id": orderId,
        "show_coupons": ${showCoupons},
        "callback_url": callbackUrl,
        "redirect": true,
        "handler": function (response) {
            console.log("🎉 Payment handler called!", response);
            console.log("Order ID:", response.razorpay_order_id);
            console.log("Payment ID:", response.razorpay_payment_id);
            
            // Mark payment as successful via SYNCHRONOUS API call
            const apiUrl = window.location.origin + '/api/razorpay/mark-payment-success';
            console.log("Calling API synchronously:", apiUrl);
            
            try {
                // Use synchronous XHR to ensure it completes before window can close
                const xhr = new XMLHttpRequest();
                xhr.open('POST', apiUrl, false); // false = synchronous
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature
                }));
                
                if (xhr.status === 200) {
                    console.log("✅ Payment marked as successful:", xhr.responseText);
                } else {
                    console.error("❌ API returned status:", xhr.status);
                }
            } catch (err) {
                console.error("❌ Failed to mark payment as successful:", err);
            }
            
            // Payment is marked, window can be closed anytime now
            console.log("✅ Payment marked successfully! You can close this window.");
        }
    };

    // Track if payment was successful
    let paymentCompleted = false;
    let paymentResponse = null;
    
    // Store original handler
    const originalHandler = options.handler;
    options.handler = async function(response) {
        paymentCompleted = true;
        paymentResponse = response;
        console.log("💾 Payment response stored for beforeunload");
        if (originalHandler) {
            await originalHandler(response);
        }
    };
    
    var rzp1 = new Razorpay(options);
    
    // Ensure payment is marked even if window closes manually
    window.addEventListener('beforeunload', function(e) {
        if (paymentCompleted && paymentResponse) {
            const apiUrl = window.location.origin + '/api/razorpay/mark-payment-success';
            const data = JSON.stringify({
                orderId: paymentResponse.razorpay_order_id,
                paymentId: paymentResponse.razorpay_payment_id,
                signature: paymentResponse.razorpay_signature
            });
            
            console.log("📤 Window closing, sending payment success...");
            
            // Try sendBeacon first (modern browsers)
            if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' });
                const sent = navigator.sendBeacon(apiUrl, blob);
                console.log("sendBeacon result:", sent);
            }
            
            // Also use synchronous XHR as fallback (blocks until complete)
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', apiUrl, false); // false = synchronous
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(data);
                console.log("✅ Synchronous XHR sent, status:", xhr.status);
            } catch (err) {
                console.error("❌ XHR failed:", err);
            }
        }
    });

    // Function to check payment status
    async function checkPaymentStatus() {
        try {
            const response = await fetch(window.location.origin + '/api/razorpay/payment-status?orderId=' + orderId);
            const data = await response.json();

            if (data.success && data.data.hasCapturedPayment) {
                // Payment captured!
                clearInterval(pollingInterval);
                showPaymentSuccess(data.data.capturedPayment);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking payment status:', error);
            return false;
        }
    }

    // Function to show payment success
    function showPaymentSuccess(payment) {
        const statusDiv = document.getElementById('payment-status');
        const messageDiv = document.getElementById('status-message');
        const loadingDiv = document.getElementById('loading-indicator');

        // Hide loading indicator
        if (loadingDiv) loadingDiv.classList.add('hidden');

        statusDiv.className = 'max-w-md w-full bg-white rounded-lg shadow-lg p-8 bg-green-50 border border-green-200';
        messageDiv.innerHTML = \`
            <div class="text-green-800">
                <svg class="w-16 h-16 mx-auto mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-xl font-bold mb-2">Payment Successful!</h3>
                <p class="text-sm">Payment ID: <span class="font-mono">\${payment.id}</span></p>
                <p class="text-sm">Amount: ₹\${(payment.amount / 100).toFixed(2)}</p>
            </div>
        \`;
        statusDiv.classList.remove('hidden');

        // Hide pay button
        document.getElementById('rzp-button1').classList.add('hidden');

        // Redirect after 3 seconds if callback URL is set
        if ("${callbackUrl}" && "${callbackUrl}" !== "https://example.com/payment-success") {
            setTimeout(() => {
                window.location.href = "${callbackUrl}";
            }, 3000);
        }
    }

    // Start polling when pay button is clicked
    document.getElementById('rzp-button1').onclick = function(e){
        e.preventDefault();
        rzp1.open();

        // Start polling every 2 seconds
        if (!pollingInterval) {
            pollingInterval = setInterval(checkPaymentStatus, 2000);
        }
    };

    // Check payment status on page load (in case user returns)
    checkPaymentStatus();

    // Automatically open Razorpay checkout on page load
    window.addEventListener('load', function() {
        setTimeout(function() {
            rzp1.open();
            // Start polling every 2 seconds
            if (!pollingInterval) {
                pollingInterval = setInterval(checkPaymentStatus, 2000);
            }
        }, 500);
    });
    </script>
</body>
</html>`;
  }

  /**
   * Generate Payment Status HTML page (success or failure)
   */
  generatePaymentStatusHTML(params: {
    isSuccess: boolean;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    errorMessage?: string;
  }): string {
    const { isSuccess, paymentId, orderId, amount, errorMessage } = params;

    if (isSuccess) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-green-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p class="text-gray-600 mb-6">Your order has been placed successfully.</p>

        ${
          amount
            ? `
        <div class="bg-green-50 rounded-lg p-4 mb-6">
            <p class="text-sm text-gray-600">Amount Paid</p>
            <p class="text-3xl font-bold text-green-600">₹${(
              amount / 100
            ).toFixed(2)}</p>
        </div>
        `
            : ""
        }

        <div class="border-t border-gray-100 pt-4 space-y-2">
            ${
              paymentId
                ? `
            <div class="flex justify-between text-sm">
                <span class="text-gray-500">Payment ID</span>
                <span class="font-mono text-gray-900">${paymentId}</span>
            </div>
            `
                : ""
            }
            ${
              orderId
                ? `
            <div class="flex justify-between text-sm">
                <span class="text-gray-500">Order ID</span>
                <span class="font-mono text-gray-900">${orderId}</span>
            </div>
            `
                : ""
            }
        </div>

        <div class="mt-8">
            <p class="text-sm text-gray-500">You will receive a confirmation email shortly.</p>
        </div>

        <button onclick="window.close()" class="mt-6 w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
            Close Window
        </button>
    </div>

    <script>
    console.log('💳 Payment success page loaded');
    console.log('Order ID: ${orderId || ""}');
    console.log('Payment ID: ${paymentId || ""}');
    
    // The payment is already marked as successful on the server side
    // when this page loads (see paymentSuccessPage route)
    // So we just need to notify the parent window
    
    async function notifyParent() {
        if (window.opener && !window.opener.closed) {
            try {
                // Try ChatKit sendAction first
                if (window.opener.chatKit && window.opener.chatKit.sendAction) {
                    await window.opener.chatKit.sendAction({
                        type: 'payment_success',
                        payload: {
                            orderId: '${orderId || ""}',
                            paymentId: '${paymentId || ""}',
                            amount: ${amount || 0}
                        }
                    });
                    console.log('✅ Sent payment success via ChatKit sendAction');
                    return true;
                }
                
                // Fallback to postMessage
                const message = {
                    type: 'PAYMENT_SUCCESS',
                    orderId: '${orderId || ""}',
                    paymentId: '${paymentId || ""}',
                    amount: ${amount || 0}
                };
                window.opener.postMessage(message, '*');
                console.log('✅ Sent payment success via postMessage');
                return true;
            } catch (e) {
                console.error('❌ Failed to notify parent window:', e);
                return false;
            }
        } else {
            console.warn('⚠️ No opener window found or window is closed');
            return false;
        }
    }

    // Send notification multiple times to ensure delivery
    notifyParent();
    setTimeout(notifyParent, 100);
    setTimeout(notifyParent, 500);
    setTimeout(notifyParent, 1000);

    // Auto-close window after 3 seconds
    setTimeout(() => {
        console.log('Auto-closing payment success window');
        window.close();
    }, 3000);
    </script>
</body>
</html>`;
    } else {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-red-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p class="text-gray-600 mb-6">${
          errorMessage || "Unfortunately, your payment could not be processed."
        }</p>

        <div class="bg-red-50 rounded-lg p-4 mb-6">
            <p class="text-sm text-red-700">Please try again or use a different payment method.</p>
        </div>

        ${
          orderId
            ? `
        <div class="border-t border-gray-100 pt-4">
            <div class="flex justify-between text-sm">
                <span class="text-gray-500">Order ID</span>
                <span class="font-mono text-gray-900">${orderId}</span>
            </div>
        </div>
        `
            : ""
        }

        <button onclick="window.close()" class="mt-6 w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors">
            Close Window
        </button>
    </div>
</body>
</html>`;
    }
  }
}

export default RazorpayService;
