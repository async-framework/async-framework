// Function to get directory contents
export async function getDirectoryContents(path: string): Promise<string[]> {
  const entries: string[] = [];
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory && !entry.name.startsWith('__')) {
      entries.push(entry.name);
    }
  }
  return entries;
}
