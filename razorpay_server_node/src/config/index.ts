import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "widgets/product-list-widget/assets");

export const config = {
  // Server
  port: Number(process.env.PORT) || 8000,

  // Paths
  rootDir: ROOT_DIR,
  assetsDir: ASSETS_DIR,

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
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
