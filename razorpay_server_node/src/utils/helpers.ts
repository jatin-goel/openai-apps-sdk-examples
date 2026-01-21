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
 * Validates Razorpay store URL with strict hostname and HTTPS enforcement
 * Prevents SSRF attacks by validating hostname, protocol, and DNS resolution
 */
export const validateRazorpayStoreUrl = async (
  url: string | undefined | null
): Promise<{ valid: boolean; error?: string; url?: string }> => {
  if (!url) {
    return { valid: false, error: "URL is required" };
  }

  try {
    const trimmedUrl = url.trim();
    
    // Parse URL to extract components
    const urlObj = new URL(trimmedUrl);
    
    // 1. HTTPS enforcement - block HTTP
    if (urlObj.protocol !== 'https:') {
      return { valid: false, error: "Only HTTPS URLs are allowed" };
    }
    
    // 2. Strict hostname validation - only allow pages.razorpay.com and razorpay.com
    const allowedHostnames = ['pages.razorpay.com', 'razorpay.com'];
    if (!allowedHostnames.includes(urlObj.hostname.toLowerCase())) {
      return { 
        valid: false, 
        error: `Invalid hostname. Only ${allowedHostnames.join(' and ')} are allowed` 
      };
    }
    
    // 3. Path validation - must contain /stores/
    if (!urlObj.pathname.includes('/stores/')) {
      return { 
        valid: false, 
        error: "Invalid path. URL must contain /stores/ path" 
      };
    }
    
    // 4. DNS rebinding protection - resolve DNS and block private/internal IPs
    try {
      const dns = await import('node:dns');
      const { promisify } = await import('node:util');
      const resolve4 = promisify(dns.resolve4);
      
      const addresses = await resolve4(urlObj.hostname);
      
      // Check if any resolved IP is private/internal
      for (const ip of addresses) {
        if (isPrivateOrInternalIP(ip)) {
          return { 
            valid: false, 
            error: "DNS resolution points to private or internal IP address" 
          };
        }
      }
    } catch (dnsError) {
      // DNS resolution failed - could be a sign of DNS rebinding attempt
      return { 
        valid: false, 
        error: "DNS resolution failed for hostname" 
      };
    }
    
    return { valid: true, url: trimmedUrl };
  } catch (e) {
    return { valid: false, error: "Invalid URL format" };
  }
};

/**
 * Checks if an IP address is private or internal
 * Blocks: loopback, private ranges, link-local, multicast
 */
const isPrivateOrInternalIP = (ip: string): boolean => {
  const parts = ip.split('.').map(Number);
  
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Invalid IP format - block it
  }
  
  // Loopback: 127.0.0.0/8
  if (parts[0] === 127) {
    return true;
  }
  
  // Private ranges:
  // 10.0.0.0/8
  if (parts[0] === 10) {
    return true;
  }
  
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }
  
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) {
    return true;
  }
  
  // Link-local: 169.254.0.0/16
  if (parts[0] === 169 && parts[1] === 254) {
    return true;
  }
  
  // Multicast: 224.0.0.0/4
  if (parts[0] >= 224 && parts[0] <= 239) {
    return true;
  }
  
  // Broadcast: 255.255.255.255
  if (parts[0] === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) {
    return true;
  }
  
  // 0.0.0.0/8
  if (parts[0] === 0) {
    return true;
  }
  
  return false;
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
