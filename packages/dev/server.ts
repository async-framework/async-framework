import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/deno";
import { appendTrailingSlash } from "hono/trailing-slash";
import { dirname, fromFileUrl, join, relative } from "@std/path";

import {
  findAvailablePort,
  getDirectoryContents,
  renderDirectoryListing,
  createBundler,
  // createCache
} from "./server-utils/index.ts";

const rootRepoDir = Deno.cwd();
const serverDirectory = dirname(fromFileUrl(import.meta.url));
const packagesDirectory = join(rootRepoDir, "packages");
const exampleDirectory = join(packagesDirectory, "examples");
console.log("CWD directory:", rootRepoDir);
console.log("Examples directory:", exampleDirectory);

const CACHE = new Map();
// const cacheResponse = createCache(CACHE, 3600);
const app = new Hono();

app.use(logger());


// custom-element signals
app.get("/custom-element-signals.js", async (c) => {
  try {
    const bundleContent = await bundle(
      join(packagesDirectory, "custom-element-signals/src/index.ts"),
    );
    return c.body(bundleContent, 200, {
      "Content-Type": "application/javascript",
      "Cache-Control": "max-age=3600",
    });
  } catch (error: unknown | Error) {
    console.error("Bundling error for custom-element-signals:", error);
    return c.text(
      `Error creating bundle: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500,
    );
  }
});


// Add this route to handle .tsx files
app.use(async (c, next) => {
  const path = c.req.path;
  const isTsx = path.endsWith(".tsx");
  const isTs = path.endsWith(".ts");
  const isJs = path.endsWith(".js");
  const notPkg = !/async-framework|livereload/.test(path);

  if ((isTsx || isTs || isJs) && notPkg) {
    console.log("GET: ", path);
    try {
      // If .js is requested, try to find a .ts file first
      let fullPath = join(packagesDirectory, path);
      if (isJs) {
        const tsPath = fullPath.replace(/\.js$/, '.ts');
        try {
          // Check if .ts version exists
          await Deno.stat(tsPath);
          fullPath = tsPath; // Use the .ts file if it exists
        } catch {
          // If .ts doesn't exist, continue with .js path
        }
      }

      const bundleContent = await bundle(fullPath);
      return c.body(bundleContent, 200, {
        "Content-Type": "application/javascript",
        // "Cache-Control": "max-age=3600",
        "X-Bundle-Path": relative(rootRepoDir, fullPath),
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
  } else {
    return next();
  }
});

// Get the directory of the current file
const bundle = createBundler(rootRepoDir);
// bundle framework code
const createPackageBundle = (entryPath: string) => {
  return async (c) => {
    try {
      // console.log("GET BUNDLE: ", entryPath);
      const absolutePath = join(packagesDirectory, entryPath);
      const bundleContent = await bundle(absolutePath);
      return c.body(bundleContent, 200, {
        "Content-Type": "application/javascript",
        // "Cache-Control": "max-age=3600",
        "X-Bundle-Path": relative(rootRepoDir, absolutePath),
      });
    } catch (error: unknown | Error) {
      console.error("Bundling error for async-framework:", error);
      return c.text(
        `Error creating bundle: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500,
      );
    }
  }
}
app.get("/async-framework.js", createPackageBundle("async-framework/index.ts"));
app.get("/async-framework.ts", createPackageBundle("async-framework/index.ts"));
app.get("/async-framework/jsx-runtime.ts", createPackageBundle("async-framework/jsx-runtime.ts"));
app.get("/@async/framework.js", createPackageBundle("async-framework/index.ts"));
app.get("/@async/framework.ts", createPackageBundle("async-framework/index.ts"));
app.get("/@async/framework/jsx-runtime.ts", createPackageBundle("async-framework/jsx-runtime.ts"));


// Handle both root and /examples routes
const renderDirectoryListingMiddleware = renderDirectoryListing(
  await getDirectoryContents(
    Deno.readDir(exampleDirectory),
  ),
  (dir) => {
    // Add this function to provide descriptions for each example
    function getExampleDescription(dir: string): string {
      const descriptions: Record<string, string> = {
        "hello-world":
          "A simple hello world example demonstrating the basics of Async Framework.",
        "todo-app":
          "A simple todo list application demonstrating state management and user interactions.",
        "note-app":
          "A note-taking app showcasing dynamic content creation and local storage.",
        "tic-tac-toe":
          "The classic Tic-Tac-Toe game implemented with Async Framework.",
        "resource-management":
          "An example demonstrating resource management and state management.",
        "drag-and-drop":
          "An example demonstrating drag and drop functionality.",
        "kanban-board":
          "A kanban board example demonstrating state management and user interactions.",
        "jsx-client":
          "An example demonstrating how to use JSX for client rendering with Async Framework.",
        "custom-elements-signals-app":
          "An example demonstrating how to use Custom Elements with Async Framework.",
        "custom-signals-demo":
          "An example demonstrating how to use Signals with Async Framework.",
        "qwik-hello-world": /*html*/ `
        <span class='text-red-500'>WIP:</span>
        A simple hello world example demonstrating the basics of Qwik and Async Framework.
        `,
      };

      return descriptions[dir] ||
        "An example showcasing Async Framework capabilities.";
    }

    const dirName = dir.replace(/-/g, " ");
    const description = getExampleDescription(dir);
    return /*html*/ `
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
    <h2 class="text-2xl font-semibold text-gray-800 mb-2">
      ${dirName}
    </h2>
    <p class="text-gray-600 mb-4">
      ${description}
    </p>
    <a href="/examples/${dir}/" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-300">
      View Example
    </a>
  </div>
  `;
  },
);

app.get("/", appendTrailingSlash(), renderDirectoryListingMiddleware);
app.get("/examples", appendTrailingSlash(), renderDirectoryListingMiddleware);



// Update the /bundle route
app.get("/bundle", async (c) => {
  const entryPoint = c.req.query("entry");
  if (!entryPoint) {
    return c.text("No entry point specified", 400);
  }

  try {
    const bundleContent = await bundle(entryPoint);
    return c.body(bundleContent, 200, {
      "Content-Type": "application/javascript",
      // "Cache-Control": "max-age=3600",
      "X-Bundle-Path": relative(rootRepoDir, entryPoint),
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
    root: packagesDirectory,
    onFound(path, c) {
      console.log("GET static: ", path, "found");
    }
  }),
);

// WebSocket connections for live reload
const clients = new Set<WebSocket>();

// serve server side livereload script
app.get("/livereload", (c) => {
  const { response, socket } = Deno.upgradeWebSocket(c.req.raw);
  clients.add(socket);

  socket.onclose = () => {
    clients.delete(socket);
  };

  return response;
});
// serve client side livereload script
app.get("/livereload.js", async (c) => {
  try {
    const livereloadJs = await Deno.readTextFile(
      join(serverDirectory, "livereload.js"),
    );
    return c.body(livereloadJs, 200, {
      "Content-Type": "application/javascript",
      // "Cache-Control": "max-age=3600",
      "X-Bundle-Path": join(serverDirectory, "livereload.js"),
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error) {
      console.error("GET: /livereload.js", error.name);
    } else {
      console.error("Error reading livereload.js:");
    }
    return c.text("/* Error reading livereload.js */", 500);
  }
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
  const watchPath = "./packages";
  const packageDirectory = Array.from(Deno.readDirSync(watchPath)).map(
    (dir) => relative(rootRepoDir, watchPath + "/" + dir.name),
  );
  console.log(
    "livereload: Watching for file changes in",
    packageDirectory,
  );
  for await (const event of Deno.watchFs(watchPath)) {
    if (event.kind === "modify") {
      const filePath = event.paths[0];
      const fileType = filePath.endsWith(".js") || filePath.endsWith(".html") ||
        filePath.endsWith(".ts");

      if (fileType) {
        console.log(
          "livereload: File changed:",
          filePath.replace(rootRepoDir, ""),
        );
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            if (filePath.endsWith(".ts")) {
              CACHE.forEach((_value, key) => {
                const normalizedKey = key.replace("/packages/", "").replace(
                  /^\//,
                  "",
                ).replace(/.js$/, "");
                const changedFile = packageDirectory.some((dir) => {
                  const result = dir.includes(normalizedKey);
                  return result;
                });
                if (changedFile && CACHE.has(key)) {
                  console.log(
                    "livereload: clearing cache for",
                    key,
                  );
                  CACHE.delete(key);
                }
              });
            }
            // Add a delay before sending the reload message
            setTimeout(() => {
              if (client && client.readyState === WebSocket.OPEN) {
                client.send("reload");
              }
            }, 1000); // 1 second delay
          }
        });
      }
    }
  }
}
