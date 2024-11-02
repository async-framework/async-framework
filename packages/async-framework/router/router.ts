import { signal } from "../signals/index.ts";

export type Route = {
  path: string;
  params: Record<string, string>;
};

export type RouterConfig = {
  base: string;
  mode?: "hash" | "history";
};

function mergeUrl(base: string, path: string, isHash: boolean) {
  if (isHash) {
    const cleanPath = path.replace(/^\//, "");
    return `#/${cleanPath}`;
  }

  const uri = base + path.replace(/^\//, "");
  if (!uri.endsWith("/")) {
    return uri + "/";
  }
  return uri;
}

function removeBase(base: string, path: string, isHash: boolean) {
  let uri = isHash ? path.replace(/^#\/?/, "") : path.replace(base, "");

  if (!uri.startsWith("/")) {
    uri = "/" + uri;
  }
  if (!uri.endsWith("/")) {
    uri = uri + "/";
  }
  uri = uri.replace(/\/\//g, "/");
  return uri;
}

export function createRouter(config: RouterConfig) {
  const { base, mode = "hash" } = config;
  const isHash = mode === "hash";
  const normalizedBase = !isHash && base.endsWith("/") ? base : base + "/";

  // Get initial path based on mode and handle existing hash
  const initialPath = isHash
    ? (window.location.hash
      ? removeBase(normalizedBase, window.location.hash, true)
      : "/")
    : removeBase(normalizedBase, window.location.pathname, false);

  console.log(
    `Router.${mode}`,
    isHash ? window.location.hash : normalizedBase,
    initialPath,
  );

  const currentRoute = signal<Route>({
    path: initialPath,
    params: {},
  });

  // Handle routing events based on mode
  if (isHash) {
    window.addEventListener("hashchange", () => {
      const currentPath = removeBase(
        normalizedBase,
        window.location.hash,
        true,
      );
      console.log("Router.hashchange", currentPath);
      currentRoute.value = {
        path: currentPath,
        params: {},
      };
    });
  } else {
    window.addEventListener("popstate", () => {
      const currentPath = removeBase(
        normalizedBase,
        window.location.pathname,
        false,
      );
      console.log("Router.popstate", currentPath);
      currentRoute.value = {
        path: currentPath,
        params: {},
      };
    });
  }

  return {
    current: currentRoute,
    initialize() {
      // Only navigate if there's no hash in hash mode, or if we're in history mode
      if (isHash && !window.location.hash) {
        this.navigate("/", {});
      } else if (!isHash) {
        this.navigate("/", {});
      } else {
        // For hash mode with existing hash, just ensure the current route is set
        const currentPath = removeBase(
          normalizedBase,
          window.location.hash,
          true,
        );
        currentRoute.value = { path: currentPath, params: {} };
      }
      console.log(`Router.initialize.${mode}`, normalizedBase);
    },
    navigate(path: string, params: Record<string, string> = {}) {
      if (!path.endsWith("/")) {
        path = path + "/";
      }

      const uri = mergeUrl(normalizedBase, path, isHash);
      console.log("Router.navigate", uri);

      if (isHash) {
        window.location.hash = uri;
      } else {
        window.history.pushState({}, "", uri);
      }

      const routeUrl = removeBase(normalizedBase, uri, isHash);
      console.log("Router.navigate.routeUrl", routeUrl);
      currentRoute.value = { path: routeUrl, params };
    },
  };
}
