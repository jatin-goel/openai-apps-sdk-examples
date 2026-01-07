import config from "../config/index.js";

// In-memory order storage
const orders = new Map<string, any>();

export class OrderService {
  /**
   * Create a checkout order with Razorpay
   */
  static async createCheckoutOrder(cart: any[], userId: string, sessionId: string, address: any) {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      throw new Error("Cart items are required");
    }

    // Calculate line items total
    const lineItemsTotal = cart.reduce((sum: number, item: any) => {
      const itemPrice = Math.round((item.price || 0) * (item.quantity || 1) * 100); // Convert to paise
      return sum + itemPrice;
    }, 0);

    // Format line items for Razorpay
    const lineItems = cart.map((item: any) => ({
      sku: item.product_id?.toString() || item.id?.toString() || "unknown",
      variant_id: item.variant_id?.toString() || item.product_id?.toString() || "",
      other_product_codes: item.other_product_codes || {},
      price: Math.round((item.price || 0) * 100), // Convert to paise
      offer_price: Math.round((item.offer_price || item.price || 0) * 100), // Convert to paise
      tax_amount: Math.round((item.tax_amount || 0) * 100), // Convert to paise
      quantity: item.quantity || 1,
      name: item.title || item.name || "Product",
      description: item.description || item.title || "Product",
      weight: item.weight || 0,
      dimensions: item.dimensions || {},
      image_url: item.thumbnail || item.image_url || "",
      product_url: item.product_url || "",
      notes: item.notes || {}
    }));

    // Create order payload
    const orderPayload = {
      amount: lineItemsTotal,
      currency: "INR",
      receipt: `receipt_${sessionId}_${Date.now()}`,
      notes: {
        user_id: userId || "",
        session_id: sessionId || "",
        address: JSON.stringify(address || {})
      },
      line_items_total: lineItemsTotal,
      line_items: lineItems
    };

    console.log('Creating Razorpay order with payload:', JSON.stringify(orderPayload, null, 2));

    // Create Basic Auth header
    const razorpayAuth = Buffer.from(
      `${config.razorpay.keyId}:${config.razorpay.keySecret}`
    ).toString('base64');

    // Call Razorpay API
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
      console.error('Razorpay API Error:', errorData);
      throw new Error(`Razorpay API Error: ${orderResponse.status} - ${errorData}`);
    }

    const orderData = await orderResponse.json();
    console.log('Razorpay order created successfully:', orderData);

    // Store order in memory
    orders.set(orderData.id, {
      ...orderData,
      user_id: userId,
      session_id: sessionId,
      line_items: lineItems
    });

    return orderData;
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
