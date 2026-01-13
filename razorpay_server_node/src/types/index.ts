/**
 * Type definitions for the Razorpay MCP Server
 */

/**
 * OpenAI Widget CSP configuration
 * @see https://developers.openai.com/apps-sdk/build/mcp-server/#content-security-policy-csp
 */
export interface WidgetCSP {
  connect_domains: string[];
  resource_domains: string[];
  redirect_domains?: string[];
  frame_domains?: string[];
}

// Widget types
export interface Widget {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
  csp: WidgetCSP;
  domain: string;
}

// Session types
export interface SessionRecord {
  server: any;
  transport: any;
}

// Order types
export interface OrderLineItem {
  line_item_id: string;
  quantity: number;
}

export interface CreateOrderRequest {
  lineItems: OrderLineItem[];
  entityId: string;
  notes?: Record<string, any>;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Payment types
export interface PaymentStatus {
  orderId: string;
  payments: any[];
  count: number;
  hasCapturedPayment: boolean;
  capturedPayment: any | null;
}
