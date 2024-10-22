import type { Context } from "hono";
import { generateDirectoryListing } from "./generateDirectoryListing.ts";

// Render the directory listing
export function renderDirectoryListing(
  directories: string[],
  renderLink: (dir: string) => string
) {
  return (c: Context) => {
    return c.html(/*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Examples</title>
  <script src="https://cdn.tailwindcss.com/3.4.5"></script>
  <script type="importmap">
    {
      "imports": {
        "async-framework": "/async-framework.js"
      }
    }
    </script>
  </head>
<body>
  <div class="flex flex-col items-center justify-center">
    <div class="p-4">
      <h1 class="text-3xl font-bold">Examples</h1>
      <div class="pt-4">
        <ul class="list-none">
          ${generateDirectoryListing(directories, renderLink)}
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
    `);
  };
}
