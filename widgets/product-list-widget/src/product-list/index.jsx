import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { PlusCircle, MinusCircle, ShoppingCart, Search, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Image } from "@openai/apps-sdk-ui/components/Image";

// Payment Overlay Component
function PaymentOverlay({ isOpen, orderId, baseUrl, storeName, onClose, onPaymentSuccess }) {
  const [status, setStatus] = useState('polling'); // 'polling' | 'success' | 'error'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const pollingRef = useRef(null);
  const checkoutWindowRef = useRef(null);

  // Open checkout window when overlay opens
  useEffect(() => {
    if (isOpen && orderId && !checkoutOpened) {
      // Open magic checkout in new window with store name as business name
      const params = new URLSearchParams({ orderId });
      if (storeName) {
        params.set('businessName', storeName);
      }
      const magicCheckoutUrl = `${baseUrl}/api/razorpay/magic-checkout?${params.toString()}`;
      checkoutWindowRef.current = window.open(magicCheckoutUrl, '_blank');
      setCheckoutOpened(true);
    }
  }, [isOpen, orderId, baseUrl, storeName, checkoutOpened]);

  // Polling effect - separate from checkout opening
  useEffect(() => {
    if (!isOpen || !orderId || status === 'success') {
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        console.log('Polling payment status for order:', orderId);
        const response = await fetch(`${baseUrl}/api/razorpay/payment-status?orderId=${orderId}`);
        const data = await response.json();
        
        console.log('Payment status response:', data);
        
        if (data.success && data.hasCapturedPayment) {
          setStatus('success');
          setPaymentDetails(data.capturedPayment);
          onPaymentSuccess?.();
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check immediately
    checkPaymentStatus();
    
    // Then poll every 2 seconds
    const intervalId = setInterval(checkPaymentStatus, 2000);
    pollingRef.current = intervalId;
    
    return () => {
      clearInterval(intervalId);
      pollingRef.current = null;
    };
  }, [isOpen, orderId, baseUrl, status, onPaymentSuccess]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setStatus('polling');
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
        onClick={status === 'success' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] mx-4 overflow-hidden">
        {status === 'polling' ? (
          // Polling State
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
              Complete your payment in the checkout window. This page will update automatically.
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
        ) : status === 'success' ? (
          // Success State
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
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Amount Paid</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{(paymentDetails.amount / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Payment ID</span>
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
        ) : null}
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [paymentOverlay, setPaymentOverlay] = useState({ isOpen: false, orderId: null });
  const limit = 100;

  // API base URL and store ID from env (injected at build time)
  const baseUrl = __API_BASE_URL__;
  const storeId = __RAZORPAY_STORE_ID__;

  useEffect(() => {
    // Get search parameters from tool output
    const toolOutput = window.openai?.toolOutput || {};
    if (toolOutput.query) {
      setQuery(toolOutput.query);
      setSearchInput(toolOutput.query); // Also populate the search input box
    }
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
          // Set store name from API response
          if (data.store?.title) {
            setStoreName(data.store.title);
          }
          
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
              : 'Uncategorized',
            stockAvailable: product.stock_available || 0
          }));
          
          // Filter out products with no stock available
          const inStockProducts = mappedProducts.filter(p => p.stockAvailable > 0);
          
          // Filter products based on search query
          const filteredProducts = query 
            ? inStockProducts.filter(p => 
                p.title.toLowerCase().includes(query.toLowerCase()) ||
                p.category.toLowerCase().includes(query.toLowerCase())
              )
            : inStockProducts;
          
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
        setIsInitialLoad(false);
      });
  }, [query, skip]);

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      // Check if we've reached the max stock available using latest cart state
      const currentQuantity = prevCart.filter(item => item.id === product.id).length;
      if (currentQuantity >= product.stockAvailable) {
        return prevCart; // Don't add more than available stock
      }
      
      // Add product to cart in memory
      const newItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail
      };
      return [...prevCart, newItem];
    });
  };

  const handleRemoveFromCart = (productId) => {
    // Remove only ONE item from cart (reduce quantity by 1)
    setCart(prevCart => {
      const index = prevCart.findIndex(item => item.id === productId);
      if (index === -1) return prevCart;
      const newCart = [...prevCart];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const isProductInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };

  const getProductQuantity = (productId) => {
    return cart.filter(item => item.id === productId).length;
  };

  const getTotalItems = () => cart.length;
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  const handleClosePaymentOverlay = () => {
    setPaymentOverlay({ isOpen: false, orderId: null });
  };

  const handlePaymentSuccess = () => {
    // Clear cart after successful payment
    setCart([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput);
    setSkip(0); // Reset to first page when searching
  };

  const handlePayNow = async () => {
    setIsProcessingCheckout(true);
    setCheckoutError("");
    
    try {
      // Prepare line items with proper structure for Razorpay cart API
      // The product.id is the line_item_id (e.g., "li_S0ycZ0t0WKqjio")
      const lineItems = cart.map(item => ({
        line_item_id: item.id,
        quantity: 1
      }));

      const requestBody = {
        lineItems: lineItems,
        entityId: storeId,
        notes: {}
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
        
        // Show payment overlay with polling (this will open checkout and poll for payment status)
        setPaymentOverlay({ isOpen: true, orderId: data.order_id });
        
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

  if (isInitialLoad) {
    return (
      <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
        <div className="py-16 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <span className="text-black/60 text-sm">Loading store...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full">
        <div className="flex flex-row items-center gap-4 sm:gap-4 border-b border-black/5 py-4">
          <div className="flex-1">
            <div className="text-base sm:text-xl font-medium">
              {storeName || "Store"}
            </div>
            <div className="text-sm text-black/60">
              {query ? `${total} products found for "${query}"` : `${total} products`}
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
        <div className="py-4">
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
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group flex-shrink-0 w-[200px] sm:w-[220px] flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 snap-start"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-white p-4 flex items-center justify-center relative overflow-hidden">
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.stockAvailable <= 5 && product.stockAvailable > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        Only {product.stockAvailable} left
                      </span>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3 flex flex-col flex-1 border-t border-gray-100 bg-white">
                    {product.category && product.category.toLowerCase() !== 'others' && product.category.toLowerCase() !== 'uncategorized' && (
                      <p className="text-[10px] text-black/60 mb-0.5 truncate uppercase tracking-wide">
                        {product.category}
                      </p>
                    )}
                    <h3 className="font-medium text-black text-sm leading-snug">
                      {product.title}
                    </h3>
                    <p className="mt-1.5 text-lg font-bold text-black">
                      ₹{product.price}
                    </p>
                    
                    {/* Add to Cart Section */}
                    <div className="mt-3">
                      {getProductQuantity(product.id) > 0 ? (
                        <div className="flex items-center justify-between border-2 border-black rounded-lg">
                          <button
                            aria-label={`Remove ${product.title}`}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            onClick={() => handleRemoveFromCart(product.id)}
                          >
                            <MinusCircle strokeWidth={2} className="h-4 w-4 text-black" />
                          </button>
                          <span className="font-bold text-black text-sm">
                            {getProductQuantity(product.id)}
                          </span>
                          <button
                            aria-label={`Add ${product.title}`}
                            className={`w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors ${getProductQuantity(product.id) >= product.stockAvailable ? 'opacity-30 cursor-not-allowed' : ''}`}
                            onClick={() => handleAddToCart(product)}
                            disabled={getProductQuantity(product.id) >= product.stockAvailable}
                          >
                            <PlusCircle strokeWidth={2} className="h-4 w-4 text-black" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="w-full bg-black text-white py-2.5 px-3 rounded-lg text-sm font-bold hover:bg-gray-800 active:scale-[0.98] transition-all"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Bag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 pt-2">
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
                <span className="text-sm font-medium">₹{getTotalPrice()}</span>
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
      
      {/* Payment Overlay */}
      <PaymentOverlay
        isOpen={paymentOverlay.isOpen}
        orderId={paymentOverlay.orderId}
        baseUrl={baseUrl}
        storeName={storeName}
        onClose={handleClosePaymentOverlay}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

createRoot(document.getElementById("product-list-root")).render(<App />);
