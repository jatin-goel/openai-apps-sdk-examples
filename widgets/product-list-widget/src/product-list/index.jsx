import React, { useState } from "react";
import { createRoot } from "react-dom/client";

// Components
import {
  PaymentOverlay,
  ProductList,
  SearchBar,
  CartSummary,
  CartDrawer,
  StoreHeader,
  Pagination,
  LoadingScreen
} from "./components/index.js";

// Hooks
import { useStore, useCart, useCheckout } from "./hooks/index.js";

// API base URL and store ID from env (injected at build time)
const BASE_URL = __API_BASE_URL__;
const STORE_ID = __RAZORPAY_STORE_ID__;

/**
 * ProductListWidget - Main widget component
 * Displays store products with cart and checkout functionality
 */
function App() {
  // Store data and search
  const {
    products,
    storeName,
    total,
    query,
    searchInput,
    skip,
    limit,
    isSearching,
    isInitialLoad,
    setSearchInput,
    handleSearch,
    handlePrevious,
    handleNext
  } = useStore(BASE_URL, STORE_ID);

  // Cart management
  const {
    cart,
    addToCart,
    removeFromCart,
    getProductQuantity,
    clearCart,
    totalItems,
    totalPrice
  } = useCart();

  // Checkout process
  const {
    isProcessing,
    error: checkoutError,
    paymentOverlay,
    processCheckout,
    closePaymentOverlay
  } = useCheckout(BASE_URL, STORE_ID, cart);

  // Cart drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Handle successful payment
  const handlePaymentSuccess = () => {
    clearCart();
  };

  if (isInitialLoad) {
    return <LoadingScreen />;
  }

  return (
    <div className="antialiased w-full text-black bg-[#faf9f7] p-4 sm:p-6">
      {/* Centered container with max-width */}
      <div className="max-w-[1400px] mx-auto bg-[#f5f4f0] rounded-3xl shadow-sm overflow-hidden">
        {/* Inner container with generous padding */}
        <div className="px-6 sm:px-10 py-8">
          {/* Header: Brand/Logo and Search */}
          <div className="flex items-start justify-between gap-6 mb-8">
            {/* Brand/Logo area - left */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl sm:text-3xl font-light text-[#3d3d3d] tracking-tight mb-1">
                {storeName || "alder & arc"}
              </h1>
              <p className="text-sm text-[#8a8a8a] font-light">
                {query ? (
                  <span>{total} results for "{query}"</span>
                ) : (
                  <span>{total} pieces</span>
                )}
              </p>
            </div>

            {/* Search input - right */}
            <div className="flex-1 max-w-md">
              <SearchBar
                searchInput={searchInput}
                isSearching={isSearching}
                onSearchInputChange={setSearchInput}
                onSearch={handleSearch}
                cartItemCount={totalItems}
                onCartClick={() => setIsCartOpen(true)}
              />
            </div>
          </div>

          {/* Product strip with overflow */}
          <div className="relative -mx-6 sm:-mx-10">
            <div className="px-6 sm:px-10">
              <ProductList
                products={products}
                isSearching={isSearching}
                getProductQuantity={getProductQuantity}
                onAddToCart={addToCart}
                onRemoveFromCart={removeFromCart}
              />
            </div>
          </div>

          {/* Bottom section: Pagination and Cart */}
          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-[#e0ddd8]">
            <Pagination
              skip={skip}
              limit={limit}
              total={total}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />

            {cart.length > 0 && (
              <CartSummary
                totalItems={totalItems}
                totalPrice={totalPrice}
                isProcessing={isProcessing}
                error={checkoutError}
                onCheckout={processCheckout}
                onOpenCart={() => setIsCartOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      <PaymentOverlay
        isOpen={paymentOverlay.isOpen}
        orderId={paymentOverlay.orderId}
        baseUrl={BASE_URL}
        storeName={storeName}
        onClose={closePaymentOverlay}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        totalItems={totalItems}
        totalPrice={totalPrice}
        getProductQuantity={getProductQuantity}
        onClose={() => setIsCartOpen(false)}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onCheckout={processCheckout}
        isProcessing={isProcessing}
      />
    </div>
  );
}

// Mount the app
createRoot(document.getElementById("product-list-root")).render(<App />);
