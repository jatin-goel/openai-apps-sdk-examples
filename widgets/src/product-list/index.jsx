import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { PlusCircle, MinusCircle, Star, ShoppingCart, Search, Loader2, ChevronLeft, ChevronRight, Package } from "lucide-react";
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
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef(null);
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

  // Carousel scroll functions
  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = 320; // Width of card + gap
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    
    carouselRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newPosition);
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = carouselRef.current 
    ? scrollPosition < (carouselRef.current.scrollWidth - carouselRef.current.clientWidth)
    : false;

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

  // Payment Status Component
  const PaymentStatusComponent = () => {
    if (!isCheckingPayment && !paymentStatus) return null;

    if (isCheckingPayment) {
      return (
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <div className="font-semibold text-blue-900">Checking Payment Status</div>
              <div className="text-sm text-blue-700 mt-0.5">
                Complete your payment in the checkout window
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus?.status === 'success') {
      return (
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-green-900 text-base">Payment Successful! 🎉</div>
              <div className="text-sm text-green-800 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-700">Payment ID:</span>
                  <span className="font-mono text-xs">{paymentStatus.payment?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Amount Paid:</span>
                  <span className="font-semibold">₹{(paymentStatus.payment?.amount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus?.status === 'failed') {
      return (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-semibold text-red-900 text-base">Payment Failed</div>
              <div className="text-sm text-red-700 mt-1">
                Please try again or use a different payment method
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus?.status === 'timeout') {
      return (
        <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-semibold text-yellow-900 text-base">Payment Status Unknown</div>
              <div className="text-sm text-yellow-700 mt-1">
                Please check your email for order confirmation
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="antialiased w-full text-black border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-full">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-black/5 px-6 py-5">
          <div className="flex flex-row items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center"
            >
              <Package className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Product Showcase
              </h1>
              <p className="text-sm text-black/60 mt-0.5">
                {total} products • Showing results for "{query}"
              </p>
            </div>
            {cart.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg">
                <ShoppingCart className="h-5 w-5" />
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium opacity-90">Cart</span>
                  <span className="text-sm font-bold">{getTotalItems()} items</span>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-2.5 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm"
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

        {/* Payment Status Component */}
        <div className="px-6 pt-4">
          <PaymentStatusComponent />
        </div>

        {/* Horizontal Product Carousel */}
        <div className="px-6 py-6">
          <div className="relative">
            {/* Carousel Title */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCarousel('left')}
                  disabled={!canScrollLeft}
                  className="p-2 rounded-full bg-white border border-black/10 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  disabled={!canScrollRight}
                  className="p-2 rounded-full bg-white border border-black/10 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Products Container */}
            {isSearching ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <span className="text-black/60 font-medium">Loading amazing products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-black/60 font-medium">No products found.</p>
                <p className="text-sm text-black/40 mt-1">Try searching for something else</p>
              </div>
            ) : (
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
                onScroll={(e) => setScrollPosition(e.target.scrollLeft)}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex-none w-72 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-black/5"
                  >
                    {/* Product Image */}
                    <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                      {isProductInCart(product.id) && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          In Cart
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                        {product.title}
                      </h3>
                      
                      {/* Category Badge */}
                      {product.category && (
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                            {product.category}
                          </span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star
                            className="h-4 w-4 text-yellow-500 fill-yellow-500"
                            strokeWidth={1.5}
                          />
                          <span className="font-semibold text-sm text-gray-700">
                            {product.rating?.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          ({Math.floor(Math.random() * 1000) + 100} Reviews)
                        </span>
                      </div>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 line-through">
                            ₹{(product.price * 1.2).toFixed(0)}
                          </span>
                          <span className="text-2xl font-bold text-gray-900">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {isProductInCart(product.id) && (
                            <button
                              onClick={() => handleRemoveFromCart(product.id)}
                              className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                              aria-label={`Remove ${product.title}`}
                            >
                              <MinusCircle strokeWidth={2} className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-md hover:shadow-lg"
                            aria-label={`Add ${product.title}`}
                          >
                            <PlusCircle strokeWidth={2} className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Summary Footer */}
        {cart.length > 0 && (
          <div className="px-6 pb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-black/5 p-5">
              {checkoutError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200 flex items-start gap-2">
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {checkoutError}
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Cart Summary</h3>
                  <p className="text-sm text-gray-500">{getTotalItems()} items in cart</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{getTotalPrice()}</p>
                </div>
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
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById("product-list-root")).render(<App />);
