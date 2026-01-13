import fs from "node:fs";
import path from "node:path";
import config from "../config/index.js";
import type { Widget } from "../types/index.js";

/**
 * Read widget HTML from assets directory
 * Returns placeholder HTML if widget not found
 */
export function readWidgetHtml(componentName: string): string {
  if (!fs.existsSync(config.assetsDir)) {
    console.warn(`Widget assets directory not found: ${config.assetsDir}`);
    return getPlaceholderHtml(componentName);
  }

  const directPath = path.join(config.assetsDir, `${componentName}.html`);
  console.log("asset path is " + directPath);
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
    console.warn(
      `Widget HTML for "${componentName}" not found, using placeholder`,
    );
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
  },
];

export const widgetsById = new Map<string, Widget>();
export const widgetsByUri = new Map<string, Widget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});
