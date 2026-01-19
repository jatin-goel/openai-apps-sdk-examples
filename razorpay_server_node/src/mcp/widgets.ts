import fs from "node:fs";
import path from "node:path";
import config from "../config/index.js";
import type { Widget, WidgetCSP } from "../types/index.js";

/**
 * Build Widget CSP object for OpenAI
 * This format is required by OpenAI's widgetCSP metadata field
 */
function buildWidgetCSP(baseUrl: string): WidgetCSP {
  return {
    connect_domains: [baseUrl, "https://s3.ap-south-1.amazonaws.com"],
    resource_domains: [baseUrl, "https://s3.ap-south-1.amazonaws.com"],
  };
}

/**
 * Read widget HTML from assets directory
 * Returns placeholder HTML if widget not found
 */
export function readWidgetHtml(componentName: string): string {
  if (!fs.existsSync(config.assetsDir)) {
    return getPlaceholderHtml(componentName);
  }

  const directPath = path.join(config.assetsDir, `${componentName}.html`);
  let htmlContents: string | null = null;

  if (fs.existsSync(directPath)) {
    htmlContents = fs.readFileSync(directPath, "utf8");
  } else {
    const candidates = fs
      .readdirSync(config.assetsDir)
      .filter(
        (file) =>
          file.startsWith(`${componentName}-`) && file.endsWith(".html"),
      )
      .sort();
    const fallback = candidates[candidates.length - 1];
    if (fallback) {
      htmlContents = fs.readFileSync(
        path.join(config.assetsDir, fallback),
        "utf8",
      );
    }
  }

  if (!htmlContents) {
    return getPlaceholderHtml(componentName);
  }

  return htmlContents;
}

/**
 * Generate placeholder HTML for missing widgets
 */
function getPlaceholderHtml(componentName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${componentName}</title>
  <style>
    body { font-family: system-ui; padding: 20px; }
    .placeholder { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
  </style>
</head>
<body>
  <div class="placeholder">
    <h3>Widget: ${componentName}</h3>
    <p>Widget assets not built. Run "pnpm run build" in the root directory to generate assets.</p>
  </div>
</body>
</html>`;
}

/**
 * Widget descriptor metadata
 */
export function widgetDescriptorMeta(widget: Widget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/widgetCSP": widget.csp,
    "openai/widgetDomain": widget.domain,
  } as const;
}

/**
 * Widget invocation metadata
 */
export function widgetInvocationMeta(widget: Widget) {
  return {
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
  } as const;
}

/**
 * Widget CSP and domain derived from config
 */
const widgetCSP = buildWidgetCSP(config.baseUrl);
const widgetDomain = config.baseUrl;

/**
 * Define all available widgets
 */
export const widgets: Widget[] = [
  {
    id: "product-search",
    title: "Search Products",
    templateUri: "ui://widget/product-search.html",
    invoking: "Searching products",
    invoked: "Products found",
    html: readWidgetHtml("product-list"),
    responseText: "Product search results displayed!",
    csp: widgetCSP,
    domain: widgetDomain,
  },
];

export const widgetsById = new Map<string, Widget>();
export const widgetsByUri = new Map<string, Widget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});
