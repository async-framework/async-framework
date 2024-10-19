import type { Context } from "hono";
import { generateDirectoryListing } from "./generateDirectoryListing.ts";

// Render the directory listing
export function renderDirectoryListing(directories: string[], renderLink: (dir: string) => string) {
  return (c: Context) => {

    return c.html(/*html*/ `
      <h1>Examples</h1>
      <ul>
        ${generateDirectoryListing(
      directories,
      renderLink
    )}
      </ul>
    `);
  };
}
