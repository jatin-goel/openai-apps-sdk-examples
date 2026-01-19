/**
 * Razorpay MCP Server
 *
 * Backend server providing:
 * - MCP (Model Context Protocol) integration for widgets
 * - Razorpay payment integration
 * - Order management
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";

import config from "./config/index.js";
import { handleSseRequest, handlePostMessage } from "./mcp/server.js";
import { handleCorsOptions } from "./middleware/cors.js";
import RazorpayRoutes from "./routes/razorpay.routes.js";
import OrderRoutes from "./routes/order.routes.js";
import StaticRoutes from "./routes/static.routes.js";
import ErrorRoutes from "./routes/error.routes.js";

/**
 * Main HTTP server request handler
 */
const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const host = req.headers.host || "localhost";
  let url: URL;

  try {
    url = new URL(req.url, `http://${host}`);
  } catch {
    res.writeHead(400).end("Invalid URL");
    return;
  }

  // Health Check Endpoints
  if (req.method === "GET" && url.pathname === "/live") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/ready") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // MCP Endpoints
  if (
    req.method === "OPTIONS" &&
    (url.pathname === config.mcp.ssePath ||
      url.pathname === config.mcp.postPath)
  ) {
    handleCorsOptions(res);
    return;
  }

  if (req.method === "GET" && url.pathname === config.mcp.ssePath) {
    await handleSseRequest(res, config.mcp.postPath);
    return;
  }

  if (req.method === "POST" && url.pathname === config.mcp.postPath) {
    await handlePostMessage(req, res, url);
    return;
  }

  // Razorpay Endpoints
  if (req.method === "OPTIONS" && url.pathname.startsWith("/api/razorpay/")) {
    handleCorsOptions(res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/razorpay/create-order") {
    await RazorpayRoutes.createOrder(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/razorpay/mark-payment-success") {
    await RazorpayRoutes.markPaymentSuccess(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/razorpay/payment-status") {
    await RazorpayRoutes.getPaymentStatus(req, res, url);
    return;
  }

  if (
    (req.method === "POST" || req.method === "GET") &&
    url.pathname === "/api/razorpay/parse-store"
  ) {
    await RazorpayRoutes.parseStore(req, res, url);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/razorpay/magic-checkout") {
    await RazorpayRoutes.magicCheckoutHTML(req, res, url);
    return;
  }

  if (
    (req.method === "GET" || req.method === "POST") &&
    url.pathname === "/payment-success"
  ) {
    await RazorpayRoutes.paymentSuccessPage(req, res, url);
    return;
  }

  // Checkout Endpoints
  if (req.method === "OPTIONS" && url.pathname.startsWith("/api/checkout/")) {
    handleCorsOptions(res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/checkout/proceed") {
    await OrderRoutes.proceedToCheckout(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/orders/")) {
    await OrderRoutes.getOrderById(req, res, url);
    return;
  }

  // Static Assets
  if (req.method === "GET" && url.pathname.startsWith("/")) {
    const served = StaticRoutes.serveAsset(req, res, url);
    if (served) {
      return;
    }
  }

  // Custom 404 page
  ErrorRoutes.serve404Page(res);
};

// Create and start server
const httpServer = createServer(requestHandler);

httpServer.on("clientError", (_err: Error, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

const port = config.port || 8000;

httpServer.listen(port, () => {
  console.log(`\n🚀 Razorpay MCP Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Server listening on http://localhost:${port}`);
  console.log(`\n❤️  Health Check Endpoints:`);
  console.log(`   Liveness:       GET  /live`);
  console.log(`   Readiness:      GET  /ready`);
  console.log(`\n🔌 MCP Endpoints:`);
  console.log(`   SSE Stream:     GET  ${config.mcp.ssePath}`);
  console.log(`   Message Post:   POST ${config.mcp.postPath}?sessionId=...`);
  console.log(`\n💳 Razorpay Endpoints:`);
  console.log(`   Create Order:   POST /api/razorpay/create-order`);
  console.log(
    `   Payment Status: GET  /api/razorpay/payment-status?orderId=...`,
  );
  console.log(`   Parse Store:    GET  /api/razorpay/parse-store?url=...`);
  console.log(
    `   Magic Checkout: GET  /api/razorpay/magic-checkout?orderId=...`,
  );
  console.log(`\n📦 Order Endpoints:`);
  console.log(`   Checkout:       POST /api/checkout/proceed`);
  console.log(`   Get Order:      GET  /api/orders/:orderId`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
