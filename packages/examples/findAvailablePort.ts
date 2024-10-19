// deno-lint-ignore require-await
export async function findAvailablePort(
  startPort: number,
  endPort: number,
): Promise<number> {
  for (let port = startPort; port <= endPort; port++) {
    try {
      const listener = Deno.listen({ port });
      listener.close();
      return port;
    } catch (err) {
      if (!(err instanceof Deno.errors.AddrInUse)) {
        throw err;
      }
    }
  }
  throw new Error(
    `No available port found between ${startPort} and ${endPort}`,
  );
}
