import type { ServerResponse } from "node:http";

export class ErrorRoutes {
  /**
   * Serve a custom 404 error page
   */
  static serve404Page(res: ServerResponse): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Our Store</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: slideUp 0.5s ease-out;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .icon {
      width: 120px;
      height: 120px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
    
    .icon svg {
      width: 60px;
      height: 60px;
      stroke: white;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    
    .subtitle {
      font-size: 18px;
      color: #4a5568;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    
    .info-box {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }
    
    .info-box h2 {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-box h2 svg {
      width: 20px;
      height: 20px;
      stroke: #667eea;
    }
    
    .info-box p {
      font-size: 15px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .endpoint {
      background: white;
      border: 1px solid #cbd5e0;
      border-radius: 8px;
      padding: 12px 16px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      color: #667eea;
      font-weight: 600;
      display: inline-block;
      margin-top: 8px;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .feature {
      padding: 16px;
      background: #f7fafc;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .feature:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .feature svg {
      width: 32px;
      height: 32px;
      stroke: #667eea;
      margin-bottom: 8px;
    }
    
    .feature-title {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
    }
    
    .cta {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    
    @media (max-width: 640px) {
      .container {
        padding: 32px 24px;
      }
      
      h1 {
        font-size: 26px;
      }
      
      .subtitle {
        font-size: 16px;
      }
      
      .features {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
    
    <h1>Welcome to Our Store! 🎉</h1>
    <p class="subtitle">
      We're excited to have you here! This is a Razorpay-powered store with MCP integration.
    </p>
    
    <div class="info-box">
      <h2>
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        How to Access the Store
      </h2>
      <p>
        To browse products and make purchases, please use our MCP (Model Context Protocol) endpoint. 
        This endpoint provides access to our product catalog and checkout functionality.
      </p>
      <div class="endpoint">/mcp</div>
    </div>
    
    <div class="features">
      <div class="feature">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        <div class="feature-title">Product Catalog</div>
      </div>
      <div class="feature">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <div class="feature-title">Shopping Cart</div>
      </div>
      <div class="feature">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
        <div class="feature-title">Secure Checkout</div>
      </div>
    </div>
    
    <a href="/mcp" class="cta">Go to MCP Endpoint →</a>
  </div>
</body>
</html>
    `;

    res.writeHead(404, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(html);
  }
}

export default ErrorRoutes;

