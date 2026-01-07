import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "/widgets/assets");

export const config = {
  // Server Configuration
  port: Number(process.env.PORT),
  host: process.env.HOST,

  // Paths
  rootDir: ROOT_DIR,
  assetsDir: ASSETS_DIR,

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: "7d"
  },

  // Razorpay Configuration
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
  },

  // MCP Configuration
  mcp: {
    ssePath: "/mcp",
    postPath: "/mcp/messages"
  },

  // CORS Configuration
  cors: {
    allowOrigin: "*",
    allowMethods: "GET, POST, OPTIONS",
    allowHeaders: "content-type, authorization"
  }
} as const;

export default config;

