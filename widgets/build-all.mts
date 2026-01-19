import "dotenv/config";
import { build, type InlineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fg from "fast-glob";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import pkg from "./package.json" with { type: "json" };
import tailwindcss from "@tailwindcss/vite";

const entries = fg.sync("product-list-widget/src/**/index.{tsx,jsx}");
const outDir = "product-list-widget/assets";

const PER_ENTRY_CSS_GLOB = "**/*.{css,pcss,scss,sass}";
const PER_ENTRY_CSS_IGNORE = "**/*.module.*".split(",").map((s) => s.trim());
const GLOBAL_CSS_LIST = [path.resolve("shared/index.css")];

const targets: string[] = [
  "product-list",
];
const builtNames: string[] = [];

function wrapEntryPlugin(
  virtualId: string,
  entryFile: string,
  cssPaths: string[]
): Plugin {
  return {
    name: `virtual-entry-wrapper:${entryFile}`,
    resolveId(id) {
      if (id === virtualId) return id;
    },
    load(id) {
      if (id !== virtualId) {
        return null;
      }

      const cssImports = cssPaths
        .map((css) => `import ${JSON.stringify(css)};`)
        .join("\n");

      return `
    ${cssImports}
    export * from ${JSON.stringify(entryFile)};

    import * as __entry from ${JSON.stringify(entryFile)};
    export default (__entry.default ?? __entry.App);

    import ${JSON.stringify(entryFile)};
  `;
    },
  };
}

fs.rmSync(outDir, { recursive: true, force: true });

// Environment variables to inject at build time
const API_BASE_URL = process.env.BASE_URL || process.env.DEFAULT_BASE_URL || "http://localhost:8000";
const RAZORPAY_STORE_ID = process.env.RAZORPAY_STORE_ID || "";

for (const entryFile of entries) {
  const widgetName = path.basename(path.dirname(entryFile));
  if (targets.length && !targets.includes(widgetName)) {
    continue;
  }

  const entryAbs = path.resolve(entryFile);
  const entryDir = path.dirname(entryAbs);

  // Collect CSS for this entry using the glob(s) rooted at its directory
  const perEntryCss = fg.sync(PER_ENTRY_CSS_GLOB, {
    cwd: entryDir,
    absolute: true,
    dot: false,
    ignore: PER_ENTRY_CSS_IGNORE,
  });

  // Global CSS (Tailwind, etc.), only include those that exist
  const globalCss = GLOBAL_CSS_LIST.filter((p) => fs.existsSync(p));

  // Final CSS list (global first for predictable cascade)
  const cssToInclude = [...globalCss, ...perEntryCss].filter((p) =>
    fs.existsSync(p)
  );

  const virtualId = `\0virtual-entry:${entryAbs}`;

  const createConfig = (): InlineConfig => ({
    define: {
      __API_BASE_URL__: JSON.stringify(API_BASE_URL),
      __RAZORPAY_STORE_ID__: JSON.stringify(RAZORPAY_STORE_ID),
    },
    plugins: [
      wrapEntryPlugin(virtualId, entryAbs, cssToInclude),
      tailwindcss(),
      react(),
      {
        name: "remove-manual-chunks",
        outputOptions(options) {
          if ("manualChunks" in options) {
            delete (options as any).manualChunks;
          }
          return options;
        },
      },
    ],
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "react",
      target: "es2022",
    },
    build: {
      target: "es2022",
      outDir,
      emptyOutDir: false,
      chunkSizeWarningLimit: 2000,
      minify: "esbuild",
      cssCodeSplit: false,
      rollupOptions: {
        input: virtualId,
        output: {
          format: "es",
          entryFileNames: `${widgetName}.js`,
          inlineDynamicImports: true,
          assetFileNames: (info) =>
            (info.name || "").endsWith(".css")
              ? `${widgetName}.css`
              : `[name]-[hash][extname]`,
        },
        preserveEntrySignatures: "allow-extension",
        treeshake: true,
      },
    },
  });

  await build(createConfig());
  builtNames.push(widgetName);
}

const outputs = fs
  .readdirSync(outDir)
  .filter((f) => f.endsWith(".js") || f.endsWith(".css"))
  .map((f) => path.join(outDir, f))
  .filter((p) => fs.existsSync(p));

const versionHash = crypto
  .createHash("sha256")
  .update(pkg.version, "utf8")
  .digest("hex")
  .slice(0, 4);

for (const outputPath of outputs) {
  const dir = path.dirname(outputPath);
  const ext = path.extname(outputPath);
  const base = path.basename(outputPath, ext);
  const hashedName = path.join(dir, `${base}-${versionHash}${ext}`);

  fs.renameSync(outputPath, hashedName);
}

const defaultBaseUrl = process.env.DEFAULT_BASE_URL || "https://localhost:4444";
const baseUrlCandidate = process.env.BASE_URL?.trim() ?? "";
const baseUrlRaw = baseUrlCandidate.length > 0 ? baseUrlCandidate : defaultBaseUrl;
const normalizedBaseUrl = baseUrlRaw.replace(/\/+$/, "") || defaultBaseUrl;

for (const widgetName of builtNames) {
  const dir = outDir;
  const hashedHtmlPath = path.join(dir, `${widgetName}-${versionHash}.html`);
  const liveHtmlPath = path.join(dir, `${widgetName}.html`);
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${normalizedBaseUrl} https: blob:; style-src 'self' 'unsafe-inline' ${normalizedBaseUrl} https:; img-src 'self' data: blob: https: ${normalizedBaseUrl}; font-src 'self' data: ${normalizedBaseUrl} https:; connect-src 'self' ${normalizedBaseUrl} https: wss: blob:; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com;">
  <meta name="widget-domain" content="${normalizedBaseUrl}">
  <script type="module" src="${normalizedBaseUrl}/${widgetName}-${versionHash}.js"></script>
  <link rel="stylesheet" href="${normalizedBaseUrl}/${widgetName}-${versionHash}.css">
</head>
<body>
  <div id="${widgetName}-root"></div>
</body>
</html>
`;
  fs.writeFileSync(hashedHtmlPath, html, { encoding: "utf8" });
  fs.writeFileSync(liveHtmlPath, html, { encoding: "utf8" });
}
