import Razorpay from "razorpay";
import crypto from "node:crypto";
import config from "../config/index.js";

export class RazorpayService {
  private razorpay: Razorpay | null = null;

  initRazorpay() {
    if (!this.razorpay) {
      this.razorpay = new Razorpay({
        key_id: config.razorpay.keyId || '',
        key_secret: config.razorpay.keySecret || '',
      });
    }
    return this.razorpay;
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    const keySecret = config.razorpay.keySecret || '';
    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", keySecret)
      .update(sign)
      .digest("hex");

    return expectedSign === razorpaySignature;
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
    const scriptMatch = html.match(/window\.__REACT_QUERY_STATE__\s*=\s*({.*?});/s);
    
    if (!scriptMatch || !scriptMatch[1]) {
      throw new Error("No products data found in the page");
    }

    // Parse the JSON data
    const reactQueryState = JSON.parse(scriptMatch[1]);
    
    // Extract products from the nested structure
    const storeQuery = reactQueryState.queries?.find((q: any) => 
      q.queryKey && q.queryKey[0] && q.queryKey[0].startsWith('store-st_')
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
      merchant: storeQuery.state.data.merchant
    };

    return {
      store: storeInfo,
      products: products,
      totalProducts: products.length
    };
  }

  /**
   * Create Magic Checkout order
   */
  async createMagicCheckout(products: any[], customer: any, callbacks: any) {
    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error("Products array is required");
    }

    // Calculate totals
    const lineItemsTotal = products.reduce((sum: number, p: any) => 
      sum + (p.selling_price * (p.quantity || 1)), 0
    );

    // Format line items for Razorpay
    const lineItems = products.map((p: any) => ({
      sku: p.id || p.sku || "default-sku",
      variant_id: p.variant_id || p.id || "",
      price: p.selling_price,
      offer_price: p.discounted_price || p.selling_price,
      tax_amount: p.tax_amount || 0,
      quantity: p.quantity || 1,
      name: p.name,
      description: p.description || p.name,
      image_url: p.images && p.images[0] ? p.images[0] : "",
      product_url: p.product_url || "",
      notes: p.notes || {}
    }));

    // Create order on Razorpay
    const orderPayload = {
      amount: lineItemsTotal,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {},
      line_items_total: lineItemsTotal,
      line_items: lineItems
    };

    const razorpayAuth = Buffer.from(
      `${config.razorpay.keyId}:${config.razorpay.keySecret}`
    ).toString('base64');

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${razorpayAuth}`
      },
      body: JSON.stringify(orderPayload)
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      throw new Error(`Razorpay API Error: ${orderResponse.status} - ${errorData}`);
    }

    const orderData = await orderResponse.json();

    // Generate Magic Checkout URL form data
    const checkoutParams = new URLSearchParams({
      'checkout[key]': config.razorpay.keyId || '',
      'checkout[order_id]': orderData.id,
      'checkout[name]': customer?.name || 'Customer',
      'checkout[prefill][contact]': customer?.phone || '',
      'checkout[prefill][email]': customer?.email || '',
      'checkout[notes][mode]': 'test',
      'url[callback]': callbacks?.success || 'https://google.com',
      'url[cancel]': callbacks?.cancel || 'https://yahoo.com'
    });

    return {
      order: orderData,
      checkout_url: 'https://api.razorpay.com/v1/checkout/hosted',
      form_data: Object.fromEntries(checkoutParams),
      html_form: this.generateMagicCheckoutForm(orderData.id, customer, callbacks)
    };
  }

  /**
   * Generate HTML form for Magic Checkout
   */
  private generateMagicCheckoutForm(orderId: string, customer: any, callbacks: any): string {
    return `
      <form id="razorpay-magic-checkout" action="https://api.razorpay.com/v1/checkout/hosted" method="POST">
        <input type="hidden" name="checkout[key]" value="${config.razorpay.keyId}" />
        <input type="hidden" name="checkout[order_id]" value="${orderId}" />
        <input type="hidden" name="checkout[name]" value="${customer?.name || 'Customer'}" />
        <input type="hidden" name="checkout[prefill][contact]" value="${customer?.phone || ''}" />
        <input type="hidden" name="checkout[prefill][email]" value="${customer?.email || ''}" />
        <input type="hidden" name="checkout[notes][mode]" value="live" />
        <input type="hidden" name="url[callback]" value="${callbacks?.success || 'https://google.com'}" />
        <input type="hidden" name="url[cancel]" value="${callbacks?.cancel || 'https://yahoo.com'}" />
        <button type="submit">Proceed to Magic Checkout</button>
      </form>
      <script>document.getElementById('razorpay-magic-checkout').submit();</script>
    `;
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string) {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const razorpayAuth = Buffer.from(
      `${config.razorpay.keyId}:${config.razorpay.keySecret}`
    ).toString('base64');

    const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Razorpay API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    // Check if there's any captured payment
    const capturedPayment = data.items?.find((payment: any) => 
      payment.status === 'captured' && payment.captured === true
    );

    return {
      orderId,
      payments: data.items || [],
      count: data.count || 0,
      hasCapturedPayment: !!capturedPayment,
      capturedPayment: capturedPayment || null
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
      name = 'Razorpay Magic Checkout',
      businessName = 'Acme Corp',
      customerName = 'Guest Customer',
      customerEmail = '',
      customerPhone = '',
      couponCode = '',
      callbackUrl = 'https://example.com/payment-success',
      showCoupons = 'true',
      address = ''
    } = params;


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
    var options = {
        "key": "${config.razorpay.keyId}",
        "one_click_checkout": true,
        "name": "${businessName}",
        "order_id": orderId,
        "show_coupons": ${showCoupons},
        "callback_url": "${callbackUrl}",
        "redirect": "true"
    };
    
    var rzp1 = new Razorpay(options);
    
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
}

export default RazorpayService;
