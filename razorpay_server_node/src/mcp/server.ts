import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  widgets,
  widgetsById,
  widgetsByUri,
  widgetDescriptorMeta,
  widgetInvocationMeta,
} from "./widgets.js";
import type { SessionRecord } from "../types/index.js";

// Tool input schema
const toolInputSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Search query for products (e.g., 'phone', 'laptop')",
    },
    skip: {
      type: "number",
      description: "Number of results to skip for pagination (default: 0)",
      default: 0,
    },
  },
  required: ["query"],
  additionalProperties: false,
} as const;

const toolInputParser = z.object({
  query: z.string(),
  skip: z.number().optional().default(0),
});

// Define tools
const tools: Tool[] = widgets.map((widget) => ({
  name: widget.id,
  description: widget.title,
  inputSchema: toolInputSchema,
  title: widget.title,
  _meta: widgetDescriptorMeta(widget),
  // ChatGPT requires securitySchemes to show tools as public
  securitySchemes: [{ type: "noauth" }],
  // To disable the approval prompt for the widgets
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
}));

// Define resources
const resources: Resource[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetDescriptorMeta(widget),
}));

// Define resource templates
const resourceTemplates: ResourceTemplate[] = widgets.map((widget) => ({
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetDescriptorMeta(widget),
}));

/**
 * Create a new Razorpay MCP server instance
 */
export function createMcpServer(): Server {
  const server = new Server(
    {
      name: "razorpay-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources,
    }),
  );

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const widget = widgetsByUri.get(request.params.uri);

      if (!widget) {
        throw new Error(`Unknown resource: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: widgetDescriptorMeta(widget),
          },
        ],
      };
    },
  );

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates,
    }),
  );

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools,
    }),
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const widget = widgetsById.get(request.params.name);

      if (!widget) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const args = toolInputParser.parse(request.params.arguments ?? {});

      return {
        content: [
          {
            type: "text",
            text: widget.responseText,
          },
        ],
        structuredContent: {
          query: args.query,
          skip: args.skip || 0,
        },
        _meta: widgetInvocationMeta(widget),
      };
    },
  );

  return server;
}

// Session storage with metadata
interface SessionWithMetadata extends SessionRecord {
  createdAt: number;
  lastActivity: number;
}

const sessionsWithMetadata = new Map<string, SessionWithMetadata>();

// Export sessions for backward compatibility
export const sessions = new Map<string, SessionRecord>();

// Session timeout: 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Cleanup stale sessions every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  
  for (const [sessionId, session] of sessionsWithMetadata.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      // Close the server
      session.server.close().catch(() => {
        // Session cleanup error - silently handled
      });
      
      // Remove from both maps
      sessionsWithMetadata.delete(sessionId);
      sessions.delete(sessionId);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Handle SSE connection request
 */
export async function handleSseRequest(res: any, postPath: string) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createMcpServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  const now = Date.now();
  const sessionRecord: SessionRecord = { server, transport };
  const sessionWithMetadata: SessionWithMetadata = {
    ...sessionRecord,
    createdAt: now,
    lastActivity: now,
  };

  sessions.set(sessionId, sessionRecord);
  sessionsWithMetadata.set(sessionId, sessionWithMetadata);

  let isClosing = false;
  transport.onclose = async () => {
    if (isClosing) return; // Prevent recursive calls
    isClosing = true;
    
    sessions.delete(sessionId);
    sessionsWithMetadata.delete(sessionId);
    
    try {
      await server.close();
    } catch {
      // Server close error - silently handled
    }
  };

  transport.onerror = () => {
    // Transport error - silently handled
  };

  try {
    await server.connect(transport);
  } catch {
    sessions.delete(sessionId);
    sessionsWithMetadata.delete(sessionId);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

/**
 * Handle POST message to MCP
 */
export async function handlePostMessage(req: any, res: any, url: URL) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  // Update last activity timestamp
  const sessionWithMetadata = sessionsWithMetadata.get(sessionId);
  if (sessionWithMetadata) {
    sessionWithMetadata.lastActivity = Date.now();
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch {
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}
