import type { ServerResponse } from "node:http";
import config from "../config/index.js";

export const handleCorsOptions = (
  res: ServerResponse,
  additionalHeaders: Record<string, string> = {},
) => {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": config.cors.allowOrigin,
    "Access-Control-Allow-Methods": config.cors.allowMethods,
    "Access-Control-Allow-Headers": config.cors.allowHeaders,
    ...additionalHeaders,
  });
  res.end();
};
