import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { PlusCircle, MinusCircle, Star, ShoppingCart, Search, Loader2 } from "lucide-react";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Image } from "@openai/apps-sdk-ui/components/Image";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("phone");
  const [searchInput, setSearchInput] = useState("phone");
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const limit = 100;

  // API base URL and store ID from env
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const storeId = import.meta.env.VITE_RAZORPAY_STORE_ID;

  useEffect(() => {
    // Get search parameters from tool output
    const toolOutput = window.openai?.toolOutput || {};
    if (toolOutput.query) setQuery(toolOutput.query);
    if (toolOutput.skip !== undefined) setSkip(toolOutput.skip);
  }, []);

  useEffect(() => {
    // Use Razorpay parse-store API
    const apiUrl = `${baseUrl}/api/razorpay/parse-store?url=https://pages.razorpay.com/stores/${storeId}`;
    
    setIsSearching(true);
    
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Map Razorpay product structure to expected format
          const mappedProducts = (data.products || []).map(product => ({
            id: product.id,
            title: product.name,
            price: product.discounted_price / 100, // Convert from paise to rupees
            thumbnail: product.images && product.images.length > 0 
              ? product.images[0] 
              : 'https://via.placeholder.com/100',
            rating: 4.5, // Default rating since Razorpay doesn't provide it
            category: product.categories && product.categories.length > 0 
              ? product.categories[0].name 
              : 'Uncategorized'
          }));
          
          // Filter products based on search query
          const filteredProducts = query 
            ? mappedProducts.filter(p => 
                p.title.toLowerCase().includes(query.toLowerCase()) ||
                p.category.toLowerCase().includes(query.toLowerCase())
              )
            : mappedProducts;
          
          // Apply pagination
          const paginatedProducts = filteredProducts.slice(skip, skip + limit);
          
          setProducts(paginatedProducts);
          setTotal(filteredProducts.length);
        } else {
          console.error('Error fetching products:', data.error);
          setProducts([]);
          setTotal(0);
        }
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setProducts([]);
        setTotal(0);
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, [query, skip]);

  // Poll payment status when there's a pending order
  useEffect(() => {
    if (!pendingOrderId || !isCheckingPayment) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/razorpay/payment-status?orderId=${pendingOrderId}`);
        const data = await response.json();

        if (data.success && data.data.hasCapturedPayment) {
          // Payment captured!
          setPaymentStatus({
            status: 'success',
            payment: data.data.capturedPayment,
            orderId: pendingOrderId
          });
          setIsCheckingPayment(false);
          setPendingOrderId(null);
        } else if (data.success && data.data.count > 0) {
          // Check if any payment failed
          const failedPayment = data.data.payments.find(p => p.status === 'failed');
          if (failedPayment) {
            setPaymentStatus({
              status: 'failed',
              orderId: pendingOrderId
            });
            setIsCheckingPayment(false);
            setPendingOrderId(null);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Initial check
    checkPaymentStatus();

    // Poll every 3 seconds
    const interval = setInterval(checkPaymentStatus, 3000);

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      setIsCheckingPayment(false);
      setPaymentStatus({
        status: 'timeout',
        orderId: pendingOrderId
      });
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pendingOrderId, isCheckingPayment, baseUrl]);

  const handleAddToCart = (product) => {
    // Add product to cart in memory
    const newItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail
    };
    setCart(prevCart => [...prevCart, newItem]);
  };

  const handleRemoveFromCart = (productId) => {
    // Remove product from cart in memory
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const isProductInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };

  const getTotalItems = () => cart.length;
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput);
    setSkip(0); // Reset to first page when searching
  };

  const handlePayNow = async () => {
    setIsProcessingCheckout(true);
    setCheckoutError("");
    setPaymentStatus(null);
    
    try {
      const sessionId = window.openai?.widgetSessionId || Date.now().toString();
      
      // Prepare cart data with proper structure for line items
      const cartData = cart.map(item => ({
        product_id: item.id,
        title: item.title,
        price: item.price,
        quantity: 1,
        thumbnail: item.thumbnail,
        description: item.title,
        offer_price: item.price,
        tax_amount: 0
      }));

      const requestBody = {
        cart: cartData,
        userId: null,
        sessionId: sessionId,
        address: {
          name: "Guest User",
          phone: "0000000000",
          street: "N/A",
          city: "N/A",
          zip: "000000"
        }
      };

      console.log('Creating Razorpay order...', requestBody);

      const response = await fetch(`${baseUrl}/api/checkout/proceed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        console.log('Order created successfully:', data);
        
        // Store the order ID for payment status polling
        setPendingOrderId(data.order.id);
        
        // Clear cart in memory after successful order creation
        setCart([]);
        
        // Open magic checkout URL directly
        const magicCheckoutUrl = `${baseUrl}/api/razorpay/magic-checkout?orderId=${data.order.id}`;
        window.open(magicCheckoutUrl, '_blank');
        
        // Start checking payment status
        setIsCheckingPayment(true);
        
      } else {
        console.error('Order creation failed:', data.error);
        setCheckoutError(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('Network error. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full">
        <div className="flex flex-row items-center gap-4 sm:gap-4 border-b border-black/5 py-4">
          <div
            className="sm:w-18 w-16 aspect-square rounded-xl bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://cdn.dummyjson.com/product-images/smartphones/iphone-6/thumbnail.webp)",
            }}
          ></div>
          <div className="flex-1">
            <div className="text-base sm:text-xl font-medium">
              Smartphone Store
            </div>
            <div className="text-sm text-black/60">
              {total} products found for "{query}"
            </div>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-medium">{getTotalItems()} items</span>
            </div>
          )}
        </div>
        <div className="py-3 border-b border-black/5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-10 pr-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <Button 
              color="primary" 
              variant="solid" 
              size="md"
              type="submit"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </form>
        </div>
        <div className="min-w-full text-sm flex flex-col">
          {isSearching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-black/60">Searching products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-6 text-center text-black/60">
              No products found.
            </div>
          ) : (
            products.map((product, i) => (
              <div
                key={product.id}
                className="px-3 -mx-2 rounded-2xl hover:bg-black/5"
              >
                <div
                  style={{
                    borderBottom:
                      i === products.length - 1 ? "none" : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                  className="flex w-full items-center hover:border-black/0! gap-2"
                >
                  <div className="py-3 pr-3 min-w-0 w-full sm:w-3/5">
                    <div className="flex items-center gap-3">
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg object-cover ring ring-black/5"
                      />
                      <div className="min-w-0 sm:pl-1 flex flex-col items-start h-full">
                        <div className="font-medium text-sm sm:text-md truncate max-w-[40ch]">
                          {product.title}
                        </div>
                        <div className="mt-1 sm:mt-0.25 flex items-center gap-3 text-black/70 text-sm">
                          <div className="flex items-center gap-1">
                            <Star
                              strokeWidth={1.5}
                              className="h-3 w-3 text-black"
                            />
                            <span>{product.rating?.toFixed(1)}</span>
                          </div>
                          <div className="whitespace-nowrap font-medium">
                           ₹{product.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-end py-2 px-3 text-sm text-black/60 whitespace-nowrap flex-auto">
                    {product.category || "–"}
                  </div>
                  <div className="py-2 whitespace-nowrap flex justify-end gap-2">
                    {isProductInCart(product.id) && (
                      <Button
                        aria-label={`Remove ${product.title}`}
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        uniform
                        onClick={() => handleRemoveFromCart(product.id)}
                      >
                        <MinusCircle strokeWidth={1.5} className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      aria-label={`Add ${product.title}`}
                      color="secondary"
                      variant="ghost"
                      size="sm"
                      uniform
                      onClick={() => handleAddToCart(product)}
                    >
                      <PlusCircle strokeWidth={1.5} className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-2 pt-2">
          {/* Payment Status Display */}
          {isCheckingPayment && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Checking payment status...</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Complete your payment in the checkout window
              </p>
            </div>
          )}

          {paymentStatus && paymentStatus.status === 'success' && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-800 mb-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Payment Successful!</span>
              </div>
              <p className="text-xs text-green-700">
                Payment ID: {paymentStatus.payment?.id}
              </p>
              <p className="text-xs text-green-700">
                Amount: ₹{(paymentStatus.payment?.amount / 100).toFixed(2)}
              </p>
            </div>
          )}

          {paymentStatus && paymentStatus.status === 'failed' && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Payment Failed</span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Please try again or use a different payment method
              </p>
            </div>
          )}

          {paymentStatus && paymentStatus.status === 'timeout' && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Payment Status Unknown</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Please check your email for order confirmation
              </p>
            </div>
          )}

          {total > limit && (
            <div className="flex gap-2">
              <Button 
                color="secondary" 
                variant="outline" 
                size="sm"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - limit))}
              >
                Previous
              </Button>
              <Button 
                color="secondary" 
                variant="outline" 
                size="sm"
                disabled={skip + limit >= total}
                onClick={() => setSkip(skip + limit)}
              >
                Next
              </Button>
              <span className="text-sm text-black/60 self-center ml-2">
                {skip + 1}-{Math.min(skip + limit, total)} of {total}
              </span>
            </div>
          )}
          {cart.length > 0 && (
            <div className="pt-2 border-t border-black/5">
              {checkoutError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  {checkoutError}
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Cart Summary</span>
                <span className="text-sm font-medium">${getTotalPrice()}</span>
              </div>
              <Button 
                color="primary" 
                variant="solid" 
                size="md" 
                block
                onClick={handlePayNow}
                disabled={isProcessingCheckout}
              >
                {isProcessingCheckout ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Pay Now ({getTotalItems()} items)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("product-list-root")).render(<App />);
