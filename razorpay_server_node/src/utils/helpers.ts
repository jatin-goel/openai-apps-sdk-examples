import { IncomingMessage } from "node:http";

/**
 * Reads the request body from an HTTP request (internal use only)
 */
const getRequestBody = (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
};

/**
 * Parses JSON from request body safely
 */
export const parseJsonBody = async (req: IncomingMessage): Promise<any> => {
  const body = await getRequestBody(req);
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
};

/**
 * Sends a JSON response (internal use only)
 */
const sendJsonResponse = (
  res: any,
  statusCode: number,
  data: any,
  headers: Record<string, string> = {},
) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...headers,
  });
  res.end(JSON.stringify(data));
};

/**
 * Sends an error response
 */
export const sendErrorResponse = (
  res: any,
  statusCode: number,
  error: string,
) => {
  sendJsonResponse(res, statusCode, {
    success: false,
    error,
  });
};

/**
 * Sends a success response
 */
export const sendSuccessResponse = (
  res: any,
  data: any,
  statusCode: number = 200,
) => {
  sendJsonResponse(res, statusCode, {
    success: true,
    ...data,
  });
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export const escapeHtml = (unsafe: string | undefined | null): string => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validates and sanitizes a URL to prevent javascript: protocol and other malicious schemes
 * Returns a safe URL or a default safe URL if validation fails
 */
export const sanitizeUrl = (
  url: string | undefined | null,
  defaultUrl: string = "https://example.com"
): string => {
  if (!url) return defaultUrl;
  
  try {
    const trimmedUrl = url.trim();
    
    // Check for dangerous protocols
    const dangerousProtocols = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'about:',
    ];
    
    const lowerUrl = trimmedUrl.toLowerCase();
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return defaultUrl;
      }
    }
    
    // Validate URL structure
    const urlObj = new URL(trimmedUrl);
    
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return defaultUrl;
    }
    
    return trimmedUrl;
  } catch (e) {
    // Invalid URL format
    return defaultUrl;
  }
};

/**
 * Escapes a string for safe use in JavaScript string literals
 */
export const escapeJs = (unsafe: string | undefined | null): string => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/</g, "\\x3C")
    .replace(/>/g, "\\x3E");
};
