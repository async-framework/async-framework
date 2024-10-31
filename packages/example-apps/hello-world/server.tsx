import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { findAvailablePort } from "../../dev/server-utils/findAvailablePort.ts";

const app = new Hono();

const Layout = (props: { children: any }) => {
  return (
    <html>
      <head>
        <title>Hono + JSX Example</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 min-h-screen">
        <div class="max-w-4xl mx-auto p-8">
          <div class="bg-white shadow-lg rounded-lg p-6">{props.children}</div>
        </div>
      </body>
    </html>
  );
};

app.get("/", (c) => {
  return c.html(
    <Layout>
      <h1 class="text-3xl font-bold text-gray-800 mb-4">
        Hello from Hono + JSX!
      </h1>
      <p class="text-gray-600 mb-6">
        This is a simple example using Hono with JSX in Deno.
      </p>
      <ul class="space-y-2">
        <li>
          <a
            href="/about"
            class="text-blue-600 hover:text-blue-800 hover:underline"
          >
            About
          </a>
        </li>
        <li>
          <a
            href="/static/style.css"
            class="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Static File Example
          </a>
        </li>
      </ul>
    </Layout>
  );
});

app.get("/about", (c) => {
  return c.html(
    <Layout>
      <h1 class="text-3xl font-bold text-gray-800 mb-4">About Page</h1>
      <p class="text-gray-600 mb-6">
        This is the about page rendered with JSX.
      </p>
      <a href="/" class="text-blue-600 hover:text-blue-800 hover:underline">
        Back to Home
      </a>
    </Layout>
  );
});

// Serve static files from the public directory
app.use("/static/*", serveStatic({ root: "./" }));

const port = await findAvailablePort(3000, 3100);
console.log(`HTTP server running on http://localhost:${port}`);

// Use Deno.serve with the --watch flag
if (import.meta.main) {
  Deno.serve({ port: port }, app.fetch);
}
