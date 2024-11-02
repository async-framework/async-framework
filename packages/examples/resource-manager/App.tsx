import { createRouter, signal } from "@async/framework";
import { ResourceList } from "./components/ResourceList.tsx";
import { ResourceDetails } from "./components/ResourceDetails.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { Navigation } from "./components/Navigation.tsx";

export function App({ router }: { router: ReturnType<typeof createRouter> }) {
  const currentView = signal<any | null>(null);

  // Simple router logic
  router.current.subscribe(({ path, params }) => {
    console.log("App.router.current", path);
    if (path === "/" || path === "/resources/") {
      currentView.value = <ResourceList router={router} />;
    } else if (path.startsWith("/resources/")) {
      const id = path.split("/")[2];
      currentView.value = <ResourceDetails id={id} router={router} />;
    } else if (path === "/dashboard/") {
      const dashboard = <Dashboard router={router} />;
      currentView.value = dashboard;
    } else {
      currentView.value = <div>404 - Not Found</div>;
    }
  });

  return (
    <div class="min-h-screen bg-gray-100">
      <Navigation router={router} />
      <main class="container mx-auto px-4 py-8">{currentView}</main>
    </div>
  );
}
