// Function to get directory contents
export async function getDirectoryContents(path: string): Promise<string[]> {
  const entries = [];
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory) {
      entries.push(entry.name);
    }
  }
  return entries;
}
