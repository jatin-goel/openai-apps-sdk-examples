// In-memory cart storage
const carts = new Map<string, any[]>();

export class CartService {
  /**
   * Get cart items for a user
   */
  static async getCart(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return carts.get(userId) || [];
  }

  /**
   * Add item to cart
   */
  static async addToCart(
    userId: string,
    productId: number,
    title: string,
    price: number,
    thumbnail?: string,
    sessionId?: string
  ) {
    if (!userId || !productId || !title || price === undefined) {
      throw new Error("Missing required fields");
    }

    const cart = carts.get(userId) || [];
    
    // Check if item already exists in cart
    const existingIndex = cart.findIndex(item => item.product_id === productId);

    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity += 1;
      cart[existingIndex].updated_at = new Date().toISOString();
    } else {
      // Insert new item
      cart.push({
        id: crypto.randomUUID(),
        product_id: productId,
        title,
        price,
        thumbnail,
        quantity: 1,
        session_id: sessionId,
        created_at: new Date().toISOString()
      });
    }

    carts.set(userId, cart);
    return cart;
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId: string, productId: number) {
    if (!userId || !productId) {
      throw new Error("User ID and Product ID are required");
    }

    const cart = carts.get(userId) || [];
    const existingIndex = cart.findIndex(item => item.product_id === productId);

    if (existingIndex >= 0) {
      if (cart[existingIndex].quantity > 1) {
        // Decrease quantity
        cart[existingIndex].quantity -= 1;
        cart[existingIndex].updated_at = new Date().toISOString();
      } else {
        // Remove item
        cart.splice(existingIndex, 1);
      }
    }

    carts.set(userId, cart);
    return cart;
  }

  /**
   * Clear entire cart
   */
  static async clearCart(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    carts.delete(userId);
    return [];
  }
}

export default CartService;
