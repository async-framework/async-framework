import { computed, createRouter, iif, signal } from "@async/framework";
import { getResources, type Resource } from "../data/mock.ts";

export function ResourceList({
  router,
}: {
  router: ReturnType<typeof createRouter>;
}) {
  const resources = signal<Resource[]>([]);
  const loading = signal(true);
  const searchQuery = signal("");
  const selectedType = signal<Resource["type"] | "all">("all");

  // Load resources
  getResources().then((data) => {
    console.log("grab data", data.length);
    resources.value = data;
    loading.value = false;
  });

  // Filtered resources
  const filteredResources = computed(() => {
    return resources.value.filter(
      (resource) =>
        resource.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
        (selectedType.value === "all" || resource.type === selectedType.value),
    );
  });

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Resources</h1>
        <div class="flex space-x-4">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onInput={(e) => {
              if (e.target instanceof HTMLInputElement) {
                searchQuery.value = e.target.value;
              }
            }}
            class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedType}
            onChange={(e) => {
              if (e.target instanceof HTMLSelectElement) {
                selectedType.value = e.target.value as Resource["type"] | "all";
              }
            }}
            class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="server">Server</option>
            <option value="database">Database</option>
            <option value="storage">Storage</option>
          </select>
        </div>
      </div>

      {iif(
        loading,
        () => (
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto">
            </div>
          </div>
        ),
        () => (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.value.map((resource) => (
              <div
                key={resource.id}
                class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.navigate(`/resources/${resource.id}`)}
              >
                <div class="flex justify-between items-start">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {resource.name}
                  </h3>
                  <span
                    class={computed(
                      () =>
                        `px-2 py-1 rounded-full text-xs font-medium ${
                          resource.status === "active"
                            ? "bg-green-100 text-green-800"
                            : resource.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`,
                    )}
                  >
                    {resource.status}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-2">Type: {resource.type}</p>
                <div class="mt-4">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class={computed(
                        () =>
                          `h-2 rounded-full ${
                            resource.usage > 80
                              ? "bg-red-500"
                              : resource.usage > 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`,
                      )}
                      style={`width: ${resource.usage}%`}
                    >
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">
                    Usage: {resource.usage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ),
      )}
    </div>
  );
}
