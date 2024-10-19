import { Hono, type Context } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";
import { appendTrailingSlash } from "hono/trailing-slash";

import { getDirectoryContents } from "./getDirectoryContents.ts";
import { generateDirectoryListing } from "./generateDirectoryListing.ts";
import { findAvailablePort } from "./findAvailablePort.ts";

// Add these imports using JSR


const app = new Hono();
app.use(logger());

// Render the directory listing
async function renderDirectoryListing(c: Context) {
  const directories = await getDirectoryContents("./packages/examples");
  return c.html(/*html*/ `
    <h1>Examples</h1>
    <ul>
      ${generateDirectoryListing(
        directories,
        (dir) => `<li><a href="/examples/${dir}/">${dir}</a></li>`
      )}
    </ul>
  `);
}

// Handle both root and /examples routes
app.get("/", appendTrailingSlash(), renderDirectoryListing);
app.get("/examples", appendTrailingSlash(), renderDirectoryListing);

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