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

export function createRouter({ base }: { base: string }) {
  console.log("Router.base", base);
  const currentRoute = signal<Route>({
    path: window.location.pathname.replace(base, ""),
    params: {},
  });

  // Handle browser back/forward
  window.addEventListener("popstate", () => {
    currentRoute.value = {
      path: window.location.pathname.replace(base, ""),
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
      window.history.pushState({}, "", mergeUrl(base, path));
      currentRoute.value = { path, params };
    },
  };
}
