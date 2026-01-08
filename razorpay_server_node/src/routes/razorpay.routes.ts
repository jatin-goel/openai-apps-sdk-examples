import type { IncomingMessage, ServerResponse } from "node:http";
import { RazorpayService } from "../services/razorpay.service.js";
import { OrderService } from "../services/order.service.js";
import { parseJsonBody, sendSuccessResponse, sendErrorResponse } from "../utils/helpers.js";

const razorpayService = new RazorpayService();

export class RazorpayRoutes {
  /**
   * POST /api/razorpay/create-order
   * Creates an order using Razorpay public cart API
   * 
   * Request body:
   * - lineItems: Array of { quantity: number, line_item_id: string }
   * - entityId: Store ID (e.g., "st_S0ycYwzFMLGY6s")
   * - notes: Optional notes object
   */
  static async createOrder(req: IncomingMessage, res: ServerResponse) {
    try {
      const { lineItems, entityId, notes } = await parseJsonBody(req);
      const result = await OrderService.createCheckoutOrder(lineItems, entityId, notes);
      sendSuccessResponse(res, result);
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * POST /api/razorpay/verify-payment
   */
  static async verifyPayment(req: IncomingMessage, res: ServerResponse) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await parseJsonBody(req);
      
      const isAuthentic = razorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (isAuthentic) {
        sendSuccessResponse(res, {
          message: "Payment verified successfully",
          payment_id: razorpay_payment_id
        });
      } else {
        sendErrorResponse(res, 400, "Invalid payment signature");
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * GET /api/razorpay/payment-status
   * Get payment status for an order
   * 
   * Query params:
   * - orderId (required): Razorpay order ID
   */
  static async getPaymentStatus(req: IncomingMessage, res: ServerResponse, url: URL) {
    try {
      const orderId = url.searchParams.get('orderId');
      
      if (!orderId) {
        sendErrorResponse(res, 400, "orderId is required in query parameters");
        return;
      }

      const result = await razorpayService.getPaymentStatus(orderId);
      sendSuccessResponse(res, result);
    } catch (error: any) {
      console.error("Error getting payment status:", error);
      sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * POST /api/razorpay/parse-store
   * GET /api/razorpay/parse-store
   */
  static async parseStore(req: IncomingMessage, res: ServerResponse, url: URL) {
    try {
      let razorpayUrl: string | null;
      
      if (req.method === "POST") {
        const body = await parseJsonBody(req);
        razorpayUrl = body.url;
      } else {
        razorpayUrl = url.searchParams.get('url');
        if (!razorpayUrl) {
          sendErrorResponse(res, 400, "Razorpay store URL is required. Use ?url=https://pages.razorpay.com/stores/st_XXXXX");
          return;
        }
      }

      const result = await razorpayService.parseStore(razorpayUrl!);
      sendSuccessResponse(res, result);
    } catch (error: any) {
      console.error("Error parsing Razorpay store:", error);
      const statusCode = error.message.includes("required") || error.message.includes("Invalid") ? 400 :
                         error.message.includes("not found") ? 404 : 500;
      sendErrorResponse(res, statusCode, error.message || "Failed to parse Razorpay store");
    }
  }

  /**
   * POST /api/razorpay/magic-checkout
   */
  static async magicCheckout(req: IncomingMessage, res: ServerResponse) {
    try {
      const { products, customer, callbacks } = await parseJsonBody(req);
      const result = await razorpayService.createMagicCheckout(products, customer, callbacks);
      sendSuccessResponse(res, result);
    } catch (error: any) {
      console.error("Error creating Magic Checkout:", error);
      const statusCode = error.message.includes("required") ? 400 : 500;
      sendErrorResponse(res, statusCode, error.message || "Failed to create Magic Checkout");
    }
  }

  /**
   * GET /api/razorpay/magic-checkout
   * Returns HTML page with Magic Checkout embedded
   * 
   * Query params:
   * - orderId (required): Razorpay order ID
   * - name: Page title
   * - businessName: Business name to display
   * - customerName: Customer name for prefill
   * - customerEmail: Customer email for prefill
   * - customerPhone: Customer phone for prefill
   * - couponCode: Auto-apply coupon code
   * - callbackUrl: Success callback URL
   * - showCoupons: Show coupon widget (true/false)
   * - address: Customer address
   */
  static async magicCheckoutHTML(req: IncomingMessage, res: ServerResponse, url: URL) {
    try {
      const orderId = url.searchParams.get('orderId');
      
      if (!orderId) {
        sendErrorResponse(res, 400, "orderId is required in query parameters");
        return;
      }

      const params = {
        orderId,
        name: url.searchParams.get('name') || undefined,
        businessName: url.searchParams.get('businessName') || undefined,
        customerName: url.searchParams.get('customerName') || undefined,
        customerEmail: url.searchParams.get('customerEmail') || undefined,
        customerPhone: url.searchParams.get('customerPhone') || undefined,
        couponCode: url.searchParams.get('couponCode') || undefined,
        callbackUrl: url.searchParams.get('callbackUrl') || undefined,
        showCoupons: url.searchParams.get('showCoupons') || undefined,
        address: url.searchParams.get('address') || undefined,
      };

      const html = razorpayService.generateMagicCheckoutHTML(params);

      res.writeHead(200, {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(html);
    } catch (error: any) {
      console.error("Error generating Magic Checkout HTML:", error);
      sendErrorResponse(res, 500, error.message || "Failed to generate Magic Checkout HTML");
    }
  }

  /**
   * GET/POST /payment-success
   * Payment callback page - shows success or failure based on payment verification
   * 
   * Razorpay sends data as POST with form-urlencoded body:
   * - razorpay_payment_id: Payment ID
   * - razorpay_order_id: Order ID
   * - razorpay_signature: Signature for verification
   */
  static async paymentSuccessPage(req: IncomingMessage, res: ServerResponse, url: URL) {
    try {
      let paymentId: string | null = null;
      let orderId: string | null = null;
      let signature: string | null = null;

      // Check if it's a POST request with form data
      if (req.method === 'POST') {
        // Parse form-urlencoded body
        const body = await new Promise<string>((resolve) => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => resolve(data));
        });
        
        const params = new URLSearchParams(body);
        paymentId = params.get('razorpay_payment_id');
        orderId = params.get('razorpay_order_id');
        signature = params.get('razorpay_signature');
      } else {
        // GET request - use query params
        paymentId = url.searchParams.get('razorpay_payment_id');
        orderId = url.searchParams.get('razorpay_order_id');
        signature = url.searchParams.get('razorpay_signature');
      }

      let isSuccess = false;
      let paymentDetails: any = null;

      if (paymentId && orderId && signature) {
        // Verify signature
        isSuccess = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
        
        if (isSuccess) {
          // Get payment details
          try {
            const statusResult = await razorpayService.getPaymentStatus(orderId);
            paymentDetails = statusResult.capturedPayment || { id: paymentId };
          } catch (e) {
            paymentDetails = { id: paymentId };
          }
        }
      }

      const html = razorpayService.generatePaymentStatusHTML({
        isSuccess,
        paymentId: paymentId || undefined,
        orderId: orderId || undefined,
        amount: paymentDetails?.amount,
      });

      res.writeHead(200, {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(html);
    } catch (error: any) {
      console.error("Error generating payment status page:", error);
      const html = razorpayService.generatePaymentStatusHTML({
        isSuccess: false,
        errorMessage: error.message,
      });
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(html);
    }
  }
}

export default RazorpayRoutes;

