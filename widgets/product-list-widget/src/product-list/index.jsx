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
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full">
        <StoreHeader 
          storeName={storeName}
          query={query}
          total={total}
          cartItemCount={totalItems}
          onCartClick={() => setIsCartOpen(true)}
        />

        <SearchBar
          searchInput={searchInput}
          isSearching={isSearching}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
        />

        <div className="py-4">
          <ProductList
            products={products}
            isSearching={isSearching}
            getProductQuantity={getProductQuantity}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
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
            />
          )}
        </div>
      </div>

      <PaymentOverlay
        isOpen={paymentOverlay.isOpen}
        orderId={paymentOverlay.orderId}
        baseUrl={BASE_URL}
        storeName={storeName}
        onClose={closePaymentOverlay}
        onPaymentSuccess={handlePaymentSuccess}
        cart={cart}
        totalItems={totalItems}
        totalPrice={totalPrice}
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
