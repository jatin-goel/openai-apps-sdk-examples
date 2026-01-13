/**
 * Main exports for the Razorpay MCP Server
 */

// Configuration
export { default as config } from "./config/index.js";

// Services
export { RazorpayService } from "./services/razorpay.service.js";
export { OrderService } from "./services/order.service.js";

// Routes
export { RazorpayRoutes } from "./routes/razorpay.routes.js";
export { OrderRoutes } from "./routes/order.routes.js";
export { StaticRoutes } from "./routes/static.routes.js";

// MCP
export {
  createMcpServer,
  sessions,
  handleSseRequest,
  handlePostMessage,
} from "./mcp/server.js";
export { widgets, widgetsById, widgetsByUri } from "./mcp/widgets.js";

// Middleware
export { handleCorsOptions, setCorsHeaders } from "./middleware/cors.js";

// Utils
export {
  getRequestBody,
  parseJsonBody,
  sendJsonResponse,
  sendErrorResponse,
  sendSuccessResponse,
} from "./utils/helpers.js";

// Types
export type {
  Widget,
  SessionRecord,
  ApiResponse,
  OrderLineItem,
  CreateOrderRequest,
  PaymentStatus,
} from "./types/index.js";
