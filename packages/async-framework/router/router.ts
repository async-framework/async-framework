import { signal } from "../signals/index.ts";

export type Route = {
  path: string;
  params: Record<string, string>;
};

function mergeUrl(base: string, path: string) {
  const uri = base + path.replace(/^\//, "");
  if (!uri.endsWith("/")) {
    return uri + "/";
  }
  return uri;
}
function removeBase(base: string, path: string) {
  let uri = path.replace(base, "");
  if (!uri.startsWith("/")) {
    uri = "/" + uri;
  }
  if (!uri.endsWith("/")) {
    uri = uri + "/";
  }
  uri = uri.replace(/\/\//g, "/");
  return uri;
}

export function createRouter({ base }: { base: string }) {
  base = base.endsWith("/") ? base : base + "/";
  const currentPath = removeBase(base, window.location.pathname);
  console.log("Router.base", base, currentPath);
  const currentRoute = signal<Route>({
    path: currentPath,
    params: {},
  });

  // Handle browser back/forward
  window.addEventListener("popstate", () => {
    const currentPath = removeBase(base, window.location.pathname);
    console.log("Router.popstate", currentPath);
    currentRoute.value = {
      path: currentPath,
      params: {},
    };
  });

  return {
    current: currentRoute,
    initialize() {
      // replace history with base
      this.navigate("/", {});
      console.log("Router.initialize", base);
    },
    navigate(path: string, params: Record<string, string> = {}) {
      if (!path.endsWith("/")) {
        path = path + "/";
      }
      const uri = mergeUrl(base, path);
      console.log("Router.navigate", uri);
      window.history.pushState({}, "", uri);
      const routeUrl = removeBase(base, uri);
      console.log("Router.navigate.routeUrl", routeUrl);
      currentRoute.value = { path: routeUrl, params };
    },
  };
}
