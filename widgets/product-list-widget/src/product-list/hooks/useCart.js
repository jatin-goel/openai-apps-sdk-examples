import { useState } from "react";

/**
 * useCart - Hook to manage shopping cart state
 */
export function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const currentQuantity = prevCart.filter(
        (item) => item.id === product.id,
      ).length;
      if (currentQuantity >= product.stockAvailable) {
        return prevCart;
      }

      return [
        ...prevCart,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === productId);
      if (index === -1) return prevCart;
      const newCart = [...prevCart];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const getProductQuantity = (productId) => {
    return cart.filter((item) => item.id === productId).length;
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.length;
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0); // numeric total
  const totalPriceFormatted = totalPrice.toFixed(2); // string for display

  return {
    cart,
    addToCart,
    removeFromCart,
    getProductQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}

export default useCart;
