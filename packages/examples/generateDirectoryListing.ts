// Generate HTML for directory listing
export function generateDirectoryListing(
  directories: string[],
  renderLink: (dir: string) => string,
) {
  return directories.map((dir) => renderLink(dir)).join("");
}
