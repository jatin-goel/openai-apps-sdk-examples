import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "widgets/product-list-widget/assets");

// Widget base URL for CSP and domain
const DEFAULT_BASE_URL = "https://localhost:4444";
const BASE_URL = (process.env.BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

export const config = {
  // Server
  port: Number(process.env.PORT) || 8000,

  // Paths
  rootDir: ROOT_DIR,
  assetsDir: ASSETS_DIR,

  // Widget base URL
  baseUrl: BASE_URL,

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
  },

  // MCP
  mcp: {
    ssePath: "/mcp",
    postPath: "/mcp/messages",
  },

  // CORS
  cors: {
    allowOrigin: "*",
    allowMethods: "GET, POST, OPTIONS",
    allowHeaders: "content-type, authorization",
  },
} as const;

export default config;
