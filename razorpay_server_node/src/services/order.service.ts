// In-memory order storage
const orders = new Map<string, any>();

export class OrderService {
  /**
   * Create a checkout order using Razorpay public cart API
   * 
   * @param lineItems - Array of { quantity: number, line_item_id: string }
   * @param entityId - Store ID (e.g., "st_S0ycYwzFMLGY6s")
   * @param notes - Optional notes object
   */
  static async createCheckoutOrder(
    lineItems: Array<{ quantity: number; line_item_id: string }>,
    entityId: string,
    notes: Record<string, any> = {}
  ) {
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error("lineItems array is required");
    }

    if (!entityId) {
      throw new Error("entityId (store ID) is required");
    }

    const payload = {
      line_items: lineItems.map(item => ({
        quantity: item.quantity || 1,
        line_item_id: item.line_item_id
      })),
      notes,
      entity_id: entityId,
      entity_type: "payment_store"
    };

    console.log('Creating Razorpay cart with payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.razorpay.com/v1/stores/public/carts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Origin': 'https://pages.razorpay.com',
        'Referer': 'https://pages.razorpay.com/'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Razorpay Cart API Error:', errorData);
      throw new Error(`Razorpay Cart API Error: ${response.status} - ${errorData}`);
    }

    const cartData = await response.json();
    console.log('Razorpay cart created successfully:', cartData);

    // Store order in memory
    if (cartData.order_id) {
      orders.set(cartData.order_id, {
        ...cartData,
        entity_id: entityId,
        line_items: lineItems
      });
    }

    return {
      cart: cartData,
      order_id: cartData.order_id,
      entity_id: entityId
    };
  }

  /**
   * Get order by Razorpay order ID
   */
  static async getOrderById(orderId: string) {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const order = orders.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      notes: order.notes,
      created_at: order.created_at,
      line_items: order.line_items
    };
  }
}

export default OrderService;
