import type { IncomingMessage, ServerResponse } from "node:http";
import { OrderService } from "../services/order.service.js";
import {
  parseJsonBody,
  sendSuccessResponse,
  sendErrorResponse,
} from "../utils/helpers.js";

export class OrderRoutes {
  /**
   * POST /api/checkout/proceed
   *
   * Request body:
   * - lineItems: Array of { quantity: number, line_item_id: string }
   * - entityId: Store ID (e.g., "st_S0ycYwzFMLGY6s")
   * - notes: Optional notes object
   */
  static async proceedToCheckout(req: IncomingMessage, res: ServerResponse) {
    try {
      const { lineItems, entityId, notes } = await parseJsonBody(req);
      const result = await OrderService.createCheckoutOrder(
        lineItems,
        entityId,
        notes,
      );
      sendSuccessResponse(res, {
        ...result,
        message: "Razorpay order created successfully",
      });
    } catch (error: any) {
      console.error("Error creating Razorpay order for checkout:", error);
      const statusCode = error.message.includes("required") ? 400 : 500;
      sendErrorResponse(
        res,
        statusCode,
        error.message || "Failed to create order",
      );
    }
  }

  /**
   * GET /api/orders/:orderId
   */
  static async getOrderById(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
  ) {
    try {
      const orderId = url.pathname.split("/api/orders/")[1];
      if (!orderId) {
        sendErrorResponse(res, 400, "Order ID is required");
        return;
      }
      const order = await OrderService.getOrderById(orderId);
      sendSuccessResponse(res, { order });
    } catch (error: any) {
      console.error("Error fetching order:", error);
      const statusCode = error.message.includes("not found") ? 404 : 500;
      sendErrorResponse(
        res,
        statusCode,
        error.message || "Failed to fetch order",
      );
    }
  }
}

export default OrderRoutes;
