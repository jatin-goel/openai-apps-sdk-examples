/**
 * Type definitions for the Razorpay MCP Server
 */

// Widget types
export interface Widget {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
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
