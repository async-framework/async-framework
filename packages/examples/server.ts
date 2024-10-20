import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";
import { appendTrailingSlash } from "hono/trailing-slash";
import { dirname, fromFileUrl, join } from "@std/path";

import { getDirectoryContents } from "./getDirectoryContents.ts";
import { findAvailablePort } from "./findAvailablePort.ts";
import { renderDirectoryListing } from "./renderDirectoryListing.ts";
import { createBundler } from './bundler.ts';
import { createCache } from "./request-cache.ts";

const rootDir = dirname(fromFileUrl(import.meta.url));
const CACHE = new Map();
const cacheResponse = createCache(CACHE, 3600);
const app = new Hono();


app.use(logger());

// Handle both root and /examples routes
const renderDirectoryListingMiddleware = renderDirectoryListing(
  await getDirectoryContents("./packages/examples"),
  (dir) => `<li><a href="/examples/${dir}/">${dir}</a></li>`,
);


app.get("/", appendTrailingSlash(), renderDirectoryListingMiddleware);
app.get("/examples", appendTrailingSlash(), renderDirectoryListingMiddleware);

app.get('/tailwind.css', cacheResponse, async (c) => {
  try {
    const tailwindCss = await Deno.readTextFile(join(rootDir, './tailwind.css'));
    return c.body(tailwindCss, 200, {
      "Content-Type": "text/css",
      "Cache-Control": "max-age=3600",
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error) {
      console.error('GET: /tailwind.css', error.name);
    } else {
      console.error("Error reading tailwind.css:");
    }
    return c.text("/* Error reading tailwind.css */", 500);
  }
});
// Get the directory of the current file
const bundle = createBundler(rootDir);
// bundle framework code
app.get('/examples/*/async-framework', cacheResponse, async (c) => {
  try {
    const bundleContent = await bundle(
      "./__async-framework__/async-framework.ts",
      "AsyncFramework",
    );
    return c.body(bundleContent, 200, {
      "Content-Type": "application/javascript",
      "Cache-Control": "max-age=3600",
    });
  } catch (error: unknown | Error) {
    console.error("Bundling error for @async/framework:", error);
    return c.text(
      `Error creating bundle: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500,
    );
  }
});

// Update the /bundle route
app.get("/bundle", cacheResponse, async (c) => {
  const entryPoint = c.req.query("entry");
  if (!entryPoint) {
    return c.text("No entry point specified", 400);
  }

  try {
    const bundleContent = await bundle(entryPoint);
    return c.body(bundleContent, 200, {
      "Content-Type": "application/javascript",
      "Cache-Control": "max-age=3600",
    });
  } catch (error: unknown | Error) {
    console.error("Bundling error:", error);
    return c.text(
      `Error creating bundle: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500,
    );
  }
});

// Serve static files from the packages/examples directory
app.use(
  "/examples/*",
  serveStatic({
    root: "./packages",
  }),
);



// WebSocket connections for live reload
const clients = new Set<WebSocket>();

app.get("/livereload", (c) => {
  const { response, socket } = Deno.upgradeWebSocket(c.req.raw);
  clients.add(socket);

  socket.onclose = () => {
    clients.delete(socket);
  };

  return response;
});

// Replace the existing port assignment and console.log with this
const port = await findAvailablePort(3000, 3100);
console.log(`HTTP server running on http://localhost:${port}`);

// Use Deno.serve with the --watch flag
if (import.meta.main) {
  Deno.serve({ port: port }, app.fetch);
}

// File watcher for livereload
if (Deno.args.includes("--livereload")) {
  console.log("livereload: Watching for file changes...");
  for await (const event of Deno.watchFs("./packages/examples")) {
    if (event.kind === "modify") {
      const filePath = event.paths[0];
      const fileType = filePath.endsWith(".js") || filePath.endsWith(".html") || filePath.endsWith(".ts");

      if (fileType) {
        console.log("livereload: File changed:", filePath);
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            if (filePath.endsWith(".ts")) {
              CACHE.forEach((_value, key) => {
                if (/async-framework/.test(key)) {
                  console.log('livereload: clearing cache for', key);
                  CACHE.delete(key);
                }
              });
            }
            client.send("reload");
          }
        });
      }
    }
  }
}
