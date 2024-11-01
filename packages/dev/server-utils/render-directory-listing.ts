import type { Context } from "hono";

// Function to get directory contents
export async function getDirectoryContents(
  directories: AsyncIterable<Deno.DirEntry>,
): Promise<string[]> {
  const entries: string[] = [];
  for await (const entry of directories) {
    if (entry.isDirectory && !entry.name.startsWith("__")) {
      entries.push(entry.name);
    }
  }
  return entries;
}

// Generate HTML for directory listing
export function generateDirectoryListing(
  directories: string[],
  renderLink: (dir: string) => string,
) {
  return directories.sort().map((dir) => renderLink(dir)).join("");
}

// Render the directory listing
export function renderDirectoryListing(
  directories: string[],
  renderLink: (dir: string) => string,
) {
  return (c: Context) => {
    return c.html(/*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Async Framework Examples</title>
  <script src="https://cdn.tailwindcss.com/3.4.5"></script>
  <script type="importmap">
    {
      "imports": {
        "async-framework": "/async-framework.js"
      }
    }
  </script>
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">Async Framework Examples</h1>
      <p class="text-xl text-gray-600">Explore these examples to see Async Framework in action!</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${generateDirectoryListing(directories, renderLink)}
    </div>
  </div>
</body>
</html>
    `);
  };
}
