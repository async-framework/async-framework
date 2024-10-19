import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";
import { appendTrailingSlash } from "hono/trailing-slash";

import { getDirectoryContents } from "./getDirectoryContents.ts";
import { findAvailablePort } from "./findAvailablePort.ts";
import { renderDirectoryListing } from "./renderDirectoryListing.ts";

// Add these imports using JSR


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

// Replace the existing port assignment and console.log with this
const port = await findAvailablePort(3000, 3100);
console.log(`HTTP server running on http://localhost:${port}`);

// Modify the export to include serving the app
Deno.serve({ port: port }, app.fetch) 