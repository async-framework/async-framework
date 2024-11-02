export type Resource = {
  id: string;
  name: string;
  type: "server" | "database" | "storage";
  status: "active" | "inactive" | "error";
  usage: number;
  lastUpdated: string;
};

export const createMockResources = (
  amount = Math.round(Math.random() * 20),
): Resource[] =>
  Array.from({ length: amount }, (_, i) => ({
    id: `res-${i + 1}`,
    name: `Resource ${i + 1}`,
    type: [
      "server",
      "database",
      "storage",
    ][Math.floor(Math.random() * 3)] as Resource["type"],
    status: [
      "active",
      "inactive",
      "error",
    ][Math.floor(Math.random() * 3)] as Resource["status"],
    usage: Math.floor(Math.random() * 100),
    lastUpdated: new Date(Date.now() - Math.random() * 10000000000)
      .toISOString(),
  }));

let mockResources = createMockResources();
export function getResources(): Promise<Resource[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockResources), 500);
  });
}

export function getResourceById(id: string): Promise<Resource | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockResources.find((r) => r.id === id));
    }, 300);
  });
}

// Update mock resources every 5 seconds
setInterval(() => {
  console.log("updating mock resources");
  mockResources = createMockResources();
}, 5000);
