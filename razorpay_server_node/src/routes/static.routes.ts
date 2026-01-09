import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import config from "../config/index.js";

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.map': 'application/json'
};

const ALLOWED_EXTENSIONS = new Set(['.js', '.css', '.html', '.map']);

export class StaticRoutes {
  /**
   * Serve static assets from the assets directory
   */
  static serveAsset(req: IncomingMessage, res: ServerResponse, url: URL): boolean {
    const fileName = url.pathname.slice(1);
    const filePath = path.join(config.assetsDir, fileName);
    const ext = path.extname(fileName);

    // Only serve files from assets directory with allowed extensions
    if (!filePath.startsWith(config.assetsDir) || !ALLOWED_EXTENSIONS.has(ext)) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath);
      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      });
      res.end(content);
      return true;
    } catch {
      return false;
    }
  }
}

export default StaticRoutes;
