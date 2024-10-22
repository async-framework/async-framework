import type { Context, Next } from "hono";

type CacheResponse = {
  body: string;
  headers: Record<string, string>;
  status: number;
};

type CacheType = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options: { ex: number }) => Promise<void>;
};
export const createCache = (
  cache: CacheType | Map<string, string>,
  seconds: number,
): (c: Context, next: Next) => Promise<void | Response> => {
  return async (c: Context, next: Next) => {
    // Get cached response from Redis
    const url = new URL(c.req.url);
    let res = await cache.get(url.pathname);
    res = res ? JSON.parse(res) : null;
    if (
      res && typeof res === "object" && "body" in res && "headers" in res &&
      "status" in res
    ) {
      try {
        console.log("GET: Cache hit for", url.pathname);
        // Parse the cached response
        const { body, status, headers }: CacheResponse = res;

        headers["X-Cache"] = "HIT";

        // Create a new Response object with the cached data
        const response = new Response(body, {
          status: status,
          headers: new Headers(headers),
        });
        return response;
      } catch (e) {
        console.error("Failed to parse cache:", e);
        return await next();
      }
    } else {
      try {
        await next();
      } catch (_e) {
        console.error("Error in cache middleware:");
        return;
      }

      // If the response is not 200, do not cache it
      if (c.res.status !== 200) {
        return;
      }
      const url = new URL(c.req.url);
      console.log("GET: Cache miss for", url.pathname);
      c.header("Cache-Control", `public, max-age=${seconds}`);

      // Clone the response so the body can be read without consuming the stream
      const originalResponse = c.res.clone();

      // Read the response body as text
      const responseBody = await originalResponse.text();

      // Create a cache object
      const cacheResponse: {
        body: string;
        headers: Record<string, string>;
        status: number;
      } = {
        body: responseBody,
        headers: {},
        status: originalResponse.status,
      };

      // Extract headers using forEach
      originalResponse.headers.forEach((value, key) => {
        cacheResponse.headers[key] = value;
      });

      // Store the response in cache
      await cache.set(url.pathname, JSON.stringify(cacheResponse), {
        ex: seconds,
      });

      c.res.headers.set("X-Cache", "MISS");
    }
  };
};
