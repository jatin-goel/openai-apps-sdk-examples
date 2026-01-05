import { IncomingMessage, ServerResponse } from "node:http";
import ShopifyService from "../services/shopify.service.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/response.js";

const shopifyService = new ShopifyService();

export class ShopifyRoutes {
  /**
   * GET /api/shopify/products
   * Query params:
   * - query: search term (optional)
   * - skip: pagination offset (optional, default 0)
   * - limit: pagination limit (optional, default 100)
   */
  static async getProducts(req: IncomingMessage, res: ServerResponse, url: URL) {
    try {
      const query = url.searchParams.get('query') || '';
      const skip = parseInt(url.searchParams.get('skip') || '0', 10);
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);

      const result = await shopifyService.searchProducts(query, skip, limit);

      if (result.success) {
        sendSuccessResponse(res, result);
      } else {
        sendErrorResponse(res, 500, result.error || 'Failed to fetch products');
      }
    } catch (error: any) {
      console.error('Error in getProducts route:', error);
      sendErrorResponse(res, 500, error.message || 'Internal server error');
    }
  }
}

export default ShopifyRoutes;

