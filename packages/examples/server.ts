import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";
import { appendTrailingSlash } from "hono/trailing-slash";

import { getDirectoryContents } from "./getDirectoryContents.ts";
import { findAvailablePort } from "./findAvailablePort.ts";
import { renderDirectoryListing } from "./renderDirectoryListing.ts";

const app = new Hono();
app.use(logger());

// Handle both root and /examples routes
const renderDirectoryListingMiddleware = renderDirectoryListing(
  await getDirectoryContents("./packages/examples"),
  (dir) => `<li><a href="/examples/${dir}/">${dir}</a></li>`
);

app.get("/", appendTrailingSlash(), renderDirectoryListingMiddleware);
app.get("/examples", appendTrailingSlash(), renderDirectoryListingMiddleware);

// Serve static files from the packages/examples directory
app.use(
  "/examples/*",
  serveStatic({
    root: "./packages",
  })
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
      const fileType = filePath.endsWith(".js") || filePath.endsWith(".html")
      if (fileType) {
        console.log("livereload: File changed:", filePath);
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send("reload");
          }
        });
      }
    }
  }
}
